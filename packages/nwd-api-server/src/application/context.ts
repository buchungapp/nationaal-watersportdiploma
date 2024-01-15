import pg from "pg";

export interface Context {
  pgPool: pg.Pool;
}
