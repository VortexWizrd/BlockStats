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

    switch (interaction.customId) {
      case "score-like": {
        if (score.downVoteIds.includes(player.id)) {
          await ScoreService.removeDownVoteId(score.id, player.id);
        }
        if (score.upVoteIds.includes(player.id)) {
          await ScoreService.removeUpVoteId(score.id, player.id);
          await interaction.reply({
            content: "Removed like!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await ScoreService.addUpVoteId(score.id, player.id);
          await interaction.reply({
            content: "Liked score!",
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }
      case "score-dislike": {
        if (score.upVoteIds.includes(player.id)) {
          await ScoreService.removeUpVoteId(score.id, player.id);
        }
        if (score.downVoteIds.includes(player.id)) {
          await ScoreService.removeDownVoteId(score.id, player.id);
          await interaction.reply({
            content: "Removed dislike!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await ScoreService.addDownVoteId(score.id, player.id);
          await interaction.reply({
            content: "Disliked score!",
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }
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
                  updatedScore.upVoteIds.length,
                  updatedScore.downVoteIds.length,
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
                  updatedScore.upVoteIds.length,
                  updatedScore.downVoteIds.length,
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
