import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { PlayerService } from "../../../service/player.service.js";
import { ScoreFeedService } from "../../../service/scorefeed.service.js";
import { RankFeedService } from "../../../service/rankfeed.service.js";
import beatleaderApiService from "../../../service/external/beatleader-api.service.js";
import scoresaberApiService from "../../../service/external/scoresaber-api.service.js";
import websocketclientService from "../../../service/websocket/websocketclient.service.js";

module.exports = {
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
          value: (await PlayerService.count()).toString(),
          inline: true,
        },
        {
          name: "Score Feeds",
          value: (await ScoreFeedService.count()).toString(),
        },
        {
          name: "Rank Feeds",
          value: (await RankFeedService.count()).toString(),
        },
        {
          name: "Last BL Socket Update",
          value: beatleaderApiService.lastSocketUpdate.toUTCString(),
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
