import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
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
        .setName("link")
        .setDescription("Add a player to the rank feed")
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

      case "info": {
        const existingFeed = await ScoreFeedsRepository.findOne([
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
