import pg from "pg";

export interface DatabaseContext {
  pgPool: pg.Pool;
}

const schema = `
create table echo_messages (
  message_value text not null
);
`;

export async function withDatabase<T>(job: (context: DatabaseContext) => Promise<T>) {
  const pgUri = new URL(
    process.env.PGURI || "postgres://postgres:postgres@localhost:5432/postgres",
  );

  const pgClient = new pg.Client({ connectionString: pgUri.toString() });

  const databaseName = `db_${new Date().valueOf()}`;

  await pgClient.connect();
  try {
    await pgClient.query(`CREATE DATABASE ${pgClient.escapeIdentifier(databaseName)};`);
    try {
      const pgPool = new pg.Pool({
        connectionString: new URL(databaseName, pgUri).toString(),
      });
      await pgPool.query(schema);
      try {
        const result = await job({ pgPool });
        return result;
      } finally {
        await pgPool.end();
      }
    } finally {
      await pgClient.query(`DROP DATABASE ${pgClient.escapeIdentifier(databaseName)};`);
    }
  } finally {
    await pgClient.end();
  }
}
