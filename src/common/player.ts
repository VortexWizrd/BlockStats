export default class Player {
  id: string;

  name: string;
  avatar: string;

  steamId: string | null;
  oculusId: string | null;
  questId: number | null;
  alias: string | null;

  scoreSaberId: string | null;
  scoreSaberAlias: string | null;

  accSaberId: string | null;

  hitBloqId: string | null;

  blRankHistory: RankHistory;
  ssRankHistory: RankHistory;
  asRankHistory: RankHistory;
  overallRankHistory: RankHistory;

  constructor(data: {
    id: string;
    name: string;
    avatar: string;
    steamId: string | null;
    oculusId: string | null;
    questId: number | null;
    alias: string | null;
    scoreSaberId: string | null;
    scoreSaberAlias: string | null;
    accSaberId: string | null;
    hitBloqId: string | null;
    blRankHistory: RankHistory;
    ssRankHistory: RankHistory;
    asRankHistory: RankHistory;
    overallRankHistory: RankHistory;
  }) {
    this.id = data.id;

    this.name = data.name;
    this.avatar = data.avatar;

    this.steamId = data.steamId;
    this.oculusId = data.oculusId;
    this.questId = data.questId;
    this.alias = data.alias;

    this.scoreSaberId = data.scoreSaberId;
    this.scoreSaberAlias = data.scoreSaberAlias;

    this.accSaberId = data.accSaberId;

    this.hitBloqId = data.hitBloqId;

    this.blRankHistory = data.blRankHistory;
    this.ssRankHistory = data.ssRankHistory;
    this.asRankHistory = data.asRankHistory;
    this.overallRankHistory = data.overallRankHistory;
  }
}

export type RankTimestamp = {
  timestamp: number;
  rank: number;
};

export type RankHistory = [RankTimestamp];
