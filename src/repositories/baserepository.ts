import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { and, count, eq } from "drizzle-orm";

export abstract class Repository {
  public static readonly table: PgTableWithColumns<any>;
  public static readonly row: any;

  public static async countRows(): Promise<number> {
    const [data] = await db.select({ count: count() }).from(this.table);
    return data?.count ?? 0;
  }

  public static async find(
    data: { name: string; value: any }[],
  ): Promise<(typeof this.row)[] | undefined> {
    const conditions = [];
    for (const condition of data) {
      conditions.push(eq(this.table[condition.name], condition.value));
    }
    return await db
      .select()
      .from(this.table)
      .where(and(...conditions));
  }

  public static async findOne(
    data: { name: string; value: any }[],
  ): Promise<typeof this.row | undefined> {
    return ((await this.find(data)) ?? [])[0];
  }

  public static async update(
    id: string | number,
    data: Object,
  ): Promise<typeof this.row | undefined> {
    const conditions = [];
    return await db.update(this.table).set(data).where(eq(this.table.id, id));
  }

  public static async insert(
    row: typeof this.row,
  ): Promise<typeof this.row | undefined> {
    const [newRow] = await db.insert(this.table).values(row).returning();
    return newRow;
  }
}
