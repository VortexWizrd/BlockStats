import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import Player from "../../models/Player";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Display/manage BlockStats profiles")
    .addSubcommand((cmd) =>
      cmd
        .setName("link")
        .setDescription(
          "Connect your BeatLeader/ScoreSaber account (you must link your Discord on your BeatLeader profile)",
        )
        .addStringOption((option) =>
          option
            .setName("scoresaberid")
            .setDescription("Your ScoreSaber ID (optional)")
            .setRequired(false),
        ),
    )
    .addSubcommand((cmd) =>
      cmd.setName("show").setDescription("Display a BlockStats profile"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "link": {
        const scoreSaberId = interaction.options
          .getString("scoresaberid")
          ?.replace(/[^0-9]/g, "");

        const beatLeaderData: any = await BeatLeaderAPI.getUserFromDiscord(
          interaction.user.id,
        );

        if (!beatLeaderData) {
          return await interaction.reply({
            content:
              "You must link your Discord account to your BeatLeader profile!",
            ephemeral: true,
          });
        }

        const player = await Player.findOne({
          discordId: interaction.user.id,
        });

        if (player) {
          if (beatLeaderData && beatLeaderData.id === player.beatLeaderId) {
            if (scoreSaberId && scoreSaberId !== player.scoreSaberId) {
              const scoreSaberProfile: any =
                await ScoreSaberAPI.getUserFromId(scoreSaberId);

              if (!ScoreSaberAPI) {
                await interaction.reply({
                  content: "Invalid ScoreSaber ID",
                  ephemeral: true,
                });
                return;
              }

              if (scoreSaberProfile && scoreSaberProfile.id === scoreSaberId) {
                player.scoreSaberId = scoreSaberId;
                await player.save();
                return await interaction.reply({
                  content: "Your ScoreSaber ID has been updated successfully!",
                  ephemeral: true,
                });
              }
            } else {
              return await interaction.reply({
                content: "Your BeatLeader account is already linked!",
                ephemeral: true,
              });
            }
          } else {
            player.beatLeaderId = beatLeaderData.id;
            await player.save();
            await interaction.reply({
              content: "Your BeatLeader account has been updated successfully!",
              ephemeral: true,
            });
          }
        } else {
          const newPlayer = new Player({
            discordId: interaction.user.id,
            beatLeaderId: beatLeaderData.id,
            scoreSaberId: scoreSaberId || undefined,
            scoreIds: [],
          });

          await newPlayer.save();
          await interaction.reply({
            content: "Account(s) linked successfully!",
            ephemeral: true,
          });
        }
      }

      case "show": {
        const player = await Player.findOne({ discordId: interaction.user.id });

        if (!player)
          return interaction.reply({
            content:
              "Please make a profile using /profile link before using this command!",
            ephemeral: true,
          });

        const beatLeader = await BeatLeaderAPI.getUserFromDiscord(
          interaction.user.id,
        );
        if (!beatLeader)
          return interaction.reply({
            content: "Error: BeatLeader not found.",
            ephemeral: true,
          });

        const linkText = `[[BeatLeader](https://beatleader.com/u/${player.beatLeaderId}) | [Discord](https://discord.com/users/${player.discordId})${player.scoreSaberId ? `| [ScoreSaber](https://scoresaber.com/u/${player.scoreSaberId})` : ""}]`;

        const embed = new EmbedBuilder()
          .setTitle(beatLeader.name)
          .setThumbnail(beatLeader.avatar)
          .setDescription(linkText)
          .addFields({
            name: "Scores",
            value: player.scoreIds.length.toString(),
            inline: true,
          });

        return interaction.reply({
          embeds: [embed],
        });
      }

      default: {
      }
    }
  },
};
