import { Client, EmbedBuilder, Events, MessageCreateOptions, TextChannel } from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";
import Score from "../../models/Score";
import Player from "../../models/Player";
import ScoreDisplay from "../../utils/getScoreDisplay";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import RankFeed from "../../models/RankFeed";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";

module.exports = {
  data: {
    type: Events.ClientReady,
    once: false,
  },
  execute(client: Client): void {
    BeatLeaderAPI.addListener("score", async (message) => {
      const scoreData = message;

      if (scoreData.leaderboard.difficulty.status !== 3) { return; }

      console.log("Updating ranks");

      const players = await Player.find();

      for (const player of players) {
          try {
            const blPlayerData = await BeatLeaderAPI.getUserFromDiscord(player.discordId);
            if (!blPlayerData) { return; }
            if (!player.blRank) {
              player.blRank = blPlayerData.rank;
              player.save().catch(e => console.log(e));
              return;
            }
            if (player.blRank == -1) {
              player.blRank = blPlayerData.rank;
              player.save().catch(e => console.log(e));
              return;
            }
            if (player.blRank == blPlayerData.rank) { return; }
            let embed = new EmbedBuilder()
            if (blPlayerData.rank < player.blRank) {
            embed
            .setAuthor({
                name: blPlayerData.name,
                iconURL: blPlayerData.avatar,
                url: `https://beatleader.com/u/${blPlayerData.id}`,
            })
            .setTitle(`Climbed **${player.blRank - blPlayerData.rank} rank${player.blRank - blPlayerData.rank == 1 ? "" : "s"}** on BeatLeader!`)
            .setThumbnail(`https://beatleader.com/assets/logo-small.png`)
            .setDescription(`# #${player.blRank} -> #${blPlayerData.rank}`)
            } else if (blPlayerData.rank > player.blRank) {
            embed
            .setAuthor({
                name: scoreData.player.name,
                iconURL: scoreData.player.avatar,
                url: `https://beatleader.com/u/${this.score.beatLeaderData.player.id}`,
            })
            .setTitle(`Lost **${blPlayerData.rank - player.blRank} rank${blPlayerData.rank - player.blRank == 1 ? "" : "s"}** on BeatLeader`)
            .setThumbnail(`https://beatleader.com/assets/logo-small.png`)
            .setDescription(`# #${player.blRank} -> #${blPlayerData.rank}`)
            }
            

            const rankFeeds = await RankFeed.find({
              beatleaderIds: { $in: [scoreData.playerId] },
            });
            for (const feed of rankFeeds) {
              if (feed.channelId && feed.guildId) {
                const channel = await client.channels.fetch(feed.channelId || "");
                if (channel && channel instanceof TextChannel) {
                  const message = await channel.send({embeds: [embed]});
                }
              } else if (feed.userId) {
                const user = await client.users.fetch(feed.userId || "");
                if (user) {
                  const message = await user.send({embeds: [embed]});
                }
              }
            }
            player.blRank = blPlayerData.rank;
            player.save().catch(e => console.log(e));
            console.log(
              `[${new Date().toLocaleTimeString()}] Updated BeatLeader rank for ${
                blPlayerData.name
              }`
            );

          } catch (err) {
            console.log(err);
          }
          
          
      }
    });
  },
};
