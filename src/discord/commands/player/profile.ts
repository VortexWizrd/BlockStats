import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type ColorResolvable,
} from "discord.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import { db } from "../../../db/index.js";
import { playersTable } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { PlayerService } from "../../../service/player.service.js";
import { PlayersRepository } from "../../../repositories/players/players.repository.js";
import { PlayerRankHistoriesRepository } from "../../../repositories/players/playerrankhistories.repository.js";
import type Player from "../../../common/player.js";
import { ScoreService } from "../../../service/score.service.js";
import { emojiMap, typesMap } from "../../common/format.js";
import { MapService } from "../../../service/map.service.js";
import scoresaberApiService from "../../../service/external/scoresaber-api.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Display/manage BlockStats profiles")
    .addSubcommand((cmd) =>
      cmd
        .setName("link")
        .setDescription(
          "Connect your BeatLeader/ScoreSaber accounts (you must link your Discord on your BeatLeader profile)",
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("changescoresaber")
        .setDescription("Connect a different ScoreSaber account to BlockStats"),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("unlink")
        .setDescription(
          "Delete your BlockStats profile (WARNING: ALL data not stored on other sites will be deleted!)",
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("View a BlockStats profile")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of profile embed to show")
            .addChoices(
              { name: "default", value: "show_default" },
              {
                name: "beatleader",
                value: "show_beatleader",
              },
              {
                name: "scoresaber",
                value: "show_scoresaber",
              },
            ),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Discord user")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("search")
            .setDescription("Search for a profile")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("debuginfo")
            .setDescription(
              "Show additional information mainly used for debugging",
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("refresh")
        .setDescription("Reload a BlockStats profile's data")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to refresh")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("list")
        .setDescription("List BlockStats tracked players")
        .addStringOption((option) =>
          option
            .setName("sort")
            .setDescription("Score sort")
            .setRequired(true)
            .addChoices(
              {
                name: "BeatLeader Rank",
                value: "sort_blrank",
              },
              {
                name: "ScoreSaber Rank",
                value: "sort_ssrank",
              },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Page number")
            .setRequired(true),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("color")
        .setDescription("Change your profile's accent color")
        .addStringOption((option) =>
          option
            .setName("hex")
            .setDescription("Hex color value (format example: #3498DB)")
            .setRequired(true),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("getoldscores")
        .setDescription(
          "Get all of your BeatLeader and ScoreSaber scores not saved on BlockStats",
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "link": {
        const beatLeaderData: any =
          await beatleaderApiService.getUserFromDiscord(interaction.user.id);

        if (!beatLeaderData) {
          return await interaction.reply({
            content:
              "Please link your Discord account to your BeatLeader profile by going to https://beatleader.com/signin/socials",
            flags: MessageFlags.Ephemeral,
          });
        }

        const player = await PlayersRepository.findById(interaction.user.id);

        if (!player) {
          try {
            await PlayerService.createPlayer(interaction.user.id);
            const newPlayer = await PlayerService.getPlayer(
              interaction.user.id,
            );
            if (!newPlayer) {
              return await interaction.reply({
                content: "Failed to create profile",
                flags: MessageFlags.Ephemeral,
              });
            }
            await PlayerService.saveOldScores(newPlayer.id);
          } catch (err) {
            console.log(err);
            return await interaction.reply({
              content: "Failed to create profile",
              flags: MessageFlags.Ephemeral,
            });
          }

          return await interaction.reply({
            content: "Profile created successfully!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          return await interaction.reply({
            content: "Profile updated successfully!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      case "unlink": {
        const player = await PlayerService.getPlayer(interaction.user.id);
        if (!player)
          return await interaction.reply({
            content: `Your profile does not exist!`,
            flags: MessageFlags.Ephemeral,
          });

        const confirmButton = new ButtonBuilder()
          .setCustomId("unlink_confirm")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
          .setCustomId("unlink_cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          confirmButton,
          cancelButton,
        );

        const response = await interaction.reply({
          content: `**WARNING**: Your BlockStats user **${player.name}** with **${await ScoreService.countPlayerScores(player.id, false)} lifetime scores** will be deleted. Are you sure you want to continue?`,
          components: [row],
          flags: MessageFlags.Ephemeral,
        });

        try {
          const input = await response.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 15000,
          });

          if (input.customId === "unlink_confirm") {
            await input.update({
              content: "Deleting profile...",
              components: [],
            });

            try {
              await db
                .delete(playersTable)
                .where(eq(playersTable.id, interaction.user.id));
              return await interaction.editReply({
                content: "Successfully deleted profile",
                components: [],
              });
            } catch (err) {
              console.error(
                "[ERROR]: Discord: Profile: Error deleting BlockStats profile: ",
                err,
              );
              return await interaction.editReply({
                content: "Failed to delete profile",
                components: [],
              });
            }
          }
        } catch (err) {
          await interaction.editReply({
            content: "Timed out",
            components: [],
          });
        }
      }

      case "changescoresaber": {
        const player = await PlayerService.getPlayer(interaction.user.id);
        if (!player)
          return await interaction.reply({
            content: `Your profile does not exist! Please use **/profile link** before running this command!`,
            flags: MessageFlags.Ephemeral,
          });
        await PlayerService.markScoreSaberChange(player.id);
        console.log(
          `[LOG] Discord: Profile: Player ${player.name} triggered ScoreSaber account change`,
        );
        return await interaction.reply({
          content: `Profile marked for ScoreSaber change! Please set a new score in game with both your BeatLeader and ScoreSaber to connect your new ScoreSaber account!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      case "show": {
        await interaction.deferReply();

        let player: Player | undefined;

        const userId = interaction.options.getUser("user")?.id;
        const searchQuery = interaction.options.getString("search");

        if (userId) {
          player = await PlayerService.getPlayer(userId);
        } else if (searchQuery) {
          const playerList = await PlayerService.searchPlayer(searchQuery, 1);
          player = playerList[0];
        } else {
          player = await PlayerService.getPlayer(interaction.user.id);
        }

        if (!player) {
          return await interaction.editReply("Profile not found");
        }

        const linkedIds = [
          player.id,
          player.steamId,
          player.oculusId,
          player.questId,
        ];

        let linkedIdsString = "";
        for (const linkedId of linkedIds) {
          if (linkedId == null) continue;
          if (linkedIdsString != "") linkedIdsString += "\n";
          linkedIdsString += linkedId;
        }

        let color: ColorResolvable = parseInt(
          player.accentColor?.slice(1) ?? "",
          16,
        );
        if (!color || Number.isNaN(color)) {
          color = "Blue";
        }

        switch (interaction.options.getString("type")) {
          case "show_beatleader": {
            const blData = await beatleaderApiService.getUserFromId(
              player.beatLeaderId ?? "",
            );
            if (!blData)
              return await interaction.editReply(
                "Failed to get BeatLeader data",
              );

            // Get skillset
            let mapTypeGain: Record<string, number> = {
              acc: 0,
              tech: 0,
              midspeed: 0,
              speed: 0,
              fitbeat: 0,
              linear: 0,
              bombReset: 0,
            };
            let total = 0;
            const topScores = await ScoreService.getPlayerTopBeatLeader(
              player.id,
              100,
              0,
            );
            for (const score of topScores) {
              if (score.blLeaderboardId) {
                const leaderboard =
                  await MapService.getLeaderboardFromBeatLeader(
                    parseInt(score.blLeaderboardId),
                  );
                if (leaderboard) {
                  if (leaderboard.blMapType) {
                    for (const [key, value] of Object.entries(typesMap)) {
                      if ((leaderboard.blMapType & value) !== 0) {
                        if (key in mapTypeGain) {
                          mapTypeGain[key]! += score.ppBL;
                          total += score.ppSS;
                        }
                      }
                    }
                  }
                }
              }
            }

            const sortedSkillsets = Object.entries(mapTypeGain).sort(
              (a, b) => b[1] - a[1],
            );
            const mapTypeNotCounted = Object.values(mapTypeGain).every(
              (value) => value === 0,
            );
            const primarySkillset = sortedSkillsets[0]?.[0];
            const primarySkillsetPercent =
              ((sortedSkillsets[0]?.[1] ?? 0) * 100) / total;
            const secondarySkillset = sortedSkillsets[1]?.[0];
            const secondarySkillsetPercent =
              ((sortedSkillsets[1]?.[1] ?? 0) * 100) / total;

            const embed = new EmbedBuilder()
              .setTitle(player.name)
              .setThumbnail(player.avatar)
              .setDescription(
                `# \u200B${player.blRank ? `${emojiMap.BeatLeader} #${player.blRank}` : ""}${blData.country && blData.countryRank ? ` • :flag_${blData.country.toLowerCase()}: #${blData.countryRank}` : ""}`,
              )
              .setColor(color)
              .addFields({
                name: "Skillset",
                value: mapTypeNotCounted
                  ? "Not tracked"
                  : `${primarySkillset} (${primarySkillsetPercent.toFixed(2)}%)${(secondarySkillset ?? 0 > 0) ? `\n${secondarySkillset} (${secondarySkillsetPercent.toFixed(2)}%)` : ""}`,
                inline: true,
              })
              .setTimestamp();

            return interaction.editReply({
              embeds: [embed],
            });
          }
          case "show_scoresaber": {
            const ssData = await scoresaberApiService.getUserFromId(
              player.scoreSaberId ?? "",
            );
            if (!ssData)
              return await interaction.editReply(
                "Failed to get ScoreSaber data",
              );

            // Get skillset
            let mapTypeGain: Record<string, number> = {
              acc: 0,
              tech: 0,
              midspeed: 0,
              speed: 0,
              fitbeat: 0,
              linear: 0,
              bombReset: 0,
            };
            let total = 0;
            const topScores = await ScoreService.getPlayerTopScoreSaber(
              player.id,
              10000,
              0,
            );
            for (const score of topScores) {
              if (score.ssLeaderboardId) {
                const leaderboard =
                  await MapService.getLeaderboardFromScoreSaber(
                    score.ssLeaderboardId,
                  );
                if (leaderboard && leaderboard.ssRankedStatus == "RANKED") {
                  if (leaderboard.blMapType) {
                    for (const [key, value] of Object.entries(typesMap)) {
                      if ((leaderboard.blMapType & value) !== 0) {
                        if (key in mapTypeGain) {
                          mapTypeGain[key]! += score.ppSS;
                          total += score.ppSS;
                        }
                      }
                    }
                  }
                }
              }
            }

            const sortedSkillsets = Object.entries(mapTypeGain).sort(
              (a, b) => b[1] - a[1],
            );
            const mapTypeNotCounted = Object.values(mapTypeGain).every(
              (value) => value === 0,
            );
            const primarySkillset = sortedSkillsets[0]?.[0];
            const primarySkillsetPercent =
              ((sortedSkillsets[0]?.[1] ?? 0) * 100) / total;
            const secondarySkillset = sortedSkillsets[1]?.[0];
            const secondarySkillsetPercent =
              ((sortedSkillsets[1]?.[1] ?? 0) * 100) / total;

            const embed = new EmbedBuilder()
              .setTitle(player.name)
              .setThumbnail(player.avatar)
              .setDescription(
                `# \u200B${player.ssRank ? `${emojiMap.ScoreSaber} #${player.ssRank}` : ""}${ssData.country && ssData.stats.countryRank ? ` • :flag_${ssData.country.toLowerCase()}: #${ssData.stats.countryRank}` : ""}`,
              )
              .setColor(color)
              .addFields({
                name: "Skillset",
                value: mapTypeNotCounted
                  ? "Not tracked"
                  : `${primarySkillset} (${primarySkillsetPercent.toFixed(2)}%)${(secondarySkillset ?? 0 > 0) ? `\n${secondarySkillset} (${secondarySkillsetPercent.toFixed(2)}%)` : ""}`,
                inline: true,
              })
              .setTimestamp();

            return interaction.editReply({
              embeds: [embed],
            });
          }
          default: {
            const linkText = `[[ ${emojiMap.BeatLeader} BeatLeader ](https://beatleader.com/u/${player.alias ?? player.steamId ?? player.oculusId ?? player.questId}) | [ ${emojiMap.Discord} Discord ](https://discord.com/users/${player.id})${player.scoreSaberId ? ` | [ ${emojiMap.ScoreSaber} ScoreSaber ](https://scoresaber.com/u/${player.scoreSaberId})` : ""}]`;
            const embed = new EmbedBuilder()
              .setTitle(player.name)
              .setThumbnail(player.avatar)
              .setDescription(
                `${linkText}\n# ${player.ssRank ? `${emojiMap.ScoreSaber} #${player.ssRank} • ` : ""}${player.blRank ? `${emojiMap.BeatLeader} #${player.blRank}` : ""}`,
              )
              .setColor(color)
              .addFields(
                {
                  name: "Current Scores",
                  value: (
                    (await ScoreService.countPlayerScores(player.id, true)) ?? 0
                  ).toString(),
                  inline: true,
                },
                {
                  name: "Lifetime Scores",
                  value: (
                    (await ScoreService.countPlayerScores(player.id, false)) ??
                    0
                  ).toString(),
                  inline: true,
                },
              )
              .setFooter({
                text: `ID: ${player.id}`,
              })
              .setTimestamp();
            if (interaction.options.getBoolean("debuginfo")) {
              embed.addFields({
                name: "Linked IDs",
                value: linkedIdsString,
                inline: true,
              });
            }

            return interaction.editReply({
              embeds: [embed],
            });

            break;
          }
        }
        break;
      }

      case "refresh": {
        await interaction.deferReply();

        const userId =
          interaction.options.getUser("user")?.id ?? interaction.user.id;
        const player = await PlayerService.getPlayer(userId);

        if (!player) {
          return await interaction.editReply("Profile not found");
        }

        await PlayerService.refreshPlayer(player.id);
        interaction.editReply("Refreshed player!");
      }

      case "list":
        {
          const sort = interaction.options.getString("sort")!;
          const page = interaction.options.getInteger("page")!;
          if (page <= 0 || page * 10 > (await PlayerService.count()))
            return await interaction.reply({
              content: "Invalid page number",
              flags: MessageFlags.Ephemeral,
            });
          const offset = (page - 1) * 10;
          let players: Player[] = [];
          let title = "Players";
          let playersIndex = 1 + offset;
          let playersText = `\`\`\`ansi\n`;
          if (sort == "sort_blrank") {
            players = await PlayerService.getTopBL(10, offset);
            if (players.length == 0) {
              return await interaction.reply({
                content: "Invalid page number",
                flags: MessageFlags.Ephemeral,
              });
            }
            title =
              "<:beatleader:1492695343345832102> Top Players on BeatLeader";
            for (const player of players) {
              if (playersText != "") playersText += "\n";
              const indexText = `${playersIndex}. `;
              const rankHistory =
                await PlayerRankHistoriesRepository.getFromRange(
                  player.id,
                  "BeatLeader",
                  Date.now() - 1000 * 60 * 60 * 24,
                  Date.now(),
                );

              let rankDifference = 0;
              if (!rankHistory || rankHistory.length === 0) {
                rankDifference = 0;
              } else if (rankHistory.length === 1) {
                const latestRows =
                  (await PlayerRankHistoriesRepository.getLatestRows(
                    player.id,
                    "BeatLeader",
                    2,
                  )) ?? [];
                const previousRank = latestRows[1]?.rank ?? 0;
                rankDifference = (rankHistory[0]?.rank ?? 0) - previousRank;
              } else {
                rankDifference =
                  (rankHistory[0]?.rank ?? 0) -
                  (rankHistory[rankHistory.length - 1]?.rank ?? 0);
              }
              const rankDifferenceText = `${rankDifference < 0 ? `+${Math.abs(rankDifference)}` : rankDifference > 0 ? `-${Math.abs(rankDifference)}` : ""}`;
              const rankDifferenceColorText = `${rankDifference < 0 ? `[32m${rankDifferenceText}[0m` : rankDifference > 0 ? `[31m${rankDifferenceText}[0m` : ""}`;
              const rankText = `#${player.blRank}`;

              let spacing = "";
              let playerName = player.name;
              if (
                playerName.length +
                  indexText.length +
                  rankDifferenceText.length +
                  rankText.length >
                27
              ) {
                playerName =
                  playerName.substring(
                    0,
                    27 - indexText.length - rankText.length,
                  ) + "...";
              }
              do {
                spacing += " ";
              } while (
                playerName.length +
                  indexText.length +
                  rankDifferenceText.length +
                  rankText.length +
                  spacing.length <
                33
              );

              playersText += `${indexText}${playerName}${spacing}${rankDifferenceColorText} ${rankText}`;
              playersIndex++;
            }
            playersText += `\`\`\``;
          } else if (sort == "sort_ssrank") {
            players = await PlayerService.getTopSS(10, offset);
            if (players.length == 0) {
              return await interaction.reply({
                content: "Invalid page number",
                flags: MessageFlags.Ephemeral,
              });
            }
            title =
              "<:scoresaber:1492695389634035823> Top Players on ScoreSaber";
            for (const player of players) {
              if (playersText != "") playersText += "\n";
              const indexText = `${playersIndex}. `;
              const rankHistory =
                await PlayerRankHistoriesRepository.getFromRange(
                  player.id,
                  "ScoreSaber",
                  Date.now() - 1000 * 60 * 60 * 24,
                  Date.now(),
                );

              let rankDifference = 0;
              if (!rankHistory || rankHistory.length === 0) {
                rankDifference = 0;
              } else if (rankHistory.length === 1) {
                const latestRows =
                  (await PlayerRankHistoriesRepository.getLatestRows(
                    player.id,
                    "ScoreSaber",
                    2,
                  )) ?? [];
                const previousRank = latestRows[1]?.rank ?? 0;
                rankDifference = (rankHistory[0]?.rank ?? 0) - previousRank;
              } else {
                rankDifference =
                  (rankHistory[0]?.rank ?? 0) -
                  (rankHistory[rankHistory.length - 1]?.rank ?? 0);
              }
              const rankDifferenceText = `${rankDifference < 0 ? `+${Math.abs(rankDifference)}` : rankDifference > 0 ? `-${Math.abs(rankDifference)}` : ""}`;
              const rankDifferenceColorText = `${rankDifference < 0 ? `[32m${rankDifferenceText}[0m` : rankDifference > 0 ? `[31m${rankDifferenceText}[0m` : ""}`;
              const rankText = `#${player.ssRank}`;

              let spacing = "";
              let playerName = player.name;
              if (
                playerName.length +
                  indexText.length +
                  rankDifferenceText.length +
                  rankText.length >
                27
              ) {
                playerName =
                  playerName.substring(
                    0,
                    27 - indexText.length - rankText.length,
                  ) + "...";
              }
              do {
                spacing += " ";
              } while (
                playerName.length +
                  indexText.length +
                  rankDifferenceText.length +
                  rankText.length +
                  spacing.length <
                33
              );

              playersText += `${indexText}${playerName}${spacing}${rankDifferenceColorText} ${rankText}`;
              playersIndex++;
            }
            playersText += `\`\`\``;
          }

          const embed = new EmbedBuilder()
            .setTitle(`${title} (Page ${page})`)
            .setDescription(playersText)
            .setTimestamp()
            .setColor("Blue");

          return interaction.reply({ embeds: [embed] });
        }
        break;

      case "color": {
        const color = interaction.options.getString("hex");
        if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
          return interaction.reply({
            content: "Invalid color format",
            flags: MessageFlags.Ephemeral,
          });
        }
        const colorValue = parseInt(color.slice(1), 16);
        if (Number.isNaN(color)) {
          return interaction.reply({
            content: "Invalid color format",
            flags: MessageFlags.Ephemeral,
          });
        }

        const player = await PlayerService.getPlayer(interaction.user.id);
        if (!player)
          return interaction.reply({
            content:
              "You must link your profile using **/profile link** before running this command!",
            flags: MessageFlags.Ephemeral,
          });

        await PlayerService.setPlayerAccentColor(player.id, color);
        return interaction.reply({
          content: "Accent color updated successfully!",
          flags: MessageFlags.Ephemeral,
        });
      }

      case "getoldscores": {
        const player = await PlayerService.getPlayer(interaction.user.id);
        if (!player)
          return await interaction.reply(
            "Please link your profile using **/profile link** before running this command!",
          );
        interaction.reply(
          "Fetching scores... (to check progress, use /profile show)",
        );
        await PlayerService.saveOldScores(player.id);
        interaction.editReply("Done!");
      }
    }
  },
};
