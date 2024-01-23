import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import pg from "pg";
import { projectRoot } from "../utils/index.js";

export interface DatabaseContext {
  pgPool: pg.Pool;
}

const schema = `
create table echo_messages (
  message_value text not null
);
`;

export async function withDatabase<T>(job: (context: DatabaseContext) => Promise<T>) {
  const databaseName = `db_${new Date().valueOf()}`;

  const pgUriSuper = new URL(process.env.PGURI || "postgres://postgres@localhost:5432/postgres");
  const pgUri = new URL(databaseName, pgUriSuper);

  const pgClientSuper = new pg.Client({
    connectionString: pgUriSuper.toString(),
  });

  await executeQuery(
    pgClientSuper,
    `CREATE DATABASE ${pgClientSuper.escapeIdentifier(databaseName)};`,
  );
  try {
    const pgClient = new pg.Client({
      connectionString: pgUri.toString(),
    });
    const db = drizzle(pgClient);
    await migrate(db, { migrationsFolder: path.join(projectRoot, "migrations") });

    const pgPool = new pg.Pool({
      connectionString: pgUri.toString(),
    });
    try {
      const result = await job({ pgPool });
      return result;
    } finally {
      await pgPool.end();
    }
  } finally {
    await executeQuery(
      pgClientSuper,
      `DROP DATABASE ${pgClientSuper.escapeIdentifier(databaseName)};`,
    );
  }
}

async function executeQuery(pgClient: pg.Client, sql: string, sqlParameters?: any[]) {
  await pgClient.connect();
  try {
    await pgClient.query(sql, sqlParameters);
  } finally {
    await pgClient.end();
  }
}
