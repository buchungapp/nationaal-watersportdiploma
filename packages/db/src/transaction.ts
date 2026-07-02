import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgTransaction } from "drizzle-orm/node-postgres";
import type { FullSchema } from "./types.ts";

export type Transaction = NodePgTransaction<
  FullSchema,
  ExtractTablesWithRelations<FullSchema>
>;
