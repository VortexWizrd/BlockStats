export default class ScoreMessage {
  id: number;
  type: string;
  messageId: string;
  userId: string | null;
  channelId: string | null;
  guildId: string | null;

  constructor(data: {
    id: number;
    type: string;
    messageId: string;
    channelId: string | null;
    userId: string | null;
    guildId: string | null;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.messageId = data.messageId;
    this.channelId = data.channelId;
    this.guildId = data.guildId;
    this.userId = data.userId;
  }
}
