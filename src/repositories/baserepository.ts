import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { and, count, eq, getTableName, sql } from "drizzle-orm";

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
    const [newRow] = await db
      .insert(this.table)
      .values(row)
      .onConflictDoNothing()
      .returning();
    return newRow;
  }

  public static async delete(
    data: { name: string; value: any }[],
  ): Promise<typeof this.row | undefined> {
    const conditions = [];
    for (const condition of data) {
      conditions.push(eq(this.table[condition.name], condition.value));
    }
    return await db
      .delete(this.table)
      .where(and(...conditions))
      .returning();
  }

  public static async getTableSize() {
    if (!this.table) return undefined;
    const tableName = getTableName(this.table);

    const result = await db.execute<{
      tableSize: string;
      indexesSize: string;
      totalSize: string;
      totalSizeBytes: number;
    }>(sql`
    SELECT 
      pg_size_pretty(pg_table_size(${tableName}::regclass)) AS "tableSize",
      pg_size_pretty(pg_indexes_size(${tableName}::regclass)) AS "indexesSize",
      pg_size_pretty(pg_total_relation_size(${tableName}::regclass)) AS "totalSize",
      pg_total_relation_size(${tableName}::regclass)::int AS "totalSizeBytes"
  `);

    return result.rows[0];
  }
}
