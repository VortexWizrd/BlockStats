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
  blRank!: number | null;
  ssRank!: number | null;
  asRank!: number | null;
  overallRank!: number | null;
  totalScores!: number;
  beatSaverId!: number | null;
  accentColor!: string | null;
  status!: string | null;
  asTechRank!: number | null;
  asTrueRank!: number | null;
  asStandardRank!: number | null;
  blPP!: number | null;
  blTechPP!: number | null;
  blPassPP!: number | null;
  blAccPP!: number | null;
  ssPP!: number | null;
  asPP!: number | null;
  asTechPP!: number | null;
  asTruePP!: number | null;
  asStandardPP!: number | null;
  overallPP!: number | null;
  lastScoreTime!: Date | null;
  createdTime!: Date;
  updatedTime!: Date;

  constructor(data: Player) {
    Object.assign(this, data);
  }
}

export type RankTimestamp = {
  timestamp: Date;
  rank: number;
};

export type RankHistory = [RankTimestamp];
