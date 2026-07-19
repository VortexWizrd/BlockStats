import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { MapService } from "../../../service/map.service.js";
import Map from "../../../common/map/map.js";

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
            .setName("title")
            .setDescription("Search by song title")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "show": {
        await interaction.deferReply();

        let maps: Map[] = [];

        const beatsaverId = interaction.options.getString("beatsaverid");
        if (beatsaverId) {
          maps = maps.concat(
            (await MapService.getMapFromBeatSaverId(beatsaverId)) ?? [],
          );
        } else {
          const search = interaction.options.getString("title");
          if (!search)
            return await interaction.editReply("Missing search parameter");
          return await interaction.editReply("Not implemented");
        }

        let embeds = [];
        for (const map of maps) {
          let description =
            ("" + map.mapAuthor ? `**Mapped by ${map.mapAuthor}**\n\n` : "") +
            map.songDescription;
          try {
            if (!interaction.channel?.isSendable()) {
              return await interaction.editReply(
                "You must be a in a text channel to run this command!",
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
                      value: map.leaderboardIds.length.toString(),
                      inline: true,
                    },
                    {
                      name: "Uploaded",
                      value: map.uploadedTime
                        ? `<t:${Math.floor(new Date(map.uploadedTime).getTime() / 1000)}:R>`
                        : "Not stored",
                      inline: true,
                    },
                  )
                  .setFooter({
                    text: `ID: ${map.id}`,
                  })
                  .setTimestamp(),
              ],
            });
          } catch (err) {
            console.error(
              `[ERROR]: Discord: failed to send leaderboard information: `,
              err,
            );
          }
        }

        await interaction.editReply("Done!");
      }
    }
  },
};

function getIds(beatLeaderData: any): Promise<Object> {
  const linkedIds = beatLeaderData.linkedIds;
  if (beatLeaderData.alias) {
    linkedIds["alias"] = beatLeaderData.alias;
  }
  return linkedIds;
}
