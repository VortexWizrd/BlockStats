import type { ScoreMessageRow } from "../db/schema.js";

export default class ScoreMessage implements ScoreMessageRow {
  id!: number;
  type!: string;
  messageId!: string;
  userId!: string | null;
  channelId!: string | null;
  guildId!: string | null;

  constructor(data: ScoreMessage) {
    Object.assign(this, data);
  }
}
