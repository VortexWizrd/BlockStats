import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("personalscorefeed")
    .setDescription("Manage Beat Saber score feed for Discord DMs")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Create a score feed")
        .addStringOption((option) =>
          option
            .setName("display_type")
            .setDescription("Select how you want scores to be displayed")
            .setRequired(true)
            .addChoices({ name: "embed", value: "embed" })
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove the score feed from the current server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("link")
        .setDescription("Add a BeatLeader profile to the score feed")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("BeatLeader profile ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlink")
        .setDescription("Remove a BeatLeader profile from the score feed")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("BeatLeader profile ID")
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.guild) {
      await interaction.reply({
        content: "You must DM the bot to use this command!",
        ephemeral: true,
      });
      return;
    }

    switch (interaction.options.getSubcommand()) {
      case "add": {
        // Check if score feed already exists for this user
        const query = { userId: interaction.user.id };
        const existingFeed = await ScoreFeed.findOne(query);
        if (existingFeed) {
          await interaction.reply({
            content:
              "You have already set up a personal score feed! Please use the `edit` or `remove` command to modify it.",
            ephemeral: true,
          });
          return;
        }

        // Create a new score feed
        const newFeed = new ScoreFeed({
          userId: interaction.user.id,
          displayType: interaction.options.getString("display_type"),
          requestType: "open",
        });
        await newFeed.save();

        await interaction.reply({
          content: "Score feed created!",
          ephemeral: true,
        });
        break;
      }

      case "filters": {
        // Check if score feed exists
        const query = { userId: interaction.user.id };
        const existingFeed = await ScoreFeed.findOne(query);
        if (!existingFeed) {
          await interaction.reply({
            content:
              "Score feed not found! Please make a new score feed using /scorefeed add!",
            ephemeral: true,
          });
          return;
        }
        if (existingFeed.filters == null || existingFeed.filters == undefined) {
          existingFeed.filters = {
            scoreSaberStars: 0,
            minScoreSaberPP: 0,
            beatLeaderStars: 0,
            minBeatLeaderPP: 0,
          };
        }

        existingFeed.filters.scoreSaberStars =
          interaction.options.getNumber("min_stars_ss") ||
          existingFeed.filters.scoreSaberStars;
        existingFeed.filters.minScoreSaberPP =
          interaction.options.getNumber("min_pp_ss") ||
          existingFeed.filters.scoreSaberStars;
        existingFeed.filters.beatLeaderStars =
          interaction.options.getNumber("min_stars_bl") ||
          existingFeed.filters.beatLeaderStars;
        existingFeed.filters.minBeatLeaderPP =
          interaction.options.getNumber("min_pp_bl") ||
          existingFeed.filters.minBeatLeaderPP;
        existingFeed.filters.lowestRank =
          interaction.options.getInteger("lowest_rank") ||
          existingFeed.filters.lowestRank;
        existingFeed.filters.fullCombo =
          interaction.options.getBoolean("full_combo") ||
          existingFeed.filters.fullCombo;
        existingFeed.filters.minAccuracy =
          interaction.options.getNumber("min_accuracy") ||
          existingFeed.filters.minAccuracy;
        existingFeed.filters.maxMisses =
          interaction.options.getInteger("max_misses") ||
          existingFeed.filters.maxMisses;

        await existingFeed
          .save()
          .catch((e) => console.log("Error saving score feed: " + e));

        await interaction.reply({
          content: "Applied filters!",
          ephemeral: true,
        });

        break;
      }

      case "remove": {
        // Check if score feed exists for this user
        const feed = await ScoreFeed.findOne({
          userId: interaction.user.id,
        });
        if (!feed) {
          await interaction.reply({
            content: "No score feed exists!",
            ephemeral: true,
          });
          return;
        }

        // Remove the score feed
        await ScoreFeed.deleteOne({ guildId: interaction.user.id });
        await interaction.reply({
          content: "Score feed removed!",
          ephemeral: true,
        });
        break;
      }

      case "link": {
        // Handle adding a player to the score feed
        const beatleaderId = interaction.options.getString("id", true);
        if (!beatleaderId) {
          await interaction.reply({
            content: "You must provide a valid BeatLeader ID!",
            ephemeral: true,
          });
          return;
        }

        // Check if score feed exists for this server
        const feed = await ScoreFeed.findOne({
          userId: interaction.user.id,
        });
        if (!feed) {
          await interaction.reply({
            content: "No score feed exists!",
            ephemeral: true,
          });
          return;
        }

        // Add player to the score feed
        if (feed.beatleaderIds.includes(beatleaderId)) {
          await interaction.reply({
            content: "This player is already linked to the score feed!",
            ephemeral: true,
          });
          return;
        }
        feed.beatleaderIds.push(beatleaderId);
        await feed.save();

        await interaction.reply({
          content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) linked to the score feed!`,
          ephemeral: true,
        });

        break;
      }

      case "unlink": {
        // Handle removing a player from the score feed
        const beatleaderId = interaction.options.getString("id", true);
        if (!beatleaderId) {
          await interaction.reply({
            content: "You must provide a valid BeatLeader ID!",
            ephemeral: true,
          });
          return;
        }

        // Check if score feed exists for this server
        const feed = await ScoreFeed.findOne({
          userId: interaction.user.id,
        });
        if (!feed) {
          await interaction.reply({
            content: "No score feed exists!",
            ephemeral: true,
          });
          return;
        }

        if (beatleaderId === "all") {
          feed.beatleaderIds = [];
          await feed.save();

          await interaction.reply({
            content: "All players unlinked from the score feed!",
            ephemeral: true,
          });
          return;
        }

        // Remove player from the score feed
        if (!feed.beatleaderIds.includes(beatleaderId)) {
          await interaction.reply({
            content: "This player is not linked to the score feed!",
            ephemeral: true,
          });
          return;
        }
        feed.beatleaderIds = feed.beatleaderIds.filter(
          (id) => id !== beatleaderId
        );
        await feed.save();

        await interaction.reply({
          content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) unlinked from the score feed!`,
          ephemeral: true,
        });

        break;
      }
    }
  },
};
