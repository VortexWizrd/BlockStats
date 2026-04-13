import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
} from "discord.js";
import RankFeed from "../../models/RankFeed";
import Player from "../../models/Player";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rankfeed")
    .setDescription("Manage Beat Saber rank feed")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Create a rank feed in the current channel")
        .addStringOption((option) =>
          option
            .setName("request_type")
            .setDescription(
              "Select whether members can join the rank feed (for servers)"
            )
            .setRequired(true)
            .addChoices(
              { name: "closed", value: "closed" },
              { name: "open", value: "open" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("display_type")
            .setDescription("Select how rank changess are displayed")
            .setRequired(true)
            .addChoices({ name: "embed", value: "embed" })
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove the rank feed from the current server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("link")
        .setDescription("Add a BeatLeader profile to the rank feed")
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
        .setDescription("Remove a BeatLeader profile from the rank feed")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("BeatLeader profile ID")
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "add": {
        if (!interaction.guild) {
          // Check if rank feed already exists for this user
          const query = { userId: interaction.user.id };
          const existingFeed = await RankFeed.findOne(query);
          if (existingFeed) {
            await interaction.reply({
              content:
                "You have already set up a personal rank feed! Please use the `edit` or `remove` command to modify it.",
              ephemeral: true,
            });
            return;
          }

          // Create a new rank feed
          const newFeed = new RankFeed({
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

          // Check if rank feed already exists for this server
          const query = { guildId: interaction.guild.id };
          const existingFeed = await RankFeed.findOne(query);
          if (existingFeed) {
            await interaction.reply({
              content:
                "A rank feed already exists for this server! Please use the `edit` or `remove` command to modify it.",
              ephemeral: true,
            });
            return;
          }

          // Create a new rank feed
          const newFeed = new RankFeed({
            guildId: interaction.guild.id,
            channelId: interaction.channel?.id,
            displayType: interaction.options.getString("display_type"),
            requestType: interaction.options.getString("request_type"),
          });
          await newFeed.save();
        }

        await interaction.reply({
          content: "Rank feed created!",
          ephemeral: true,
        });

        break;
      }

      case "remove": {
        if (!interaction.guild) {
          // Check if rank feed exists for this user
          const feed = await RankFeed.findOne({
            userId: interaction.user.id,
          });
          if (!feed) {
            await interaction.reply({
              content: "No rank feed exists!",
              ephemeral: true,
            });
            return;
          }

          // Remove the rank feed
          await RankFeed.deleteOne({ userId: interaction.user.id });
        } else {
          // Handle removing a rank feed
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

          // Check if rank feed exists for this server
          const feed = await RankFeed.findOne({
            guildId: interaction.guild.id,
          });
          if (!feed) {
            await interaction.reply({
              content: "No rank feed exists for this server!",
              ephemeral: true,
            });
            return;
          }

          // Remove the rank feed
          await RankFeed.deleteOne({ guildId: interaction.guild.id });
        }

        await interaction.reply({
          content: "rank feed removed!",
          ephemeral: true,
        });

        break;
      }

      case "link": {
        if (!interaction.guild) {
          // Handle adding a player to the rank feed
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

          // Check if rank feed exists for this server
          const feed = await RankFeed.findOne({
            userId: interaction.user.id,
          });
          if (!feed) {
            await interaction.reply({
              content: "No rank feed exists!",
              ephemeral: true,
            });
            return;
          }

          // Add player to the rank feed
          if (feed.beatleaderIds.includes(beatleaderId)) {
            await interaction.reply({
              content: "This player is already linked to the rank feed!",
              ephemeral: true,
            });
            return;
          }
          feed.beatleaderIds.push(beatleaderId);
          await feed.save();

          await interaction.reply({
            content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) linked to the rank feed!`,
            ephemeral: true,
          });
        } else {
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            // Handle adding a player to the rank feed
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

            // Check if rank feed exists for this server
            const feed = await RankFeed.findOne({
              guildId: interaction.guild.id,
            });
            if (!feed) {
              await interaction.reply({
                content: "No rank feed exists for this server!",
                ephemeral: true,
              });
              return;
            }

            // Add player to the rank feed
            if (feed.beatleaderIds.includes(beatleaderId)) {
              await interaction.reply({
                content: "This player is already linked to the rank feed!",
                ephemeral: true,
              });
              return;
            }
            feed.beatleaderIds.push(beatleaderId);
            await feed.save();

            await interaction.reply({
              content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) linked to the rank feed!`,
              ephemeral: true,
            });
          } else {
            if (interaction.options.getString("id")) {
              await interaction.reply({
                content:
                  "You do not have permission to add other users to the rank feed!",
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

            const feed = await RankFeed.findOne({
              guildId: interaction.guild.id,
            });
            if (!feed) {
              return await interaction.reply({
                content: "No rank feed exists for this server!",
                ephemeral: true,
              });
            }

            switch (feed.requestType) {
              case "closed": {
                return await interaction.reply({
                  content:
                    "This server's rank feed is not taking profile requests!",
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
                  content: "Your profile has been added to the rank feed!",
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

          const feed = await RankFeed.findOne({
            userId: interaction.user.id,
          });
          if (!feed) {
            await interaction.reply({
              content: "No rank feed exists!",
              ephemeral: true,
            });
            return;
          }

          if (beatleaderId === "all") {
            feed.beatleaderIds = [];
            await feed.save();

            await interaction.reply({
              content: "All players unlinked from the rank feed!",
              ephemeral: true,
            });
            return;
          }

          // Remove player from the rank feed
          if (!feed.beatleaderIds.includes(beatleaderId)) {
            await interaction.reply({
              content: "This player is not linked to the rank feed!",
              ephemeral: true,
            });
            return;
          }
          feed.beatleaderIds = feed.beatleaderIds.filter(
            (id) => id !== beatleaderId
          );
          await feed.save();

          await interaction.reply({
            content: `Player with BeatLeader ID [${beatleaderId}](https://beatleader.com/u/${beatleaderId}) unlinked from the rank feed!`,
            ephemeral: true,
          });
        } else {
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (!member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            if (!interaction.options.getString("id")) {
              const player = await Player.findOne({
                discordId: interaction.user.id,
              });
              if (player) {
                const feed = await RankFeed.findOne({
                  guildId: interaction.guild.id,
                });
                if (!feed) {
                  await interaction.reply({
                    content: "No rank feed exists for this server!",
                    ephemeral: true,
                  });
                  return;
                }
                if (feed.requestType == "open") {
                  feed.beatleaderIds = feed.beatleaderIds.filter(
                    (id) => id !== player.beatLeaderId
                  );
                  await feed.save();
                  await interaction.reply({
                    content: "You are now added to the rank feed!",
                    ephemeral: true,
                  });
                } else {
                  await interaction.reply({
                    content: "The rank feed is closed!",
                    ephemeral: true,
                  });
                }
              }
            }
            await interaction.reply({
              content: "You do not have permission to use this command!",
              ephemeral: true,
            });
            return;
          } else {
            const player = await Player.findOne({
              discordId: interaction.user.id,
            });
            const beatLeaderId =
              interaction.options.getString("id") ??
              player?.beatLeaderId ??
              undefined;
            if (!beatLeaderId)
              return await interaction.reply({
                content: "No valid BeatLeader profile provided!",
                ephemeral: true,
              });
            const feed = await RankFeed.findOne({
              guildId: interaction.guild.id,
            });
            if (!feed) {
              await interaction.reply({
                content: "No rank feed exists for this server!",
                ephemeral: true,
              });
              return;
            }

            if (beatLeaderId === "all") {
              feed.beatleaderIds = [];
              await feed.save();

              await interaction.reply({
                content: "All players unlinked from the rank feed!",
                ephemeral: true,
              });
              return;
            }

            // Remove player from the rank feed
            if (!feed.beatleaderIds.includes(beatLeaderId)) {
              await interaction.reply({
                content: "This player is not linked to the rank feed!",
                ephemeral: true,
              });
              return;
            }
            feed.beatleaderIds = feed.beatleaderIds.filter(
              (id) => id !== beatLeaderId
            );
            await feed.save();

            await interaction.reply({
              content: `Player with BeatLeader ID [${beatLeaderId}](https://beatleader.com/u/${beatLeaderId}) unlinked from the rank feed!`,
              ephemeral: true,
            });
          }
        }
        break;
      }
    }
  },
};
