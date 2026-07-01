import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { RankFeedsRepository } from "../../../repositories/rankfeeds.repository.js";
import RankFeed from "../../../common/rankfeed.js";
import { RankFeedService } from "../../../service/rankfeed.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rankfeed")
    .setDescription("Create/manage rank feeds")
    .addSubcommand((cmd) =>
      cmd
        .setName("new")
        .setDescription("Create a new rank feed")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Rank feed type")
            .addChoices(
              { name: "default", value: "default" },
              { name: "global", value: "global" },
            )
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("manager-role")
            .setDescription("Set role for others to manage the feed")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "new":
        if (!interaction.guild) {
          const existingFeed = await RankFeedsRepository.findByUserId(
            interaction.user.id,
          );

          if (existingFeed) {
            return await interaction.reply({
              content: "Personal rank feed already set up!",
              flags: MessageFlags.Ephemeral,
            });
          }

          const newFeed = new RankFeed({
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

          await RankFeedService.createRankFeed(newFeed);

          return interaction.reply("Rank feed created!");
        } else {
          if (
            !interaction.channel ||
            !(interaction.channel instanceof TextChannel)
          )
            return interaction.reply({
              content: "You must be in a text channel to use this command!",
              flags: MessageFlags.Ephemeral,
            });
          const existingFeed = await RankFeedsRepository.findByChannelId(
            interaction.channel.id,
          );

          if (existingFeed)
            return interaction.reply({
              content: "Score feed already exists for this channel!",
              flags: MessageFlags.Ephemeral,
            });

          const newFeed = new RankFeed({
            id: undefined,
            type: interaction.options.getString("type") ?? "global",
            channelType: "guild",
            displayType: "embed",
            userId: null,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            playerIds: [],
            hasFilters: false,
            ssRanked: null,
            blRanked: null,
            asRanked: null,
            managerRoleId:
              interaction.options.getRole("manager-role")?.id ?? null,
            minRank: null,
          });

          await RankFeedService.createRankFeed(newFeed);
        }
    }
  },
};
