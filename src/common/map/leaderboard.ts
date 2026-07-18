import type { LeaderboardRow } from "../../db/schema.js";

export default class Leaderboard implements LeaderboardRow {
  id!: number;
  savedTime!: Date;
  updatedTime!: Date;
  mapId!: number;
  difficulty!: string;
  characteristic!: string;
  blLeaderboardId!: string | null;
  blRankedStatus!: string | null;
  blStarRating!: number | null;
  blTechRating!: number | null;
  blAccRating!: number | null;
  blPassRating!: number | null;
  ssLeaderboardId!: number | null;
  ssRankedStatus!: string | null;
  ssStarRating!: number | null;
  asLeaderboardId!: string | null;
  asRankedStatus!: string | null;
  asCategoryId!: string | null;
  asCategoryCode!: string | null;
  asComplexity!: number | null;

  constructor(data: Leaderboard) {
    Object.assign(this, data);
  }
}
