import {
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

        console.log(maps);
        for (const map of maps) {
          for (const leaderboard of (await MapService.getLeaderboardsFromMap(
            map.id,
          )) ?? []) {
            console.log(leaderboard);
            let description =
              "" + map.mapAuthor ? `**Mapped by ${map.mapAuthor}**\n\n` : "";
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
                    )
                    .setFooter({
                      text: `ID: ${leaderboard.id} • Map ID: ${map.id}`,
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
