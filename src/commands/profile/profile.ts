import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import Player from "../../models/Player";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";
import Score from "../../models/Score";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

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
      cmd.setName("show").setDescription("Display a BlockStats profile")
      .addStringOption((option) =>
            option.setName("id").setDescription("BeatLeader ID").setRequired(false))
      .addStringOption((option) =>
            option.setName("name").setDescription("BeatLeader name").setRequired(false))
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
        await interaction.deferReply();

        let player = await Player.findOne({ discordId: interaction.user.id });
        if (interaction.options.get("id")) {
          player = await Player.findOne({ beatLeaderId: interaction.options.get("id")})
          if (!player) {
            return interaction.editReply({
            content:
              "Player not found",
          });
          }
        }

        if (!player)
          return interaction.editReply({
            content:
              "Please make a profile using /profile link before using this command!",
          });

        const beatLeader = await BeatLeaderAPI.getUserFromDiscord(
          player.discordId,
        );
        if (!beatLeader)
          return interaction.editReply({
            content: "Error: BeatLeader not found.",
          });

        const scores = await Score.find({ discordId: player.discordId });

        const linkText = `[[ <:beatleader:1492695343345832102> BeatLeader ](https://beatleader.com/u/${player.beatLeaderId}) | [ <:discord:1492695870343221323> Discord ](https://discord.com/users/${player.discordId})${player.scoreSaberId ? ` | [ <:scoresaber:1492695389634035823> ScoreSaber ](https://scoresaber.com/u/${player.scoreSaberId})` : ""}]`;

        const embed = new EmbedBuilder()
          .setTitle(beatLeader.name)
          .setThumbnail(beatLeader.avatar)
          .setDescription(linkText)
          .setColor("Default")
          .addFields({
            name: "Scores",
            value: scores.length.toString(),
            inline: true,
          },
          {
            name: "BL Rank",
            value: player.blRank?.toString() ?? "?",
            inline: true,
          }
        );

        return interaction.editReply({
          embeds: [embed],
        });
      }

      default: {
      }
    }
  },
};
