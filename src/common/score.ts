import type { ScoreRow } from "../db/schema.js";
import accsaberApiService from "../service/external/accsaber-api.service.js";
import beatleaderApiService from "../service/external/beatleader-api.service.js";
import scoresaberApiService from "../service/external/scoresaber-api.service.js";
import { MapService } from "../service/map.service.js";
import { PlayerService } from "../service/player.service.js";

export default class Score implements ScoreRow {
  id!: number;
  playerId!: string;
  provider!: string[];
  songHash!: string;
  songCharacteristic!: string;
  songDifficulty!: "Expert+" | "Expert" | "Hard" | "Normal" | "Easy";
  score!: number;
  accuracy!: number;
  fullCombo!: boolean;
  missedNotes!: number;
  badCuts!: number;
  bombHits!: number | null;
  wallHits!: number | null;
  ppBL!: number;
  ppSS!: number;
  ap!: number;
  modifiers!: string[];
  blLeaderboardId!: string | null;
  blScoreId!: number | null;
  ssLeaderboardId!: number | null;
  ssScoreId!: number | null;
  outdated!: boolean;
  timestamp!: Date;
  blRank!: number | null;
  ssRank!: number | null;
  playerName!: string;
  playerAvatar!: string;
  songName!: string;
  songAuthor!: string;
  songCover!: string;
  mapAuthor!: string;
  improvement!: number | null;
  upVoteIds!: string[];
  downVoteIds!: string[];
  blStarRating!: number | null;
  ssStarRating!: number | null;
  asRating!: number | null;
  songSubName!: string;
  mapId!: number | null;
  asLeaderboardId!: string | null;
  asComplexity!: number | null;
  playerBeatLeaderId!: string | null;
  playerScoreSaberId!: string | null;
  leaderboardId!: number | null;
  blModifiedStarRating!: number | null;
  ssMaxPP!: number | null;
  maxScore!: number | null;
  upVotes!: number;
  downVotes!: number;
  asCategoryCode!: string | null;

  constructor(data: Score) {
    Object.assign(this, data);
  }

  static async fromBeatLeader(blScore: any) {
    const player = await PlayerService.getPlayerByAllIds(
      blScore.player.id.toString(),
    );
    const leaderboard = await MapService.getLeaderboardFromBeatLeader(
      blScore.leaderboardId,
    );
    const scoreSaberLeaderboard =
      await scoresaberApiService.getV1LeaderboardFromHash(
        blScore.leaderboard.song.hash.toUpperCase(),
        blScore.leaderboard.difficulty.value,
      );
    return new Score({
      id: -1,
      playerId: player?.id ?? "",
      provider: ["BeatLeader"],
      playerName: player?.name ?? blScore.player.name,
      playerAvatar: player?.avatar ?? blScore.player.avatar,
      songName: blScore.leaderboard.song.name,
      songSubName: blScore.leaderboard.song.subName,
      songAuthor: blScore.leaderboard.song.author,
      mapAuthor: blScore.leaderboard.song.mapper,
      songCover: blScore.leaderboard.song.coverImage,
      songHash: blScore.leaderboard.song.hash,
      improvement: null,
      songDifficulty:
        blScore.leaderboard.difficulty.difficultyName === "ExpertPlus"
          ? "Expert+"
          : blScore.leaderboard.difficulty.difficultyName,
      songCharacteristic: blScore.leaderboard.difficulty.modeName,
      score: blScore.baseScore ?? 0,
      accuracy: blScore.accuracy,
      fullCombo: blScore.fullCombo,
      missedNotes: blScore.missedNotes,
      badCuts: blScore.badCuts,
      bombHits: blScore.bombHits,
      wallHits: blScore.wallHits,
      ppBL: blScore.pp,
      ppSS: scoreSaberLeaderboard?.maxPP
        ? scoresaberApiService.getPP(
            scoreSaberLeaderboard.maxPP,
            blScore.accuracy,
            blScore.failed,
          )
        : 0,
      ap: accsaberApiService.getAP(
        leaderboard?.asComplexity ?? 0,
        blScore.accuracy,
      ),
      modifiers: blScore.modifiers.split(",").includes("")
        ? []
        : blScore.modifiers.split(","),
      blLeaderboardId: blScore.leaderboardId,
      blScoreId: blScore.id,
      ssLeaderboardId: scoreSaberLeaderboard?.id ?? null,
      ssScoreId: null,
      outdated: false,
      timestamp: new Date(blScore.timepost * 1000),
      blRank: blScore.rank,
      ssRank: null,
      blStarRating: blScore.leaderboard.difficulty.stars ?? 0,
      ssStarRating: scoreSaberLeaderboard?.stars ?? null,
      asRating: leaderboard?.asComplexity ?? 0,
      upVoteIds: [],
      downVoteIds: [],
      mapId: leaderboard?.mapId ?? null,
      asLeaderboardId: leaderboard?.asLeaderboardId ?? null,
      asComplexity: leaderboard?.asComplexity ?? null,
      asCategoryCode: leaderboard?.asCategoryCode ?? null,
      playerBeatLeaderId: blScore.player.id.toString(),
      playerScoreSaberId: null,
      leaderboardId: leaderboard?.id ?? null,
      blModifiedStarRating: null,
      ssMaxPP: null,
      maxScore: blScore.leaderboard.difficulty.maxScore,
      upVotes: 0,
      downVotes: 0,
    });
  }

  static async fromScoreSaber(ssScore: any) {
    const player = await PlayerService.getPlayerByAllIds(
      ssScore.score.leaderboardPlayerInfo.id,
    );
    const leaderboard = await MapService.getLeaderboardFromScoreSaber(
      ssScore.leaderboard.id,
    );
    const difficulty = ssScore.leaderboard.difficulty.difficultyRaw
      .replace(/^_+/, "")
      .split("_")[0];
    return new Score({
      id: -1,
      playerId: player?.id ?? "",
      provider: ["ScoreSaber"],
      playerName: player?.name ?? ssScore.score.leaderboardPlayerInfo.name,
      playerAvatar:
        player?.avatar ?? ssScore.score.leaderboardPlayerInfo.profilePicture,
      songName: ssScore.leaderboard.songName,
      songSubName: ssScore.leaderboard.songSubName,
      songAuthor: ssScore.leaderboard.songAuthorName,
      mapAuthor: ssScore.leaderboard.levelAuthorName,
      songCover: ssScore.leaderboard.coverImage,
      songHash: ssScore.leaderboard.songHash.toLowerCase(),
      songDifficulty:
        (leaderboard?.difficulty ?? difficulty === "ExpertPlus")
          ? "Expert+"
          : difficulty,
      songCharacteristic: ssScore.leaderboard.difficulty.gameMode.replace(
        "Solo",
        "",
      ),
      score: ssScore.score.baseScore,
      accuracy: ssScore.score.baseScore / ssScore.leaderboard.maxScore,
      fullCombo: ssScore.score.fullCombo,
      missedNotes: ssScore.score.missedNotes,
      badCuts: ssScore.score.badCuts,
      bombHits: null,
      wallHits: null,
      ppBL: 0,
      ppSS: ssScore.score.pp,
      ap: accsaberApiService.getAP(
        leaderboard?.asComplexity ?? 0,
        ssScore.score.accuracy,
      ),
      modifiers: ssScore.score.modifiers.split(",").includes("")
        ? []
        : ssScore.score.modifiers.split(","),
      blLeaderboardId: null,
      blScoreId: null,
      ssLeaderboardId: ssScore.leaderboard.id,
      ssScoreId: ssScore.score.id,
      outdated: false,
      timestamp: new Date(ssScore.score.timeSet),
      blRank: null,
      ssRank: ssScore.score.rank,
      blStarRating: null,
      ssStarRating: ssScore.leaderboard.stars,
      asRating: leaderboard?.asComplexity ?? 0,
      asCategoryCode: leaderboard?.asCategoryCode ?? null,
      improvement: null,
      upVoteIds: [],
      downVoteIds: [],
      mapId: leaderboard?.mapId ?? null,
      asLeaderboardId: leaderboard?.asLeaderboardId ?? null,
      asComplexity: leaderboard?.asComplexity ?? null,
      playerBeatLeaderId: null,
      playerScoreSaberId: ssScore.score.leaderboardPlayerInfo.id,
      leaderboardId: leaderboard?.id ?? null,
      blModifiedStarRating: null,
      ssMaxPP: ssScore.leaderboard.maxPP ?? 0,
      maxScore: ssScore.leaderboard.maxScore ?? 0,
      upVotes: 0,
      downVotes: 0,
    });
  }
}
