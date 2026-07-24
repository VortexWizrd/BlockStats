import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { PlayerService } from "../../../service/player.service.js";
import { ScoreFeedService } from "../../../service/feeds/scorefeed.service.js";
import { RankFeedService } from "../../../service/feeds/rankfeed.service.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import scoresaberApiService from "../../../service/external/scoresaber-api.service.js";
import websocketclientService from "../../../service/websocket/websocketclient.service.js";
import { ScoreService } from "../../../service/score.service.js";
import { SnipeFeedService } from "../../../service/feeds/snipefeed.service.js";
import { PlayersRepository } from "../../../repositories/players/players.repository.js";
import { ScoreFeedsRepository } from "../../../repositories/feeds/scorefeeds.repository.js";
import { RankFeedsRepository } from "../../../repositories/feeds/rankfeeds.repository.js";
import { SnipeFeedsRepository } from "../../../repositories/feeds/snipefeeds.repository.js";
import { ScoresRepository } from "../../../repositories/scores.repository.js";
import { LeaderboardsRepository } from "../../../repositories/maps/leaderboards.repository.js";
import { MapsRepository } from "../../../repositories/maps/maps.repository.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nerdinfo")
    .setDescription("Get debugging information"),
  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("Debug Info")
      .setColor(0x00aaff)
      .addFields([
        {
          name: "Accounts",
          value: `${await PlayerService.count()} (${(await PlayersRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Score Feeds",
          value: `${await ScoreFeedService.count()} (${(await ScoreFeedsRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Rank Feeds",
          value: `${await RankFeedService.count()} (${(await RankFeedsRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Snipe Feeds",
          value: `${await SnipeFeedService.count()} (${(await SnipeFeedsRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Scores",
          value: `${await ScoreService.count()} (${(await ScoresRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Leaderboards",
          value: `${await LeaderboardsRepository.countRows()} (${(await LeaderboardsRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Maps",
          value: `${await MapsRepository.countRows()} (${(await MapsRepository.getTableSize())?.totalSize})`,
          inline: true,
        },
        {
          name: "Last BL Socket Update",
          value: beatleaderApiService.lastSocketUpdate.toUTCString(),
          inline: true,
        },
        {
          name: "Last SS Socket Update",
          value: scoresaberApiService.lastSocketUpdate.toUTCString(),
          inline: true,
        },
        {
          name: "Last Main Socket Update",
          value: websocketclientService.lastSocketUpdate.toUTCString(),
          inline: true,
        },
      ]);
    await interaction.reply({ embeds: [embed] });
  },
};
