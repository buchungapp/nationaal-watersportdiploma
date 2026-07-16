#!/usr/bin/env tsx

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  assertCatalogData,
  CATALOG_TABLE_NAMES,
  computeJachtzeilenCatalogHash,
  JACHTZEILEN_CATALOG_EXPORT_SQL,
  type JachtzeilenCatalogData,
  type JachtzeilenCatalogSnapshot,
} from "./jachtzeilen-catalog-snapshot.ts";

type Command = "export" | "load";

interface Options {
  command: Command;
  execute: boolean;
  service?: string;
  filePath?: string;
  pgUri?: string;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseOptions(args: string[]): Options {
  const options: Options = { command: "export", execute: false };
  let commandSeen = false;

  for (const arg of args) {
    if (arg === "--") continue;
    if (!arg.startsWith("-") && !commandSeen) {
      invariant(arg === "export" || arg === "load", `Unknown command: ${arg}`);
      options.command = arg;
      commandSeen = true;
      continue;
    }
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    const [name, value] = arg.split("=", 2);
    invariant(value, `Option ${name} requires =VALUE`);
    if (name === "--service") options.service = value;
    else if (name === "--file") options.filePath = value;
    else if (name === "--pg-uri") options.pgUri = value;
    else throw new Error(`Unknown option: ${name}`);
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter @nawadi/scripts jachtzeilen:catalog-snapshot -- export --service=nawadi_prod_ro --file=.jachtzeilen-catalog-snapshot.json
  pnpm --filter @nawadi/scripts jachtzeilen:catalog-snapshot -- load --file=.jachtzeilen-catalog-snapshot.json --pg-uri=postgresql://postgres:postgres@127.0.0.1:54322/postgres --execute

The export contains catalog data only. Loading is restricted to localhost and
truncates local catalog tables (plus local dependent test data through CASCADE).
`);
}

function queryCatalogWithPsql(connection: string): JachtzeilenCatalogData {
  const output = execFileSync(
    "psql",
    [
      connection,
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      JACHTZEILEN_CATALOG_EXPORT_SQL,
    ],
    { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
  ).trim();
  invariant(output, "Catalog export returned no data");
  const parsed = JSON.parse(output) as unknown;
  assertCatalogData(parsed);
  return parsed;
}

function defaultSnapshotPath(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(process.cwd(), `.jachtzeilen-catalog-${timestamp}.json`);
}

function exportSnapshot(options: Options) {
  const service = options.service ?? "nawadi_prod_ro";
  const data = queryCatalogWithPsql(`service=${service}`);
  const catalogHash = computeJachtzeilenCatalogHash(data);
  const snapshot: JachtzeilenCatalogSnapshot = {
    kind: "jachtzeilen-catalog-snapshot",
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceService: service,
    catalogHash,
    data,
  };
  const filePath = path.resolve(options.filePath ?? defaultSnapshotPath());
  fs.writeFileSync(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(`Catalog snapshot written: ${filePath}`);
  console.log(`Catalog hash: ${catalogHash}`);
}

function readSnapshot(filePath: string): JachtzeilenCatalogSnapshot {
  const parsed = JSON.parse(
    fs.readFileSync(path.resolve(filePath), "utf8"),
  ) as JachtzeilenCatalogSnapshot;
  invariant(
    parsed.kind === "jachtzeilen-catalog-snapshot" && parsed.version === 1,
    "Unsupported catalog snapshot",
  );
  assertCatalogData(parsed.data);
  invariant(
    computeJachtzeilenCatalogHash(parsed.data) === parsed.catalogHash,
    "Catalog snapshot hash is invalid",
  );
  return parsed;
}

function assertLocalPostgres(pgUri: string) {
  let url: URL;
  try {
    url = new URL(pgUri);
  } catch {
    throw new Error("--pg-uri must be a PostgreSQL URL");
  }
  invariant(
    url.protocol === "postgres:" || url.protocol === "postgresql:",
    "--pg-uri must be a PostgreSQL URL",
  );
  invariant(
    url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1",
    "Snapshot loading is restricted to localhost",
  );
}

function dollarQuoteJson(value: unknown, index: number): string {
  const json = JSON.stringify(value);
  let tag = `$catalog_${index}$`;
  while (json.includes(tag)) tag = `$catalog_${index}_${tag.length}$`;
  return `${tag}${json}${tag}`;
}

function buildLoadSql(data: JachtzeilenCatalogData): string {
  const insertStatements = CATALOG_TABLE_NAMES.map((tableName, index) => {
    const json = dollarQuoteJson(data[tableName], index);
    return `INSERT INTO ${tableName} SELECT * FROM json_populate_recordset(NULL::${tableName}, ${json}::json);`;
  });

  return [
    String.raw`\set ON_ERROR_STOP on`,
    "BEGIN;",
    "SET LOCAL session_replication_role = replica;",
    `TRUNCATE TABLE ${[...CATALOG_TABLE_NAMES].reverse().join(", ")} CASCADE;`,
    ...insertStatements,
    "SET LOCAL session_replication_role = origin;",
    "COMMIT;",
    "",
  ].join("\n");
}

function loadSnapshot(options: Options) {
  invariant(options.filePath, "--file is required");
  invariant(options.pgUri, "--pg-uri is required");
  assertLocalPostgres(options.pgUri);
  const snapshot = readSnapshot(options.filePath);

  console.log(
    `Load plan: ${CATALOG_TABLE_NAMES.length} catalog tables from ${snapshot.sourceService}`,
  );
  console.log(`Catalog hash: ${snapshot.catalogHash}`);
  if (!options.execute) {
    console.log("Dry run only. Add --execute to replace the local catalog.");
    return;
  }

  const result = spawnSync(
    "psql",
    [options.pgUri, "-X", "-v", "ON_ERROR_STOP=1"],
    {
      input: buildLoadSql(snapshot.data),
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
    },
  );
  invariant(
    result.status === 0,
    `Local catalog load failed:\n${result.stderr || result.stdout}`,
  );

  const loadedData = queryCatalogWithPsql(options.pgUri);
  const loadedHash = computeJachtzeilenCatalogHash(loadedData);
  invariant(
    loadedHash === snapshot.catalogHash,
    `Loaded catalog hash mismatch: expected ${snapshot.catalogHash}, got ${loadedHash}`,
  );
  console.log("Local catalog snapshot loaded and verified.");
}

const options = parseOptions(process.argv.slice(2));
if (options.command === "export") exportSnapshot(options);
else loadSnapshot(options);
