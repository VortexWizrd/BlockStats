import {
  ActionRowBuilder,
  ButtonInteraction,
  Events,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { PlayerService } from "../../../service/player.service.js";
import { ScoreService } from "../../../service/score.service.js";
import ScoreDisplay from "../../common/ScoreDisplay.js";

export default {
  data: {
    type: Events.InteractionCreate,
    once: false,
  },
  async execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    if (!["score-like", "score-dislike"].includes(interaction.customId)) return;

    const player = await PlayerService.getPlayer(interaction.user.id);
    if (!player) {
      await interaction.reply({
        content: "Link your profile using `/profile link` to vote on scores!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const score = await ScoreService.getFromMessageId(interaction.message.id);
    if (!score)
      return await interaction.reply({
        content: "Unable to vote on score",
        flags: MessageFlags.Ephemeral,
      });

    const voteType = interaction.customId === "score-like" ? "up" : "down";
    const result = await ScoreService.voteScore(score.id, player.id, voteType);

    if (result === "removed") {
      await interaction.reply({
        content: `Removed ${voteType === "up" ? "like" : "dislike"}!`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: `${voteType === "up" ? "Liked" : "Disliked"} score!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const updatedScore = await ScoreService.getFromMessageId(
      interaction.message.id,
    );
    if (!updatedScore || !updatedScore.id) return;

    const scoreMessages =
      (await ScoreService.getScoreMessages(updatedScore.id)) ?? [];

    // refresh button labels
    for (const messageData of scoreMessages) {
      const guild = interaction.client.guilds.cache.get(
        messageData.guildId || "",
      );
      if (guild) {
        const channel = guild?.channels.cache.get(messageData.channelId || "");
        if (channel && channel.isTextBased()) {
          const message = await channel?.messages.fetch(messageData.messageId);
          if (message) {
            await message.edit({
              components: [
                ScoreDisplay.getButtons(
                  updatedScore.upVotes,
                  updatedScore.downVotes,
                ),
              ],
            });
          }
        }
      } else {
        const user = await interaction.client.users.fetch(
          messageData.userId || "",
        );
        if (user) {
          const dmChannel = await user.createDM();
          const message = await dmChannel?.messages.fetch(
            messageData.messageId,
          );
          if (message) {
            await message.edit({
              components: [
                ScoreDisplay.getButtons(
                  updatedScore.upVotes,
                  updatedScore.downVotes,
                ),
              ],
            });
          }
        } else {
          return;
        }
      }
    }
  },
};
