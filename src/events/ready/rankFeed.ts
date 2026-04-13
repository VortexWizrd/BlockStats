import { Client, Events, MessageCreateOptions, TextChannel } from "discord.js";
import ScoreFeed from "../../models/ScoreFeed";
import Score from "../../models/Score";
import Player from "../../models/Player";
import ScoreDisplay from "../../utils/getScoreDisplay";
import BeatLeaderAPI from "../../api/BeatLeaderAPI";
import ScoreSaberAPI from "../../api/ScoreSaberAPI";

async function outputScore(client: Client, score: any): Promise<void> {
  try {
    const scoreDisplay = new ScoreDisplay(score);
    let messageData: MessageCreateOptions;

    const player = await Player.findOne({ discordId: score.discordId });
    if (player) {
      messageData = {
        embeds: [scoreDisplay.getEmbed()],
        components: [scoreDisplay.getButtons()],
      };
    } else {
      messageData = {
        embeds: [scoreDisplay.getEmbed()],
      };
      ScoreFeed.deleteOne(score);
    }

    const scoreFeeds = await ScoreFeed.find({
      beatleaderIds: { $in: [score.beatLeaderData.playerId] },
    });

    for (const feed of scoreFeeds) {
      // Apply feed filters
      if (
        (score.scoreSaberData?.score.pp ?? 0) <
          (feed.filters?.minScoreSaberPP ?? 0) ||
        (score.beatLeaderData.pp ?? 0) < (feed.filters?.minBeatLeaderPP ?? 0) ||
        (score.scoreSaberData?.leaderboard.stars ?? 0) <
          (feed.filters?.scoreSaberStars ?? 0) ||
        (score.beatLeaderData.leaderboard.difficulty.stars ?? 0) <
          (feed.filters?.beatLeaderStars ?? 0) ||
        score.beatLeaderData.rank >
          (feed.filters?.lowestRank ?? Number.MAX_SAFE_INTEGER) ||
        score.beatLeaderData.accuracy * 100 <
          (feed.filters?.minAccuracy ?? -Number.MAX_SAFE_INTEGER) ||
        score.beatLeaderData.fullCombo !=
          (feed.filters?.fullCombo ?? score.beatLeaderData.fullCombo) ||
        score.beatLeaderData.badCuts + score.beatLeaderData.missedNotes >
          (feed.filters?.maxMisses ?? Number.MAX_SAFE_INTEGER)
      ) {
        continue;
      }
      // Send message
      if (feed.channelId && feed.guildId) {
        const channel = await client.channels.fetch(feed.channelId || "");
        if (channel && channel instanceof TextChannel) {
          const message = await channel.send(messageData);

          score.messages.push({
            messageId: message.id,
            channelId: message.channel.id,
            guildId: message.guild.id,
          });

          score.save().catch((err: any) => console.log(err));
        }
      } else if (feed.userId) {
        const user = await client.users.fetch(feed.userId || "");

        if (user) {
          const message = await user.send(messageData);

          score.messages.push({
            messageId: message.id,
            userId: feed.userId,
          });

          score.save().catch((err: any) => console.log(err));
        }
      }
    }
    console.log(
      `[${new Date().toLocaleTimeString()}] New score by ${
        score.beatLeaderData.player.name
      }`
    );
  } catch (error) {
    console.error("Error fetching score feeds:", error);
  }
}

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
          if (blPlayerData.rank < player.blRank) {
            console.log("rank up! " + (player.blRank - blPlayerData.rank) + " " + player.blRank + " " + blPlayerData.rank);
            player.blRank = blPlayerData.rank;
            player.save().catch(e => console.log(e));
          } else if (blPlayerData.rank > player.blRank) {
            console.log("rank down! " + (player.blRank - blPlayerData.rank) + " " + player.blRank + " " + blPlayerData.rank);
          }
      }
    });

    ScoreSaberAPI.addListener("score", async (message) => {
      const scoreData = message;

      const player = await Player.findOne({
        scoreSaberId: scoreData.score.leaderboardPlayerInfo.id,
      });

      if (!player) return;

      const score = await Score.findOne({
        discordId: player.discordId,
        "beatLeaderData.leaderboard.song.hash":
          scoreData.leaderboard.songHash.toLowerCase(),
        "beatLeaderData.baseScore": scoreData.score.baseScore,
        scoreSaberData: { $in: [undefined, null] },
      });

      if (score) {
        score.scoreSaberData = scoreData;
        score.save().catch((err) => console.log(err));
        await outputScore(client, score);
      } else {
        const newScore = new Score({
          discordId: player.discordId,
          scoreSaberData: scoreData,
        });
        newScore.save().catch((err) => console.log(err));
      }
    });
  },
};
