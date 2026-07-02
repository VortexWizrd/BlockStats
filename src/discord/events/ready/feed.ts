import {
  Client,
  Events,
  TextChannel,
  type MessageCreateOptions,
} from "discord.js";
import websocketclientService from "../../../service/websocket/websocketclient.service.js";
import Score from "../../../common/score.js";
import ScoreDisplay from "../../common/ScoreDisplay.js";
import { ScoreFeedService } from "../../../service/scorefeed.service.js";
import RankDisplay from "../../common/RankDisplay.js";
import { RankFeedService } from "../../../service/rankfeed.service.js";
import { PlayerService } from "../../../service/player.service.js";
import { ScoreService } from "../../../service/score.service.js";
import type ScoreMessage from "../../../common/scoremessage.js";

export default {
  data: {
    type: Events.ClientReady,
    once: false,
  },
  async execute(client: Client): Promise<void> {
    websocketclientService.addListener("score", async (data: Score) => {
      const embed = await ScoreDisplay.getEmbed(data);
      if (!embed) return;
      let messageData: MessageCreateOptions = {
        embeds: [embed],
        components: [],
      };

      let feeds = await ScoreFeedService.getGlobalScoreFeeds();
      const player = await PlayerService.getPlayer(data.playerId);
      if (player) {
        feeds = feeds.concat(
          await ScoreFeedService.getBlockStatsGlobalScoreFeeds(),
          await ScoreFeedService.getConnectedScoreFeeds(player.id),
        );
        messageData.components = [
          ScoreDisplay.getButtons(
            data.upVoteIds.length,
            data.downVoteIds.length,
          ),
        ];
      } else {
        feeds = feeds.concat(
          await ScoreFeedService.getConnectedScoreFeeds(data.playerId),
        );
      }

      for (const feed of feeds) {
        try {
          if (feed.channelType === "user") {
            const user = await client.users.fetch(feed.userId || "");

            if (user) {
              const message = await user.send(messageData);
              ScoreService.addDiscordMessage({
                id: data.id,
                messageId: message.id,
                type: "user",
                guildId: null,
                channelId: null,
                userId: user.id,
              } as ScoreMessage);
            }
          } else if (feed.channelType === "guild") {
            const channel = await client.channels.fetch(feed.channelId ?? "");
            if (channel && channel instanceof TextChannel) {
              const message = await channel.send(messageData);
              ScoreService.addDiscordMessage({
                id: data.id,
                messageId: message.id,
                type: "guild",
                guildId: message.guild.id,
                channelId: message.channel.id,
                userId: null,
              } as ScoreMessage);
            }
          }
        } catch (err) {
          console.log(
            "[Feed]: feed with id " + feed.id + " no longer exists on Discord",
          );
        }
      }
    });

    websocketclientService.addListener("rank", async (data: any) => {
      const embed = RankDisplay.getEmbed(data);
      if (!embed) return;

      let feeds = await RankFeedService.getGlobalRankFeeds();
      const player = await PlayerService.getPlayer(data.playerId);
      if (player) {
        feeds = feeds.concat(
          await RankFeedService.getBlockStatsGlobalRankFeeds(),
          await RankFeedService.getConnectedRankFeeds(player.id),
        );
      } else {
        feeds = feeds.concat(
          await RankFeedService.getConnectedRankFeeds(data.playerId),
        );
      }

      for (const feed of feeds) {
        if (feed.channelType === "user") {
          const user = await client.users.fetch(feed.userId || "");

          if (user) {
            await user.send({ embeds: [embed] });
          }
        } else if (feed.channelType === "guild") {
          const channel = await client.channels.fetch(feed.channelId ?? "");
          if (channel && channel instanceof TextChannel) {
            channel.send({ embeds: [embed] });
          }
        }
      }
    });
  },
};
