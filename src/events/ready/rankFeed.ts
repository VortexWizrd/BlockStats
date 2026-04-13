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
            .setColor(0xEC018E)
            .setTimestamp()
            } else if (blPlayerData.rank > player.blRank) {
            embed
            .setAuthor({
                name: blPlayerData.name,
                iconURL: blPlayerData.avatar,
                url: `https://beatleader.com/u/${blPlayerData.id}`,
            })
            .setTitle(`Lost **${blPlayerData.rank - player.blRank} rank${blPlayerData.rank - player.blRank == 1 ? "" : "s"}** on BeatLeader`)
            .setThumbnail(`https://beatleader.com/assets/logo-small.png`)
            .setDescription(`# #${player.blRank} -> #${blPlayerData.rank}`)
            .setColor(0xEC018E)
            .setTimestamp()
            }
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

    ScoreSaberAPI.addListener("score", async (message) => {
      const scoreData = message;

      if (scoreData.pp <= 0) { return; }

      const players = await Player.find();

      for (const player of players) {
        if (!player.scoreSaberId) continue;
          try {
            const blPlayerData = await BeatLeaderAPI.getUserFromDiscord(player.discordId);
            const ssPlayerData = await ScoreSaberAPI.getUserFromId(player.scoreSaberId);
            if (!ssPlayerData || !blPlayerData) { return; }
            if (!player.ssRank) {
              player.ssRank = ssPlayerData.rank;
              player.save().catch(e => console.log(e));
              return;
            }
            if (player.ssRank == -1) {
              player.ssRank = ssPlayerData.rank;
              player.save().catch(e => console.log(e));
              return;
            }
            if (player.ssRank == ssPlayerData.rank) { return; }
            let embed = new EmbedBuilder()
            if (ssPlayerData.rank < player.ssRank) {
            embed
            .setAuthor({
                name: blPlayerData.name,
                iconURL: blPlayerData.avatar,
                url: `https://beatleader.com/u/${blPlayerData.id}`,
            })
            .setTitle(`Climbed **${player.ssRank - ssPlayerData.rank} rank${player.ssRank - ssPlayerData.rank == 1 ? "" : "s"}** on ScoreSaber!`)
            .setThumbnail(`https://bsaber.com/uploads/communities/scoresaber-logo-reuben-afriendlypug-.png`)
            .setDescription(`# #${player.ssRank} -> #${ssPlayerData.rank}`)
            .setColor(0xFFDE18)
            .setTimestamp()
            } else if (ssPlayerData.rank > player.ssRank) {
            embed
            .setAuthor({
                name: blPlayerData.name,
                iconURL: blPlayerData.avatar,
                url: `https://beatleader.com/u/${blPlayerData.id}`,
            })
            .setTitle(`Lost **${ssPlayerData.rank - player.ssRank} rank${ssPlayerData.rank - player.ssRank == 1 ? "" : "s"}** on ScoreSaber`)
            .setThumbnail(`https://bsaber.com/uploads/communities/scoresaber-logo-reuben-afriendlypug-.png`)
            .setDescription(`# #${player.ssRank} -> #${ssPlayerData.rank}`)
            .setColor(0xFFDE18)
            .setTimestamp()
            }
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
            player.ssRank = ssPlayerData.rank;
            player.save().catch(e => console.log(e));
            console.log(
              `[${new Date().toLocaleTimeString()}] Updated ScoreSaber rank for ${
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
