import type { MapRow } from "../../db/schema.js";

export default class Map implements MapRow {
  id!: number;
  hash!: string;
  songName!: string;
  songSubName!: string;
  songAuthor!: string;
  mapAuthor!: string;
  songCover!: string;
  leaderboardIds!: number[];
  savedTime!: Date;
  updatedTime!: Date;
  beatSaverId!: string | null;

  constructor(data: Map) {
    Object.assign(this, data);
  }
}
