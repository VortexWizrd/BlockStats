import type { PPFeedRow, RankFeedRow } from "../../db/schema.js";

export default class PPFeed implements PPFeedRow {
  id!: number;

  type!: string;
  channelType!: string;
  displayType!: string;
  requestType!: "open" | "closed" | "request";

  userId!: string | null;
  channelId!: string | null;
  guildId!: string | null;

  managerRoleId!: string | null;

  playerIds!: string[];

  hasFilters!: boolean;
  ssRanked!: boolean | null;
  blRanked!: boolean | null;
  asRanked!: boolean | null;

  constructor(data: PPFeed) {
    this.id = data.id;
    this.type = data.type;
    this.channelType = data.channelType;
    this.displayType = data.displayType;
    this.userId = data.userId;
    this.channelId = data.channelId;
    this.guildId = data.guildId;
    this.managerRoleId = data.managerRoleId;
    this.playerIds = data.playerIds;
    this.hasFilters = data.hasFilters;
    this.ssRanked = data.ssRanked;
    this.blRanked = data.blRanked;
    this.asRanked = data.asRanked;
    this.requestType = data.requestType;
  }
}
