import { Client, EmbedBuilder, Events, MessageCreateOptions, TextChannel } from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";
import Score from "../../models/Score";
import Player from "../../models/Player";
import ScoreDisplay from "../../utils/getScoreDisplay";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import RankFeed from "../../models/RankFeed";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";
import RankDisplay from "../../utils/getRankDisplay";

module.exports = {
  data: {
    type: Events.ClientReady,
    once: false,
  },
  execute(client: Client): void {

    // Cooldown setup
    let lastBLUpdate = Date.now();
    let blCount = 0;
    let lastSSUpdate = Date.now();
    let ssCount = 0;

    // BeatLeader rank changes
    BeatLeaderAPI.addListener("score", async (message) => {

      const scoreData = message;

      // Only update if criteria met
      if (scoreData.leaderboard.difficulty.status !== 3) { return; }
      blCount++;
      if (Date.now() - lastBLUpdate < 10000 && blCount < 10) { return; }

      // Update all BeatLeader ranks
      const players = await Player.find();
      for (const player of players) {
          try {
            const blPlayerData = await BeatLeaderAPI.getUserFromDiscord(player.discordId);
            if (!blPlayerData) { continue; }
            if (!player.blRank) {
              player.blRank = blPlayerData.rank;
              player.save().catch(e => console.log(e));
              continue;
            }
            if (player.blRank == -1) {
              player.blRank = blPlayerData.rank;
              player.save().catch(e => console.log(e));
              continue;
            }
            if (player.blRank == blPlayerData.rank) { continue; }

            const embed = (new RankDisplay(blPlayerData, 0, player.blRank, blPlayerData.rank)).getEmbed();
            player.blRank = blPlayerData.rank;
            player.save().catch(e => console.log(e));
            console.log(
              `[${new Date().toLocaleTimeString()}] Updated BeatLeader rank for ${
                blPlayerData.name
              }`
            );

            const rankFeeds = await RankFeed.find({
              beatleaderIds: { $in: [player.beatLeaderId] },
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
            

          } catch (err) {
            console.log(err);
          }
          
          
      }

      blCount = 0;
      lastBLUpdate = Date.now();
    });

    // ScoreSaber rank changes
    ScoreSaberAPI.addListener("score", async (message) => {

      const scoreData = message;

      // Only update if criteria met
      if (scoreData.pp <= 0) { return; }
      ssCount++;
      if (Date.now() - lastSSUpdate < 10000 && ssCount < 5) { return; }

      // Update all ScoreSaber ranks
      const players = await Player.find();
      for (const player of players) {
        if (player.scoreSaberId) {
          try {
            const blPlayerData = await BeatLeaderAPI.getUserFromDiscord(player.discordId);
            const ssPlayerData = await ScoreSaberAPI.getUserFromId(player.scoreSaberId);
            if (!ssPlayerData || !blPlayerData) { continue; }
            if (!player.ssRank) {
              player.ssRank = ssPlayerData.rank;
              player.save().catch(e => console.log(e));
              continue;
            }
            if (player.ssRank == -1 || player.ssRank == 0) {
              player.ssRank = ssPlayerData.rank;
              player.save().catch(e => console.log(e));
              continue;
            }
            if (player.ssRank == ssPlayerData.rank) { continue; }

            const embed = (new RankDisplay(blPlayerData, 1, player.ssRank, ssPlayerData.rank)).getEmbed();
            player.ssRank = ssPlayerData.rank;
            player.save().catch(e => console.log(e));
            console.log(
              `[${new Date().toLocaleTimeString()}] Updated ScoreSaber rank for ${
                blPlayerData.name
              }`
            );

            const rankFeeds = await RankFeed.find({
              beatleaderIds: { $in: [player.beatLeaderId] },
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
            
          } catch (err) {
            console.log(err);
          }
        }   
      }

      ssCount = 0;
      lastSSUpdate = Date.now();
    });
  },
};
