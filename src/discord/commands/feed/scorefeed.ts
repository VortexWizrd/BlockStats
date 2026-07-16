import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
  PermissionFlagsBits,
} from "discord.js";
import { ScoreFeedsRepository } from "../../../repositories/feeds/scorefeeds.repository.js";
import ScoreFeed from "../../../common/feed/scorefeed.js";
import { ScoreFeedService } from "../../../service/feeds/scorefeed.service.js";
import { PlayerService } from "../../../service/player.service.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import scoresaberApiService from "../../../service/external/scoresaber-api.service.js";

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
              {
                name: "global (blockstats profiles only)",
                value: "blockstats_global",
              },
            )
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("manager-role")
            .setDescription("Set role for others to manage the feed")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("delete")
        .setDescription("Deletes all score feeds in channel"),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("link")
        .setDescription("Add a player to the score feed")
        .addStringOption((option) =>
          option
            .setName("beatleaderid")
            .setDescription("BeatLeader profile id")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("scoresaberid")
            .setDescription("ScoreSaber profile id")
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Discord user")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("unlink")
        .setDescription("Remove a player from the score feed")
        .addStringOption((option) =>
          option
            .setName("beatleaderid")
            .setDescription("BeatLeader profile id")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("scoresaberid")
            .setDescription("ScoreSaber profile id")
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Discord user")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd.setName("info").setDescription("Display feed information"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "new": {
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

          return await interaction.reply({
            content: `New \`${newFeed.type}\` score feed created!`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          if (
            !interaction.channel ||
            !(interaction.channel instanceof TextChannel)
          )
            return interaction.reply({
              content: "You must be in a text channel to use this command!",
              flags: MessageFlags.Ephemeral,
            });
          const existingFeed = await ScoreFeedsRepository.findByChannelId(
            interaction.channel.id,
          );

          if (existingFeed)
            return interaction.reply({
              content: "Score feed already exists for this channel!",
              flags: MessageFlags.Ephemeral,
            });

          const newFeed = new ScoreFeed({
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

          await ScoreFeedService.createScoreFeed(newFeed);
          return await interaction.reply({
            content: `New \`${newFeed.type}\` score feed created!`,
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }

      case "delete": {
        if (!interaction.guild) {
          const existingFeed = await ScoreFeedsRepository.findByUserId(
            interaction.user.id,
          );

          if (!existingFeed) {
            return await interaction.reply({
              content: "There are no score feeds in this channel!",
              flags: MessageFlags.Ephemeral,
            });
          }

          await ScoreFeedService.deleteFromUser(interaction.user.id);

          return await interaction.reply({
            content: `Score feeds deleted!`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          if (
            !interaction.channel ||
            !(interaction.channel instanceof TextChannel)
          )
            return interaction.reply({
              content: "You must be in a text channel to use this command!",
              flags: MessageFlags.Ephemeral,
            });
          const existingFeed = await ScoreFeedsRepository.findByChannelId(
            interaction.channel.id,
          );

          if (!existingFeed)
            return interaction.reply({
              content: "There are no score feeds in this channel!",
              flags: MessageFlags.Ephemeral,
            });

          await ScoreFeedService.deleteFromChannel(interaction.channel.id);
        }
        break;
      }

      case "link": {
        const existingFeed = interaction.channel?.isDMBased()
          ? await ScoreFeedsRepository.findOne([
              {
                name: "userId",
                value: interaction.user.id.toString(),
              },
            ])
          : await ScoreFeedsRepository.findOne([
              {
                name: "channelId",
                value: interaction.channel?.id.toString(),
              },
            ]);

        if (!existingFeed)
          return await interaction.reply({
            content: "You must be in a score feed channel to run this command!",
            flags: MessageFlags.Ephemeral,
          });

        if (existingFeed.type !== "default")
          return await interaction.reply({
            content:
              "You can only link profiles to 'default' type score feeds!",
          });

        if (interaction.guild) {
          if (
            !(
              (interaction.member as GuildMember).permissions.has(
                PermissionFlagsBits.Administrator,
              ) ||
              (interaction.member as GuildMember).roles.cache.has(
                existingFeed.managerRoleId,
              )
            )
          ) {
            return await interaction.reply({
              content:
                "You do not have sufficient permissions to run this command!",
              flags: MessageFlags.Ephemeral,
            });
          }
        }

        const discordId = interaction.options.getUser("user")?.id;
        const beatLeaderId = interaction.options.getString("beatleaderid");
        const scoreSaberId = interaction.options.getString("scoresaberid");

        const ids = [discordId, beatLeaderId, scoreSaberId].filter(
          (id) => !!id,
        );

        if (ids.length > 1) {
          return await interaction.reply({
            content: "Use only one ID when linking a profile!",
            flags: MessageFlags.Ephemeral,
          });
        } else if (ids.length == 0) {
          const player = await PlayerService.getPlayer(interaction.user.id);
          if (player) {
            ScoreFeedService.addPlayerId(existingFeed.id, player.id);
            return await interaction.reply({
              content: `Added BlockStats user **${player.name}** to the score feed!`,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            const blProfile = await beatleaderApiService.getUserFromDiscord(
              interaction.user.id,
            );
            if (blProfile && blProfile.id) {
              ScoreFeedService.addPlayerId(existingFeed.id, blProfile.id);
              return await interaction.reply({
                content: `Added BeatLeader profile https://beatleader.com/u/${blProfile.id} to the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            }
            return await interaction.reply({
              content: `Unable to find profile. Please use one of the ID options to link a profile`,
              flags: MessageFlags.Ephemeral,
            });
          }
        } else {
          const player =
            (await PlayerService.getPlayer(discordId ?? "")) ??
            (await PlayerService.getPlayerFromBeatLeader(beatLeaderId ?? "")) ??
            (await PlayerService.getPlayerFromScoreSaber(scoreSaberId ?? ""));

          if (player) {
            ScoreFeedService.addPlayerId(existingFeed.id, player.id);
            return await interaction.reply({
              content: `Added BlockStats user **${player.name}** to the score feed!`,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            const blProfile =
              (await beatleaderApiService.getUser(beatLeaderId ?? "")) ??
              (await beatleaderApiService.getUserFromDiscord(discordId ?? ""));
            if (blProfile && blProfile.id) {
              ScoreFeedService.addPlayerId(existingFeed.id, blProfile.id);
              return await interaction.reply({
                content: `Added BeatLeader profile https://beatleader.com/u/${blProfile.id} to the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              const ssProfile = await scoresaberApiService.getUserFromId(
                scoreSaberId ?? "",
              );
              if (ssProfile && ssProfile.id) {
                ScoreFeedService.addPlayerId(existingFeed.id, ssProfile.id);
              }
              return await interaction.reply({
                content: `Added ScoreSaber profile https://scoresaber.com/u/${ssProfile.id} to the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
        }
      }

      case "unlink": {
        const existingFeed = interaction.channel?.isDMBased()
          ? await ScoreFeedsRepository.findOne([
              {
                name: "userId",
                value: interaction.user.id.toString(),
              },
            ])
          : await ScoreFeedsRepository.findOne([
              {
                name: "channelId",
                value: interaction.channel?.id.toString(),
              },
            ]);

        if (!existingFeed)
          return await interaction.reply({
            content: "You must be in a score feed channel to run this command!",
            flags: MessageFlags.Ephemeral,
          });

        if (existingFeed.type !== "default")
          return await interaction.reply({
            content:
              "You can only unlink profiles in 'default' type score feeds!",
          });

        if (interaction.guild) {
          if (
            !(
              (interaction.member as GuildMember).permissions.has(
                PermissionFlagsBits.Administrator,
              ) ||
              (interaction.member as GuildMember).roles.cache.has(
                existingFeed.managerRoleId,
              )
            )
          ) {
            return await interaction.reply({
              content:
                "You do not have sufficient permissions to run this command!",
              flags: MessageFlags.Ephemeral,
            });
          }
        }

        const discordId = interaction.options.getUser("user")?.id;
        const beatLeaderId = interaction.options.getString("beatleaderid");
        const scoreSaberId = interaction.options.getString("scoresaberid");

        const ids = [discordId, beatLeaderId, scoreSaberId].filter(
          (id) => !!id,
        );

        if (ids.length > 1) {
          return await interaction.reply({
            content: "Use only one ID when unlinking a profile!",
            flags: MessageFlags.Ephemeral,
          });
        } else if (ids.length == 0) {
          const player = await PlayerService.getPlayer(interaction.user.id);
          if (player) {
            ScoreFeedService.removePlayerId(existingFeed.id, player.id);
            return await interaction.reply({
              content: `Removed BlockStats user **${player.name}** from the score feed!`,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            const blProfile = await beatleaderApiService.getUserFromDiscord(
              interaction.user.id,
            );
            if (blProfile && blProfile.id) {
              ScoreFeedService.removePlayerId(existingFeed.id, blProfile.id);
              return await interaction.reply({
                content: `Removed BeatLeader profile https://beatleader.com/u/${blProfile.id} from the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            }
            return await interaction.reply({
              content: `Unable to find profile. Please use one of the ID options to unlink a profile`,
              flags: MessageFlags.Ephemeral,
            });
          }
        } else {
          const player =
            (await PlayerService.getPlayer(discordId ?? "")) ??
            (await PlayerService.getPlayerFromBeatLeader(beatLeaderId ?? "")) ??
            (await PlayerService.getPlayerFromScoreSaber(scoreSaberId ?? ""));

          if (player) {
            ScoreFeedService.removePlayerId(existingFeed.id, player.id);
            return await interaction.reply({
              content: `Removed BlockStats user **${player.name}** to the score feed!`,
              flags: MessageFlags.Ephemeral,
            });
          } else {
            const blProfile =
              (await beatleaderApiService.getUser(beatLeaderId ?? "")) ??
              (await beatleaderApiService.getUserFromDiscord(discordId ?? ""));
            if (blProfile && blProfile.id) {
              ScoreFeedService.removePlayerId(existingFeed.id, blProfile.id);
              return await interaction.reply({
                content: `Removed BeatLeader profile https://beatleader.com/u/${blProfile.id} from the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              const ssProfile = await scoresaberApiService.getUserFromId(
                scoreSaberId ?? "",
              );
              if (ssProfile && ssProfile.id) {
                ScoreFeedService.removePlayerId(existingFeed.id, ssProfile.id);
              }
              return await interaction.reply({
                content: `Removed ScoreSaber profile https://scoresaber.com/u/${ssProfile.id} from the score feed!`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
        }
        break;
      }

      case "info": {
        const existingFeed = interaction.channel?.isDMBased()
          ? await ScoreFeedsRepository.findOne([
              {
                name: "userId",
                value: interaction.user.id.toString(),
              },
            ])
          : await ScoreFeedsRepository.findOne([
              {
                name: "channelId",
                value: interaction.channel?.id.toString(),
              },
            ]);

        if (!existingFeed)
          return await interaction.reply({
            content: "You must be in a score feed channel to run this command!",
            flags: MessageFlags.Ephemeral,
          });

        const embed = new EmbedBuilder();
        if (interaction.guild) {
          embed
            .setTitle(
              `${interaction.guild.name} Score Feed [${existingFeed.id}]`,
            )
            .setThumbnail(interaction.guild.iconURL());
        } else {
          embed
            .setTitle(
              `${interaction.user.displayName}'s Score Feed [${existingFeed.id}]`,
            )
            .setThumbnail(interaction.user.displayAvatarURL());
        }

        let linkedIdsString = "";
        for (let i = 0; i < existingFeed.playerIds.length; i++) {
          if (i > 0) {
            linkedIdsString = linkedIdsString.concat("\n");
          }
          if (i == 10) {
            linkedIdsString = linkedIdsString.concat(
              `...${existingFeed.playerIds.length - 10} more`,
            );
            break;
          }
          linkedIdsString = linkedIdsString.concat(
            `${i + 1}. ${existingFeed.playerIds[i]}`,
          );
        }
        if (linkedIdsString == "") {
          linkedIdsString = "None";
        }
        embed.setDescription(`### Linked IDs\n\`\`\`${linkedIdsString}\`\`\``);
        embed.addFields({
          name: "Type",
          value: existingFeed.type,
        });
        return interaction.reply({ embeds: [embed] });
      }
    }
  },
};
