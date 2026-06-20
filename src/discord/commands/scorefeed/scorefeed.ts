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
import { PlayersRepository } from "../../../repositories/players.repository.js";
import { ScoreFeedsRepository } from "../../../repositories/scorefeeds.repository.js";
import ScoreFeed from "../../../common/scorefeed.js";
import { ScoreFeedService } from "../../../service/scorefeed.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("scorefeed")
    .setDescription("Create/manage score feeds")
    .addSubcommand((cmd) =>
      cmd
        .setName("new")
        .setDescription("Create a new score feed")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Score feed type")
            .addChoices(
              { name: "default", value: "default" },
              { name: "global", value: "global" },
            )
            .setRequired(true),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "new":
        if (!interaction.guild) {
          const existingFeed = await ScoreFeedsRepository.findByUserId(
            interaction.user.id,
          );

          if (existingFeed) {
            return await interaction.reply({
              content: "Personal score feed already set up!",
              flags: MessageFlags.Ephemeral,
            });
          }

          const newFeed = new ScoreFeed({
            id: undefined,
            type: interaction.options.getString("type") ?? "global",
            channelType: "user",
            displayType: "embed",
            userId: interaction.user.id,
            guildId: null,
            channelId: null,
            playerIds: [],
            hasFilters: false,
            ssRanked: null,
            blRanked: null,
            asRanked: null,
            managerRoleId: null,
            minRank: null,
          });

          await ScoreFeedService.createScoreFeed(newFeed);

          return interaction.reply("Score feed created!");
        }
    }
  },
};
