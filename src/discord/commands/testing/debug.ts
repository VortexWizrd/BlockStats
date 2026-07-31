import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { SSPPCalulator } from "../../../common/ppcalculator.js";

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
          option
            .setName("stars")
            .setDescription("Star value")
            .setRequired(true),
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
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "calculatesspp": {
        const stars = interaction.options.getNumber("stars");
        const accuracy = interaction.options.getNumber("accuracy");

        if (!stars)
          return await interaction.reply("Please provide a star rating");

        if (accuracy) {
          return await interaction.reply(
            `${SSPPCalulator.getPPalt(accuracy, stars)}pp`,
          );
        } else {
          const score = interaction.options.getInteger("score");
          const maxScore = interaction.options.getInteger("maxscore");

          if (!score || !maxScore) {
            return await interaction.reply(
              "Please provide either an accuracy value or both score and maxscore value",
            );
          }

          return await interaction.reply(
            `${SSPPCalulator.getPPalt(score / maxScore, stars)}pp`,
          );
        }

        break;
      }
    }
  },
};
