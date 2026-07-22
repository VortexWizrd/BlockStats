import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
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
import { link } from "node:fs";

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
        .setName("unlink")
        .setDescription(
          "Delete your BlockStats profile (WARNING: ALL data not stored on other sites will be deleted!)",
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("show")
        .setDescription("View a BlockStats profile")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to view")
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
          await PlayerService.createPlayer(interaction.user.id);

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
        try {
          await db
            .delete(playersTable)
            .where(eq(playersTable.id, interaction.user.id));
          return await interaction.reply("Successfully deleted profile");
        } catch (err) {
          console.error(
            "[ERROR]: Discord: Profile: Error deleting BlockStats profile: ",
            err,
          );
        }
      }

      case "show": {
        await interaction.deferReply();

        const userId =
          interaction.options.getUser("user")?.id ?? interaction.user.id;
        const player = await PlayerService.getPlayer(userId);

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
          if (linkedId == null)
            if (linkedIdsString != "") linkedIdsString += "\n";
          linkedIdsString += linkedId;
        }

        const linkText = `[[ <:beatleader:1492695343345832102> BeatLeader ](https://beatleader.com/u/${player.alias ?? player.steamId ?? player.oculusId ?? player.questId}) | [ <:discord:1492695870343221323> Discord ](https://discord.com/users/${player.id})${player.scoreSaberId ? ` | [ <:scoresaber:1492695389634035823> ScoreSaber ](https://scoresaber.com/u/${player.scoreSaberId})` : ""}]`;

        const embed = new EmbedBuilder()
          .setTitle(player.name)
          .setThumbnail(player.avatar)
          .setDescription(
            `${linkText}\n# ${player.ssRank ? `<:scoresaber:1492695389634035823> #${player.ssRank} • ` : ""}${player.blRank ? `<:beatleader:1492695343345832102> #${player.blRank}` : ""}`,
          )
          .setColor("Blue")
          .addFields(
            {
              name: "Scores",
              value: (
                (await ScoreService.countPlayerScores(player.id, true)) ?? 0
              ).toString(),
              inline: true,
            },
            {
              name: "Total Scores",
              value: (
                (await ScoreService.countPlayerScores(player.id, false)) ?? 0
              ).toString(),
              inline: true,
            },
            {
              name: "Linked IDs",
              value: linkedIdsString,
              inline: true,
            },
          );

        return interaction.editReply({
          embeds: [embed],
        });
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
          let playersText = `\`\`\``;
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
              const rankText = `#${player.blRank}`;
              let spacing = "";
              let playerName = player.name;
              if (playerName.length + indexText.length + rankText.length > 30) {
                playerName = playerName.substring(
                  0,
                  35 - indexText.length - rankText.length,
                );
              }
              do {
                spacing += " ";
              } while (
                playerName.length +
                  indexText.length +
                  rankText.length +
                  spacing.length <
                40
              );

              playersText += `${indexText}${playerName}${spacing}${rankText}`;
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
              const rankText = `#${player.ssRank}`;
              let spacing = "";
              let playerName = player.name;
              if (playerName.length + indexText.length + rankText.length > 30) {
                playerName = playerName.substring(
                  0,
                  35 - indexText.length - rankText.length,
                );
              }
              do {
                spacing += " ";
              } while (
                playerName.length +
                  indexText.length +
                  rankText.length +
                  spacing.length <
                40
              );

              playersText += `${indexText}${playerName}${spacing}${rankText}`;
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
