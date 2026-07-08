import { Events, Guild } from "discord.js";
import { RankFeedsRepository } from "../../../repositories/feeds/rankfeeds.repository.js";
import { ScoreFeedsRepository } from "../../../repositories/feeds/scorefeeds.repository.js";

export default {
  data: {
    type: Events.ChannelDelete,
    once: false,
  },
  execute(guild: Guild): void {
    RankFeedsRepository.delete([{ name: "guildId", value: guild.id }]);
    ScoreFeedsRepository.delete([{ name: "guildId", value: guild.id }]);
  },
};
