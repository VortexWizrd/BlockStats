import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { SSPPCalulator } from "../../../common/ppcalculator.js";
import scoresaberApiService from "../../../service/external/scoresaber-api.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("debug")
    .setDescription(
      "A collection of commands mainly used for debugging that may get used for something in the future",
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("calculatesspp")
        .setDescription("Estimate ScoreSaber pp")
        .addNumberOption((option) =>
          option.setName("stars").setDescription("Star value"),
        )
        .addNumberOption((option) =>
          option
            .setName("accuracy")
            .setDescription("Accuracy (as decimal from 0-1, not percentage)"),
        )
        .addIntegerOption((option) =>
          option
            .setName("score")
            .setDescription("Score (must provide max score if being used)"),
        )
        .addIntegerOption((option) =>
          option
            .setName("maxscore")
            .setDescription(
              "Map max score (must be provided if score is provided)",
            ),
        )
        .addStringOption((option) =>
          option
            .setName("leaderboardid")
            .setDescription("Map leaderboard id (optional)"),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("scoresaberppdiff")
        .setDescription(
          "Get detailed information about the bot's ScoreSaber pp estimation using a ScoreSaber score",
        )
        .addStringOption((option) =>
          option
            .setName("scoreid")
            .setDescription("ScoreSaber score ID")
            .setRequired(true),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "calculatesspp": {
        const accuracy = interaction.options.getNumber("accuracy");
        const leaderboardId = interaction.options.getString("leaderboardid");
        const leaderboard = leaderboardId
          ? await scoresaberApiService.getV1Leaderboard(leaderboardId)
          : undefined;
        const stars =
          interaction.options.getNumber("stars") ?? leaderboard?.stars ?? 0;

        if (accuracy) {
          return await interaction.reply(
            `${SSPPCalulator.getPP(accuracy, stars)}pp`,
          );
        } else {
          const score = interaction.options.getInteger("score");
          const maxScore = interaction.options.getInteger("maxscore");

          if (!score || (!maxScore && !leaderboardId)) {
            return await interaction.reply(
              "Please provide either an accuracy value or both score and maxscore value",
            );
          }

          if (maxScore) {
            return await interaction.reply(
              `${SSPPCalulator.getPP(score / maxScore, stars)}pp`,
            );
          } else if (leaderboard) {
            return await interaction.reply(
              `${SSPPCalulator.getPP(score / (leaderboard?.maxScore ?? 1), stars)}pp`,
            );
          }
        }

        break;
      }
      case "scoresaberppdiff": {
        const scoreId = interaction.options.getString("scoreid");
        if (!scoreId) return await interaction.reply("Provide a score ID");

        const ssData = await scoresaberApiService.getScoreFromId(scoreId);
        const score = ssData?.score;
        if (!score || !score.pp) {
          return await interaction.reply("Invalid score");
        }

        const data = SSPPCalulator.getPPDetailed(
          score.accuracy,
          ssData.leaderboard.realm.stars,
        );

        return await interaction.reply(
          `
          estimate.maxPP=${data.maxPP}
          estimate.maxPPUnrounded=${data.maxPPUnrounded}
          estimate.multiplier=${data.multiplier}
          estimate.pp=${data.estimatedPP}
          estimate.ppunrounded=${data.estimatedPPUnrounded}
          score.stars=${ssData.leaderboard.realm.stars}
          score.pp=${score.pp}
          diff=${score.pp - data.estimatedPP}
          unroundedDiff=${score.pp - data.estimatedPPUnrounded}
          estimate.preciseStarValue=${(score.pp * 10.685333512) / (450 * data.multiplier)}
          estimate.preciseStarValueTest1=${await scoresaberApiService.getPreciseStarValueFromLeaderboard(ssData.leaderboard.id)}
          estimate.preciseStarValueTest2=${await scoresaberApiService.getPreciseStarValueFromScore(score.id)}`,
        );

        break;
      }
    }
  },
};
