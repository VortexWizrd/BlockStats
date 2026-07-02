import { scoreMessagesTable } from "../db/schema.js";
import { Repository } from "./baserepository.js";

export class ScoreMessagesRepository extends Repository {
  public static readonly table = scoreMessagesTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: number,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "id", value: id }]);
  }

  public static async findByMessageId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "messageId", value: id }]);
  }

  public static async findByChannelId(
    id: string,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "channelId", value: id }]);
  }

  public static async findByGuildId(
    id: string,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "guildId", value: id }]);
  }

  public static async findByUserId(
    id: string,
  ): Promise<(typeof this.row)[] | undefined> {
    return await this.find([{ name: "userId", value: id }]);
  }
}
