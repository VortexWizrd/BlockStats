import { type PlayerRow } from "../db/schema.js";

export default class Player implements PlayerRow {
  id!: string;
  name!: string;
  avatar!: string;
  steamId!: string | null;
  oculusId!: string | null;
  questId!: number | null;
  alias!: string | null;
  beatLeaderId!: string | null;
  scoreSaberId!: string | null;
  scoreSaberAlias!: string | null;
  accSaberId!: string | null;
  hitBloqId!: number | null;
  blRankHistory!: RankHistory;
  ssRankHistory!: RankHistory;
  asRankHistory!: RankHistory;
  overallRankHistory!: RankHistory;
  blRank!: number | null;
  ssRank!: number | null;
  asRank!: number | null;
  overallRank!: number | null;
  totalScores!: number;

  constructor(data: Player) {
    Object.assign(this, data);
  }
}

export type RankTimestamp = {
  timestamp: Date;
  rank: number;
};

export type RankHistory = [RankTimestamp];
