import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { MapService } from "../../../service/map.service.js";
import Map from "../../../common/map/map.js";
import { LeaderboardsRepository } from "../../../repositories/maps/leaderboards.repository.js";
import crypto from "crypto";
import * as unzipper from "unzipper";
import { PlayerService } from "../../../service/player.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("Display/manage maps")
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("Display map information")
        .addStringOption((option) =>
          option
            .setName("beatsaverid")
            .setDescription("Map BeatSaver ID")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("search")
            .setDescription("Search by song title")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("includeoutdated")
            .setDescription("Include outdated leaderboards")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("upload")
        .setDescription("Upload a deleted map")
        .addStringOption((option) =>
          option.setName("maplink").setDescription("Map download link"),
        )
        .addAttachmentOption((option) =>
          option.setName("mapfile").setDescription("Map zip file"),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "show": {
        await interaction.deferReply();

        let maps: Map[] = [];
        let mapCount = 0;

        const beatsaverId = interaction.options.getString("beatsaverid");
        if (beatsaverId) {
          maps = maps.concat(
            (await MapService.getMapFromBeatSaverId(beatsaverId)) ?? [],
          );
        } else {
          const search = interaction.options.getString("search");
          if (!search)
            return await interaction.editReply("Missing search parameter");
          maps = await MapService.searchMap(search, 10);
        }

        let embeds = [];
        for (const map of maps) {
          if (
            !interaction.options.getBoolean("includeoutdated") &&
            map.outdated
          )
            continue;
          mapCount++;
          let description =
            ("" + map.mapAuthor ? `**Mapped by ${map.mapAuthor}**\n\n` : "") +
            map.songDescription;
          try {
            if (!interaction.channel?.isSendable()) {
              return await interaction.editReply(
                "You must be a in a text channel to run this command!",
              );
            }
            const buttons = new ActionRowBuilder<ButtonBuilder>();
            const download = await MapService.getMapDownloadLink(map.id);
            if (download) {
              buttons.addComponents(
                new ButtonBuilder()
                  .setLabel("Download")
                  .setURL(download)
                  .setStyle(ButtonStyle.Link),
              );
            } 
            interaction.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    `${map.songAuthor ? map.songAuthor + " - " : ""}${map.songName} ${map.songSubName}`,
                  )
                  .setDescription(description)
                  .setURL(
                    map.beatSaverId
                      ? `https://beatsaver.com/maps/${map.beatSaverId}`
                      : null,
                  )
                  .setColor("Blue")
                  .setThumbnail(map.songCover)
                  .addFields(
                    {
                      name: "BPM",
                      value: map.songBPM
                        ? map.songBPM.toString()
                        : "Not stored",
                      inline: true,
                    },
                    {
                      name: "Song Length",
                      value: map.songDuration
                        ? Math.floor(map.songDuration / 60).toString() +
                          ":" +
                          (map.songDuration % 60).toString()
                        : "Not stored",
                      inline: true,
                    },
                    {
                      name: "Difficulties",
                      value: (
                        (await LeaderboardsRepository.countFromMap(map.id)) ?? 0
                      ).toString(),
                      inline: true,
                    },
                    {
                      name: "Uploaded",
                      value: map.uploadedTime
                        ? `<t:${Math.floor(new Date(map.uploadedTime).getTime() / 1000)}:R>`
                        : "Not stored",
                      inline: true,
                    },
                    {
                      name: "Outdated",
                      value:
                        map.outdated != null
                          ? map.outdated.toString()
                          : "Not stored",
                      inline: true,
                    },
                    {
                      name: "Hash",
                      value: map.hash,
                      inline: true,
                    },
                  )
                  .setFooter({
                    text: `ID: ${map.id}`,
                  })
                  .setTimestamp(),
              ],
              components: buttons.components.length > 0 ? [buttons] : [],
            });
          } catch (err) {
            console.error(
              `[ERROR]: Discord: failed to send leaderboard information: `,
              err,
            );
          }
        }

        await interaction.editReply(
          `Found ${mapCount} map${mapCount == 1 ? "" : "s"}!`,
        );
      }

      case "upload": {
        const player = await PlayerService.getPlayer(interaction.user.id);
        if (!player)
          return await interaction.reply(
            "Make a BlockStats profile using **/profile link** before using this command!",
          );

        const link = interaction.options.getString("maplink") ?? "";

        const file = await (async () => {
          const response = await fetch(link ?? "");
          if (response.ok) {
            return response;
          }
        })();

        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const zipBuffer = Buffer.from(arrayBuffer);

        const hash = await getMapHash(zipBuffer);
        console.log(hash);

        if (!hash) {
          return await interaction.reply("Invalid map");
        }

        const map = await MapService.getMapFromHash(hash);
        if (!map) {
          return await interaction.reply(
            "Please submit a new score on the map before uplading!",
          );
        }

        const mapDownload = await MapService.createMapDownload({
          mapId: map.id,
          url: link,
          uploaderId: player.id,
        });

        if (!mapDownload)
          return await interaction.reply("An unknown error occurred");

        return await interaction.reply({
          content: `Saved download link for **${map.songAuthor} - ${map.songName} by ${map.mapAuthor}** (hash: ${hash})`,
          files: [
            {
              attachment: mapDownload.url,
            },
          ],
        });

        async function getMapHash(
          zipBuffer: Buffer,
        ): Promise<string | undefined> {
          const directory = await unzipper.Open.buffer(zipBuffer);

          const infoDatEntry = directory.files.find((f) =>
            f.path.toLowerCase().endsWith("info.dat"),
          );

          if (!infoDatEntry) {
            return;
          }

          const infoDatBuffer = await infoDatEntry.buffer();
          const infoDatContent = infoDatBuffer.toString("utf8");

          const infoJson = JSON.parse(infoDatContent);

          const hashDataBuffer = await extractHashData(directory, infoJson);

          const hash = crypto.createHash("sha1");
          hash.update(infoDatBuffer);
          hash.update(hashDataBuffer);
          const mapHash = hash.digest("hex").padStart(40, "0");

          return mapHash;
        }

        async function extractHashData(
          directory: unzipper.CentralDirectory,
          infoJson: any,
        ): Promise<Buffer> {
          const diffBuffers: Buffer[] = [];

          const beatmapSets =
            infoJson._difficultyBeatmapSets ||
            infoJson.difficultyBeatmapSets ||
            [];

          for (const set of beatmapSets) {
            const diffs =
              set._difficultyBeatmaps || set.difficultyBeatmaps || [];

            for (const diff of diffs) {
              const filename = diff._beatmapFilename || diff.beatmapFilename;
              if (!filename) continue;

              const diffEntry = directory.files.find((f) =>
                f.path.toLowerCase().endsWith(filename.toLowerCase()),
              );

              if (diffEntry) {
                const buffer = await diffEntry.buffer();
                diffBuffers.push(buffer);
              }
            }
          }

          return Buffer.concat(diffBuffers);
        }
      }
    }
  },
};
