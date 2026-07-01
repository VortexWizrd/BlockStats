import accsaberApiService from "../service/external/accsaber-api.service.js";
import beatleaderApiService from "../service/external/beatleader-api.service.js";
import scoresaberApiService from "../service/external/scoresaber-api.service.js";
import { PlayerService } from "../service/player.service.js";

export interface IScore {
  id: number;

  playerId: string;

  provider: string[];

  playerName: string;
  playerAvatar: string;

  songName: string;
  songSubname: string;
  songAuthor: string;
  songCover: string;
  mapAuthor: string;
  songHash: string;
  songDifficulty: string;
  songCharacteristic: string;

  score: number;
  accuracy: number;
  fullCombo: boolean;
  missedNotes: number;
  badCuts: number;
  bombHits: number | null;
  wallHits: number | null;
  ppBL: number;
  ppSS: number;
  ap: number;
  modifiers: string[];
  improvement: number | null;

  blLeaderboardId: number | null;
  blScoreId: number | null;
  blStarRating: number | null;
  ssLeaderboardId: number | null;
  ssScoreId: number | null;
  ssStarRating: number | null;
  asRating: number | null;

  outdated: boolean;
  timestamp: Date;
  blRank: number | null;
  ssRank: number | null;

  messageIds: string[] | null;
  upVoteIds: string[];
  downVoteIds: string[];
}

export default class Score implements IScore {
  id: number;
  playerId: string;
  provider: string[];
  songHash: string;
  songDifficulty: string;
  songCharacteristic: string;
  score: number;
  accuracy: number;
  fullCombo: boolean;
  missedNotes: number;
  badCuts: number;
  bombHits: number | null;
  wallHits: number | null;
  ppBL: number;
  ppSS: number;
  ap: number;
  modifiers: string[];
  blLeaderboardId: number | null;
  blScoreId: number | null;
  ssLeaderboardId: number | null;
  ssScoreId: number | null;
  outdated: boolean;
  timestamp: Date;
  blRank: number | null;
  ssRank: number | null;
  playerName: string;
  playerAvatar: string;
  songName: string;
  songSubname: string;
  songAuthor: string;
  songCover: string;
  mapAuthor: string;
  improvement: number | null;
  messageIds: string[] | null;
  upVoteIds: string[];
  downVoteIds: string[];
  constructor(data: IScore) {
    this.id = data.id;

    this.playerId = data.playerId;
    this.provider = data.provider;

    this.playerName = data.playerName;
    this.playerAvatar = data.playerAvatar;

    this.songName = data.songName;
    this.songSubname = data.songSubname;
    this.songAuthor = data.songAuthor;
    this.songCover = data.songCover;
    this.mapAuthor = data.mapAuthor;
    this.songHash = data.songHash;
    this.songDifficulty = data.songDifficulty;
    this.songCharacteristic = data.songCharacteristic;
    this.improvement = data.improvement;

    this.score = data.score;
    this.accuracy = data.accuracy;
    this.fullCombo = data.fullCombo;
    this.missedNotes = data.missedNotes;
    this.badCuts = data.badCuts;
    this.bombHits = data.bombHits;
    this.wallHits = data.wallHits;
    this.ppBL = data.ppBL;
    this.ppSS = data.ppSS;
    this.ap = data.ap;
    this.modifiers = data.modifiers;

    this.blLeaderboardId = data.blLeaderboardId;
    this.blScoreId = data.blScoreId;
    this.blRank = data.blRank;
    this.ssLeaderboardId = data.ssLeaderboardId;
    this.ssScoreId = data.ssScoreId;
    this.ssRank = data.ssRank;

    this.outdated = data.outdated;
    this.timestamp = data.timestamp;

    this.blStarRating = data.blStarRating;
    this.ssStarRating = data.ssStarRating;
    this.asRating = data.asRating;

    this.messageIds = data.messageIds;
    this.upVoteIds = data.upVoteIds;
    this.downVoteIds = data.downVoteIds;
  }
  blStarRating: number | null;
  ssStarRating: number | null;
  asRating: number | null;

  static async fromBeatLeader(blScore: any) {
    const player = await PlayerService.getPlayerFromBeatLeader(
      blScore.player.id,
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
      songSubname: blScore.leaderboard.song.subName,
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
        accsaberApiService.getComplexity(
          blScore.leaderboard.song.hash,
          blScore.leaderboard.difficulty.difficultyName,
        ),
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
      timestamp: new Date(),
      blRank: blScore.rank,
      ssRank: null,
      blStarRating: blScore.leaderboard.difficulty.stars ?? 0,
      ssStarRating: scoreSaberLeaderboard?.stars ?? null,
      asRating: accsaberApiService.getComplexity(
        blScore.leaderboard.song.hash,
        blScore.leaderboard.difficulty.difficultyName,
      ),
      messageIds: null,
      upVoteIds: [],
      downVoteIds: [],
    });
  }

  static async fromScoreSaber(ssScore: any) {
    const player = await PlayerService.getPlayerFromScoreSaber(
      ssScore.score.leaderboardPlayerInfo.id,
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
      songSubname: ssScore.leaderboard.songSubName,
      songAuthor: ssScore.leaderboard.songAuthorName,
      mapAuthor: ssScore.leaderboard.levelAuthorName,
      songCover: ssScore.leaderboard.coverImage,
      songHash: ssScore.leaderboard.songHash.toLowerCase(),
      songDifficulty: difficulty === "ExpertPlus" ? "Expert+" : difficulty,
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
        accsaberApiService.getComplexity(
          ssScore.leaderboard.songHash.toLowerCase(),
          difficulty,
        ),
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
      timestamp: new Date(),
      blRank: null,
      ssRank: ssScore.score.rank,
      blStarRating: null,
      ssStarRating: ssScore.leaderboard.stars,
      asRating: accsaberApiService.getComplexity(
        ssScore.leaderboard.songHash.toLowerCase(),
        difficulty,
      ),
      improvement: null,
      messageIds: null,
      upVoteIds: [],
      downVoteIds: [],
    });
  }
}
