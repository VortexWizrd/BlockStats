import type { MapRow } from "../../db/schema.js";

export default class Map implements MapRow {
  id!: number;
  hash!: string;
  songName!: string;
  songSubName!: string;
  songAuthor!: string;
  mapAuthor!: string;
  songCover!: string;
  savedTime!: Date;
  updatedTime!: Date;
  beatSaverId!: string | null;
  songDescription!: string;
  songDuration!: number | null;
  songBPM!: number | null;
  uploadedTime!: Date | null;
  outdated!: boolean;
  scoreSaberId!: number | null;
  beatLeaderId!: string | null;

  constructor(data: Map) {
    Object.assign(this, data);
  }
}
