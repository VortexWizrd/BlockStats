import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
} from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";
import Player from "../../models/Player";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scorefeed")
    .setDescription("Manage Beat Saber score feed")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Create a score feed in the current channel")
        .addStringOption((option) =>
          option
            .setName("request_type")
            .setDescription(
              "Select whether members can join the score feed (for servers)"
            )
            .setRequired(true)
            .addChoices(
              { name: "closed", value: "closed" },
              { name: "open", value: "open" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("filters")
        .setDescription("Filter out scores from the score feed")
        .addNumberOption((option) =>
          option
            .setName("min_stars_ss")
            .setDescription("Minimum ScoreSaber stars")
        )
        .addNumberOption((option) =>
          option.setName("min_pp_ss").setDescription("Minimum ScoreSaber PP")
        )
        .addNumberOption((option) =>
          option
            .setName("min_stars_bl")
            .setDescription("Minimum BeatLeader stars")
        )
        .addNumberOption((option) =>
          option.setName("min_pp_bl").setDescription("Minimum BeatLeader pp")
        )
        .addIntegerOption((option) =>
          option.setName("lowest_rank").setDescription("Lowest rank")
        )
        .addIntegerOption((option) =>
          option
            .setName("max_misses")
            .setDescription("Maximum number of misses")
        )
        .addBooleanOption((option) =>
          option.setName("full_combo").setDescription("Require full combo")
        )
        .addNumberOption((option) =>
          option
            .setName("min_accuracy")
            .setDescription("Minimum accuracy as a percentage")
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
            .setRequired(false)
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("request")
        .setDescription("Request your profile to be added to the score feed")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "add": {
        if (!interaction.guild) {
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
        } else {
          // Check if user has permissions
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
              content: "You do not have permission to use this command!",
              ephemeral: true,
            });
            return;
          }

          // Check if score feed already exists for this server
          const query = { guildId: interaction.guild.id };
          const existingFeed = await ScoreFeed.findOne(query);
          if (existingFeed) {
            await interaction.reply({
              content:
                "A score feed already exists for this server! Please use the `edit` or `remove` command to modify it.",
              ephemeral: true,
            });
            return;
          }

          // Create a new score feed
          const newFeed = new ScoreFeed({
            guildId: interaction.guild.id,
            channelId: interaction.channel?.id,
            displayType: interaction.options.getString("display_type"),
            requestType: interaction.options.getString("request_type"),
          });
          await newFeed.save();
        }

        await interaction.reply({
          content: "Score feed created!",
          ephemeral: true,
        });

        break;
      }

      case "filters": {
        let query = {};
        if (!interaction.guild) {
          query = { userId: interaction.user.id };
        } else {
          // Check if user has permissions
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
              content: "You do not have permission to use this command!",
              ephemeral: true,
            });
            return;
          }

          query = {
            guildId: interaction.guild.id,
            channelId: interaction.channel?.id,
          };
        }

        // Check if score feed exists
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
          interaction.options.getNumber("min_stars_ss") ??
          existingFeed.filters.scoreSaberStars;
        existingFeed.filters.minScoreSaberPP =
          interaction.options.getNumber("min_pp_ss") ??
          existingFeed.filters.minScoreSaberPP;
        existingFeed.filters.beatLeaderStars =
          interaction.options.getNumber("min_stars_bl") ??
          existingFeed.filters.beatLeaderStars;
        existingFeed.filters.minBeatLeaderPP =
          interaction.options.getNumber("min_pp_bl") ??
          existingFeed.filters.minBeatLeaderPP;
        existingFeed.filters.lowestRank =
          interaction.options.getInteger("lowest_rank") ??
          existingFeed.filters.lowestRank;
        existingFeed.filters.fullCombo =
          interaction.options.getBoolean("full_combo");
        existingFeed.filters.minAccuracy =
          interaction.options.getNumber("min_accuracy") ??
          existingFeed.filters.minAccuracy;
        existingFeed.filters.maxMisses =
          interaction.options.getInteger("max_misses") ??
          existingFeed.filters.maxMisses;

        const embed = new EmbedBuilder()
          .setTitle("Score Feed Filters")
          .addFields(
            {
              name: "Min ScoreSaber Stars",
              value: existingFeed.filters.scoreSaberStars.toString(),
              inline: true,
            },
            {
              name: "Min ScoreSaber PP",
              value: existingFeed.filters.minScoreSaberPP.toString(),
              inline: true,
            },
            {
              name: "Min BeatLeader Stars",
              value: existingFeed.filters.beatLeaderStars.toString(),
              inline: true,
            },
            {
              name: "Min BeatLeader PP",
              value: existingFeed.filters.minBeatLeaderPP.toString(),
              inline: true,
            },
            {
              name: "Lowest Rank",
              value: existingFeed.filters.lowestRank?.toString() || "any",
              inline: true,
            },
            {
              name: "Require Full Combo",
              value: existingFeed.filters.fullCombo?.toString() || "false",
              inline: true,
            },
            {
              name: "Min Accuracy",
              value: existingFeed.filters.minAccuracy?.toString() || "any",
              inline: true,
            },
            {
              name: "Max Misses",
              value: existingFeed.filters.maxMisses?.toString() || "any",
              inline: true,
            }
          );

        await interaction.reply({
          embeds: [embed],
        });

        await existingFeed
          .save()
          .catch((e) => console.log("Error saving score feed: " + e));

        break;
      }

      case "remove": {
        if (!interaction.guild) {
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
        } else {
          // Handle removing a score feed
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
              content: "You do not have permission to use this command!",
              ephemeral: true,
            });
            return;
          }

          // Check if score feed exists for this server
          const feed = await ScoreFeed.findOne({
            guildId: interaction.guild.id,
          });
          if (!feed) {
            await interaction.reply({
              content: "No score feed exists for this server!",
              ephemeral: true,
            });
            return;
          }

          // Remove the score feed
          await ScoreFeed.deleteOne({ guildId: interaction.guild.id });
        }

        await interaction.reply({
          content: "Score feed removed!",
          ephemeral: true,
        });

        break;
      }

      case "link": {
        if (!interaction.guild) {
          // Handle adding a player to the score feed
          let beatleaderId = interaction.options.getString("id");
          if (!beatleaderId) {
            const player = await Player.findOne({
              discordId: interaction.user.id,
            });
            if (player) {
              beatleaderId = player.beatLeaderId;
            } else {
              await interaction.reply({
                content:
                  "Please input a BeatLeader ID or use /link to link your BeatLeader profile to the bot!",
              });
              return;
            }
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
        } else {
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            // Handle adding a player to the score feed
            let beatleaderId = interaction.options.getString("id");
            if (!beatleaderId) {
              const player = await Player.findOne({
                discordId: interaction.user.id,
              });
              if (player) {
                beatleaderId = player.beatLeaderId;
              } else {
                await interaction.reply({
                  content:
                    "Please input a BeatLeader ID or use /link to link your BeatLeader profile to the bot!",
                });
                return;
              }
            }

            // Check if score feed exists for this server
            const feed = await ScoreFeed.findOne({
              guildId: interaction.guild.id,
            });
            if (!feed) {
              await interaction.reply({
                content: "No score feed exists for this server!",
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
          } else {
            if (interaction.options.getString("id")) {
              await interaction.reply({
                content:
                  "You do not have permission to add other users to the score feed!",
                ephemeral: true,
              });
              return;
            }
            const player = await Player.findOne({
              discordId: interaction.user.id,
            });
            if (!player) {
              return await interaction.reply({
                content:
                  "Link your profile using /link before using this command!",
                ephemeral: true,
              });
            }

            const feed = await ScoreFeed.findOne({
              guildId: interaction.guild.id,
            });
            if (!feed) {
              return await interaction.reply({
                content: "No score feed exists for this server!",
                ephemeral: true,
              });
            }

            switch (feed.requestType) {
              case "closed": {
                return await interaction.reply({
                  content:
                    "This server's score feed is not taking profile requests!",
                  ephemeral: true,
                });
              }
              case "invite": {
                feed.requestIds.push(player.beatLeaderId);
                feed.save().catch((err) => console.log(err));
                return await interaction.reply({
                  content:
                    "Your request has been sent! Please wait until someone accepts your request.",
                  ephemeral: true,
                });
              }
              case "open": {
                feed.beatleaderIds.push(player.beatLeaderId);
                feed.save().catch((err) => console.log(err));
                return await interaction.reply({
                  content: "Your profile has been added to the score feed!",
                  ephemeral: true,
                });
              }
            }
          }
        }

        break;
      }

      case "unlink": {
        if (!interaction.guild) {
          await interaction.reply({
            content: "You must be in a server to use this command!",
            ephemeral: true,
          });
          return;
        }
        // Check if user has permissions
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
          await interaction.reply({
            content: "You do not have permission to use this command!",
            ephemeral: true,
          });
          return;
        }

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
          guildId: interaction.guild.id,
        });
        if (!feed) {
          await interaction.reply({
            content: "No score feed exists for this server!",
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
