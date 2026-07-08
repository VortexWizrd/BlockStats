import { DMChannel, Events, GuildChannel } from "discord.js";
import { RankFeedsRepository } from "../../../repositories/feeds/rankfeeds.repository.js";
import { ScoreFeedsRepository } from "../../../repositories/feeds/scorefeeds.repository.js";

export default {
  data: {
    type: Events.ChannelDelete,
    once: false,
  },
  execute(channel: DMChannel | GuildChannel): void {
    RankFeedsRepository.delete([{ name: "channelId", value: channel.id }]);
    ScoreFeedsRepository.delete([{ name: "channelId", value: channel.id }]);
  },
};
