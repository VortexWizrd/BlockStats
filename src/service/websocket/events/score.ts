import Score from "../../../common/score.js";
import { MapService } from "../../map.service.js";
import { PlayerService } from "../../player.service.js";
import { ScoreService } from "../../score.service.js";
import websocketserverService from "../websocketserver.service.js";
import WebSocketRankEvent from "./rank.js";

export default class WebSocketScoreEvent {
  private static scoreStorage: Score[] = [];

  public static async processBLScore(data: any) {
    const blConvertedScore = await Score.fromBeatLeader(data);
    if (this.scoreStorage.includes(blConvertedScore)) return;
    if (blConvertedScore.asLeaderboardId) {
      WebSocketRankEvent.processASRank();
    }
    for (const score of this.scoreStorage) {
      if (
        score.songHash == blConvertedScore.songHash &&
        score.songDifficulty == blConvertedScore.songDifficulty &&
        score.songCharacteristic == blConvertedScore.songCharacteristic &&
        score.blScoreId == null &&
        !score.provider.includes("BeatLeader") &&
        Math.abs(score.accuracy - blConvertedScore.accuracy) < 0.0002 // change maybe
      ) {
        this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
        score.blLeaderboardId = blConvertedScore.blLeaderboardId;
        score.blRank = blConvertedScore.blRank;
        score.blScoreId = blConvertedScore.blScoreId;
        score.blStarRating = blConvertedScore.blStarRating;
        score.ppBL = blConvertedScore.ppBL;
        score.provider = ["ScoreSaber", "BeatLeader"];
        this.sendScore(score);
        return;
      }
    }
    this.tempStoreScore(blConvertedScore);
  }

  public static async sendScore(score: Score): Promise<void> {
    const wrapper = {
      type: "score",
      data: score,
    };

    // BlockStats features
    const player = await PlayerService.getPlayer(score.playerId);
    if (player) {
      // refresh player profile
      await PlayerService.refreshPlayer(player.id);

      // Handle leaderboard creation (might make a better way to do this later)
      const ssFullMap = await MapService.createFromScoreSaber(
        score.songHash,
        true,
      );
      if (ssFullMap && ssFullMap.map.beatSaverId) {
        await MapService.createFromBeatLeader(ssFullMap.map.beatSaverId, true);
      }

      // handle outdated markings
      score.outdated = false;
      if (score.blRank && score.blRank == 0 && !score.ssRank) {
        score.outdated = true;
      } else {
        await ScoreService.setOutdated(
          player.id,
          score.songHash,
          score.songDifficulty,
          score.songCharacteristic,
        );
      }
      const updatedScore = await ScoreService.createScore(score);
      if (updatedScore !== undefined) {
        wrapper.data = updatedScore;
      }
    }
    // handle snipes
    for (const select of await ScoreService.getCurrentScoresFromMap(
      score.songHash,
      score.songDifficulty,
      score.songCharacteristic,
    )) {
      if (
        (select.blRank && select.blRank > 0) ||
        (select.ssRank && select.ssRank > 0)
      ) {
        if (select.accuracy < score.accuracy) {
          const data = {
            score: score,
            snipedScore: select,
          };
          //this.sendSnipe(data);
        }
      }
    }
    websocketserverService.send(wrapper);
  }

  public static async processSSScore(data: any) {
    const ssConvertedScore = await Score.fromScoreSaber(data);
    if (this.scoreStorage.includes(ssConvertedScore)) return;
    if (ssConvertedScore.asLeaderboardId) {
      WebSocketRankEvent.processASRank();
    }
    for (const score of this.scoreStorage) {
      if (
        score.songHash == ssConvertedScore.songHash &&
        score.songDifficulty == ssConvertedScore.songDifficulty &&
        score.songCharacteristic == ssConvertedScore.songCharacteristic &&
        score.ssScoreId == null &&
        !score.provider.includes("ScoreSaber") &&
        Math.abs(score.accuracy - ssConvertedScore.accuracy) < 0.0002
      ) {
        this.scoreStorage = this.scoreStorage.filter((i) => i !== score);
        score.ssLeaderboardId = ssConvertedScore.ssLeaderboardId;
        score.ssRank = ssConvertedScore.ssRank;
        score.ssScoreId = ssConvertedScore.ssScoreId;
        score.ssStarRating = ssConvertedScore.ssStarRating;
        score.ppSS = ssConvertedScore.ppSS;
        score.provider = ["BeatLeader", "ScoreSaber"];
        await this.sendScore(score);
        return;
      }
    }
    this.tempStoreScore(ssConvertedScore);
  }

  private static async tempStoreScore(score: Score) {
    this.scoreStorage.push(score);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const index = this.scoreStorage.indexOf(score);
    if (index !== -1) {
      this.scoreStorage.splice(index, 1);

      return this.sendScore(score);
    }
  }
}
