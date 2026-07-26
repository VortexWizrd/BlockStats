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
import { DifficultyColor } from "../../../common/map/leaderboard.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Display/manage leaderboards")
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("Display leaderboard information")
        .addStringOption((option) =>
          option
            .setName("beatsaverid")
            .setDescription("Map BeatSaver ID")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("search")
            .setDescription("Search term")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("includeoutdated")
            .setDescription("Include outdated leaderboards")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "show": {
        await interaction.deferReply();

        let maps: Map[] = [];
        let leaderboardCount = 0;

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

        for (const map of maps) {
          if (
            !interaction.options.getBoolean("includeoutdated") &&
            map.outdated
          )
            continue;
          for (const leaderboard of (await MapService.getLeaderboardsFromMap(
            map.id,
          )) ?? []) {
            leaderboardCount++;
            let description =
              "" + map.mapAuthor ? `**Mapped by ${map.mapAuthor}**\n\n` : "";
            try {
              if (!interaction.channel?.isSendable()) {
                return await interaction.editReply(
                  "You must be a in a text channel to run this command!",
                );
              }
              const embed = new EmbedBuilder()
                .setTitle(
                  `${map.songAuthor ? map.songAuthor + " - " : ""}${map.songName} ${map.songSubName ? map.songSubName + " " : ""}[${leaderboard.characteristic} ${leaderboard.difficulty}]`,
                )
                .setDescription(description)
                .setURL(
                  map.beatSaverId
                    ? `https://beatsaver.com/maps/${map.beatSaverId}`
                    : null,
                )
                .setColor(DifficultyColor[leaderboard.difficulty])
                .setThumbnail(map.songCover)
                .addFields(
                  {
                    name: "Notes",
                    value: leaderboard.notes
                      ? leaderboard.notes.toString()
                      : "Not stored",
                    inline: true,
                  },
                  {
                    name: "Bombs",
                    value: leaderboard.bombs
                      ? leaderboard.bombs.toString()
                      : "Not stored",
                    inline: true,
                  },
                  {
                    name: "Walls",
                    value: leaderboard.obstacles
                      ? leaderboard.obstacles.toString()
                      : "Not stored",
                    inline: true,
                  },
                  {
                    name: "NJS",
                    value: leaderboard.njs
                      ? leaderboard.njs.toString()
                      : "Not stored",
                    inline: true,
                  },
                  {
                    name: "NPS",
                    value: leaderboard.nps
                      ? leaderboard.nps.toString()
                      : "Not stored",
                    inline: true,
                  },
                  {
                    name: "BeatLeader",
                    value:
                      leaderboard.blRankedStatus == "5" &&
                      leaderboard.blStarRating
                        ? leaderboard.blStarRating.toString() + "★"
                        : "unranked",
                    inline: true,
                  },
                  {
                    name: "ScoreSaber",
                    value:
                      leaderboard.ssRankedStatus == "RANKED" &&
                      leaderboard.ssStarRating
                        ? leaderboard.ssStarRating.toString() + "★"
                        : leaderboard.ssRankedStatus
                          ? leaderboard.ssRankedStatus.toLowerCase()
                          : "unranked",
                    inline: true,
                  },
                  {
                    name: "AccSaber",
                    value:
                      leaderboard.asComplexity && leaderboard.asCategoryCode
                        ? leaderboard.asComplexity.toString() +
                          ` (${leaderboard.asCategoryCode})`
                        : "unranked",
                    inline: true,
                  },
                  {
                    name: "Hash",
                    value: map.hash,
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
                )

                .setFooter({
                  text: `ID: ${leaderboard.id} • Map ID: ${map.id}`,
                })
                .setTimestamp();

              const buttons = new ActionRowBuilder<ButtonBuilder>();
              if (leaderboard.blLeaderboardId) {
                buttons.addComponents(
                  new ButtonBuilder()
                    .setLabel("BeatLeader")
                    .setURL(
                      `https://beatleader.com/leaderboard/global/${leaderboard.blLeaderboardId}`,
                    )
                    .setEmoji("1492695343345832102")
                    .setStyle(ButtonStyle.Link),
                );
              }
              if (leaderboard.asLeaderboardId) {
                buttons.addComponents(
                  new ButtonBuilder()
                    .setLabel("AccSaber")
                    .setURL(
                      `https://accsaber.com/maps/${map.beatSaverId}?difficulty=${leaderboard.difficulty == "Expert+" ? "expert-plus" : leaderboard.difficulty.toLowerCase()}`,
                    )
                    .setEmoji("1511190711431593994")
                    .setStyle(ButtonStyle.Link),
                );
              }
              interaction.channel.send({
                embeds: [embed],
                components: [buttons],
              });
            } catch (err) {
              console.error(
                `[ERROR]: Discord: failed to send leaderboard information: `,
                err,
              );
            }
          }
        }

        await interaction.editReply(
          `Found ${leaderboardCount} leaderboard${leaderboardCount == 1 ? "" : "s"}!`,
        );
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
