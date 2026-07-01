import { Client, Events, TextChannel } from "discord.js";
import websocketclientService from "../../../service/websocket/websocketclient.service.js";
import type Score from "../../../common/score.js";
import ScoreDisplay from "../../common/ScoreDisplay.js";
import { ScoreFeedService } from "../../../service/scorefeed.service.js";
import RankDisplay from "../../common/RankDisplay.js";
import { RankFeedService } from "../../../service/rankfeed.service.js";

export default {
  data: {
    type: Events.ClientReady,
    once: false,
  },
  async execute(client: Client): Promise<void> {
    websocketclientService.addListener("score", async (data: Score) => {
      const embed = await ScoreDisplay.getEmbed(data);
      if (!embed) return;

      const globalFeeds = await ScoreFeedService.getGlobalScoreFeeds();

      for (const feed of globalFeeds) {
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

    websocketclientService.addListener("rank", async (data: any) => {
      const embed = RankDisplay.getEmbed(data);
      if (!embed) return;

      const globalFeeds = await RankFeedService.getGlobalRankFeeds();

      for (const feed of globalFeeds) {
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
