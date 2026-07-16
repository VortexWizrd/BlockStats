import {
  ChatInputCommandInteraction,
  DMChannel,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import { db } from "../../../db/index.js";
import { playersTable } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { PlayerService } from "../../../service/player.service.js";
import { PlayersRepository } from "../../../repositories/players/players.repository.js";
import { PlayerRankHistoriesRepository } from "../../../repositories/players/playerrankhistories.repository.js";
import { ScoreService } from "../../../service/score.service.js";
import ScoreDisplay from "../../common/ScoreDisplay.js";

export default {
  data: new SlashCommandBuilder()
    .setName("score")
    .setDescription("Display/manage BlockStats scores")
    .addSubcommand((cmd) =>
      cmd
        .setName("list")
        .setDescription("List BlockStats tracked scores")
        .addStringOption((option) =>
          option
            .setName("sort")
            .setDescription("Score sort")
            .setRequired(true)
            .addChoices({
              name: "recent",
              value: "sort_recent",
            }),
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
        .setName("show")
        .setDescription("Show a saved score")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Score ID").setRequired(true),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "list": {
        const sort = interaction.options.getString("sort")!;
        const page = interaction.options.getInteger("page")!;
        if (page <= 0)
          return await interaction.reply({
            content: "Invalid page number",
            flags: MessageFlags.Ephemeral,
          });
        const offset = (page - 1) * 5;
        if (sort == "sort_recent") {
          const scores = await ScoreService.getRecent(5, offset);
          let scoreIndex = 1 + offset;
          let scoresText = ``;
          for (const score of scores) {
            if (scoresText != "") scoresText += "\n";
            let scoreTitle = `${score.playerName} - ${score.songName}`;
            if (scoreTitle.length > 30)
              scoreTitle = scoreTitle.substring(0, 29) + " ...";
            scoresText += `### \u200B${scoreIndex}. ${scoreTitle} [${score.songDifficulty}]\n - **#${score.blRank ?? score.ssRank ?? "-"} • ${(score.accuracy * 100).toFixed(2)}% • ${score.fullCombo ? "FC" : `${score.missedNotes + score.badCuts}❌`}** [id: \`${score.id}\`]`;
            scoreIndex++;
          }
          const embed = new EmbedBuilder()
            .setTitle(`Recent Scores (Page ${page})`)
            .setDescription(scoresText)
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }
        break;
      }
      case "show": {
        const scoreId = interaction.options.getInteger("id");
        if (!scoreId)
          return await interaction.reply({
            content: "You must provide a score ID!",
            flags: MessageFlags.Ephemeral,
          });

        const score = await ScoreService.getScore(scoreId);
        if (!score)
          return await interaction.reply({
            content: "Score not found.",
            flags: MessageFlags.Ephemeral,
          });

        const embed = await ScoreDisplay.getEmbed(score);
        const buttons = ScoreDisplay.getButtons(
          score.upVoteIds.length,
          score.downVoteIds.length,
        );
        if (!embed || !buttons)
          return await interaction.reply({
            content: "Failed to get score",
            flags: MessageFlags.Ephemeral,
          });

        const message =
          interaction.channel instanceof TextChannel
            ? await interaction.channel.send({
                embeds: [embed],
                components: [buttons],
              })
            : await interaction.user.send({
                embeds: [embed],
                components: [buttons],
              });

        if (!message.channel) return;

        if (message.guild) {
          ScoreService.addDiscordMessage({
            id: score.id,
            type: "guild",
            messageId: message.id,
            guildId: message.guild.id,
            channelId: message.channel.id,
            userId: null,
          });
        } else if (message.channel instanceof DMChannel) {
          ScoreService.addDiscordMessage({
            id: score.id,
            type: "user",
            messageId: message.id,
            guildId: null,
            channelId: null,
            userId: interaction.user.id,
          });
        }

        interaction.reply({
          content: "Loaded score!",
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
    }
  },
};
