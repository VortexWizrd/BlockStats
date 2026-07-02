import { Events, Guild } from "discord.js";
import { RankFeedsRepository } from "../../../repositories/rankfeeds.repository.js";
import { ScoreFeedsRepository } from "../../../repositories/scorefeeds.repository.js";

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
