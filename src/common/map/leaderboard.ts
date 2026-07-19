import type { LeaderboardRow } from "../../db/schema.js";

export type DifficultyType = "Expert+" | "Expert" | "Hard" | "Normal" | "Easy";

export enum DifficultyColor {
  "Expert+" = 0x8f48db,
  "Expert" = 0xbf2a42,
  "Hard" = 0xff6347,
  "Normal" = 0x59b0f4,
  "Easy" = 0x3cb371,
}

export default class Leaderboard implements LeaderboardRow {
  id!: number;
  savedTime!: Date;
  updatedTime!: Date;
  mapId!: number;
  difficulty!: DifficultyType;
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
  customDifficultyName?: string | null;
  maxScore!: number;
  notes!: number | null;
  bombs!: number | null;
  obstacles!: number | null;
  events!: number | null;
  njs!: number | null;
  offset!: number | null;
  nps!: number | null;
  ssMaxPP!: number | null;

  constructor(data: Leaderboard) {
    Object.assign(this, data);
  }
}
