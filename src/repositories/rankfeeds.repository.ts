import { rankFeedsTable } from "../db/schema.js";
import { Repository } from "./baserepository.js";

export class RankFeedsRepository extends Repository {
  public static readonly table = rankFeedsTable;
  public static readonly row = this.table.$inferInsert;

  public static async findById(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "id", value: id }]);
  }

  public static async findByChannelId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "channelId", value: id }]);
  }

  public static async findByUserId(
    id: string,
  ): Promise<typeof this.row | undefined> {
    return await this.findOne([{ name: "userId", value: id }]);
  }

  public static async findManyByGlobalType(): Promise<
    (typeof this.row)[] | undefined
  > {
    return await this.find([{ name: "type", value: "global" }]);
  }
}
