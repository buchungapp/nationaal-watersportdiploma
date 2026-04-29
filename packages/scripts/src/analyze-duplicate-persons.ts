#!/usr/bin/env tsx
import { useDatabase, withDatabase } from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import { sql } from "drizzle-orm";
import {
  DEFAULT_ANALYZE_THRESHOLD,
  DEFAULT_LIMIT,
  findDuplicatePersonPairs,
  formatPerson,
} from "./utils/duplicate-person-detection.js";

type Options = {
  threshold: number;
  limit: number;
  json: boolean;
};

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const pgUri = process.env.PGURI;
  assert(pgUri, "PGURI environment variable is required");

  await withDatabase({ connectionString: pgUri }, async () => {
    const database = useDatabase();
    const pairs = await findDuplicatePersonPairs(database, options);

    if (options.json) {
      console.log(JSON.stringify({ options, pairs }, null, 2));
      return;
    }

    const statsResult = await database.execute(sql`
      SELECT
        COUNT(*)::int AS total_persons,
        COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS persons_with_user,
        COUNT(*) FILTER (WHERE user_id IS NULL)::int AS persons_without_user,
        COUNT(DISTINCT LOWER(CONCAT(first_name, ' ', last_name)))::int AS unique_name_combinations
      FROM person
      WHERE deleted_at IS NULL
    `);
    const stats = statsResult.rows[0] as {
      total_persons: number;
      persons_with_user: number;
      persons_without_user: number;
      unique_name_combinations: number;
    };

    console.log("Duplicate person analysis");
    console.log("=========================");
    console.log(`Threshold: ${options.threshold}`);
    console.log(`Limit: ${options.limit}`);
    console.log("");
    console.log("Database statistics:");
    console.log(`- Total persons: ${stats.total_persons}`);
    console.log(`- Persons with linked user: ${stats.persons_with_user}`);
    console.log(`- Persons without linked user: ${stats.persons_without_user}`);
    console.log(
      `- Unique name combinations: ${stats.unique_name_combinations}`,
    );
    console.log("");

    if (pairs.length === 0) {
      console.log("No potential duplicates found.");
      return;
    }

    console.log(`Found ${pairs.length} potential duplicate pairs.`);
    console.log("");

    for (const [index, pair] of pairs.entries()) {
      console.log(
        `${index + 1}. Score ${pair.score}: ${pair.matchReasons.join(", ")}`,
      );
      if (pair.riskFlags.length > 0) {
        console.log(`   Risks: ${pair.riskFlags.join(", ")}`);
      }
      console.log(`   1: ${formatPerson(pair.persons[0])}`);
      console.log(`   2: ${formatPerson(pair.persons[1])}`);
      console.log("");
    }

    const highConfidence = pairs.filter((pair) => pair.score >= 150).length;
    const manualReview = pairs.filter((pair) =>
      pair.riskFlags.includes("different linked users"),
    ).length;

    console.log("Summary:");
    console.log(`- High confidence (score >= 150): ${highConfidence}`);
    console.log(`- Requires manual user-account review: ${manualReview}`);
  });
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    threshold: DEFAULT_ANALYZE_THRESHOLD,
    limit: DEFAULT_LIMIT,
    json: false,
  };

  for (const arg of args) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    const [name, value] = arg.split("=");
    if (name === "--threshold" && value) {
      options.threshold = parsePositiveInteger(value, "threshold");
      continue;
    }
    if (name === "--limit" && value) {
      options.limit = parsePositiveInteger(value, "limit");
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parsePositiveInteger(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter @nawadi/scripts persons:duplicates:analyze [options]

Options:
  --threshold=N  Minimum score to show. Default: ${DEFAULT_ANALYZE_THRESHOLD}
  --limit=N      Maximum number of pairs. Default: ${DEFAULT_LIMIT}
  --json         Print raw JSON output.
`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
