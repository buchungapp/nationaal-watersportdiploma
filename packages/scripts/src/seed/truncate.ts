import { useQuery } from "@nawadi/core";
import { sql } from "drizzle-orm";

// https://gist.github.com/rphlmr/0d1722a794ed5a16da0fdf6652902b15
export async function truncate() {
  const query = useQuery();

  const selectAllTables = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

  const tables = await query.execute(selectAllTables);
  for (const table of tables.rows) {
    const truncate = sql.raw(`TRUNCATE TABLE "${table.table_name}" CASCADE;`);
    await query.execute(truncate);
  }
}
