#!/usr/bin/env tsx
import { User, useDatabase, withDatabase } from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import {
  buildDuplicatePersonPairKey,
  chooseDefaultMerge,
  countCohortPersons,
  DEFAULT_AUTO_MERGE_THRESHOLD,
  DEFAULT_LIMIT,
  DEFAULT_MERGE_THRESHOLD,
  type DuplicatePersonPair,
  findDuplicatePersonPairs,
  findStudentCurriculumConflictPairKeys,
  formatPerson,
  isAutoMergeSafe,
} from "./utils/duplicate-person-detection.js";

type Options = {
  execute: boolean;
  yes: boolean;
  threshold: number;
  autoThreshold: number;
  limit: number;
  cohortId?: string;
};

type ErrorReport = {
  timestamp: string;
  personId: string;
  targetPersonId: string;
  score: number;
  error: string;
};

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const pgUri = process.env.PGURI;
  assert(pgUri, "PGURI environment variable is required");

  await withDatabase({ connectionString: pgUri }, async () => {
    const database = useDatabase();
    const cohortPersonCount = options.cohortId
      ? await countCohortPersons(database, options.cohortId)
      : null;
    const pairs =
      cohortPersonCount === 0
        ? []
        : await findDuplicatePersonPairs(database, {
            threshold: options.threshold,
            limit: options.limit,
            cohortId: options.cohortId,
          });
    const curriculumConflictKeys = await findStudentCurriculumConflictPairKeys(
      database,
      pairs,
    );

    console.log("Batch duplicate person merge");
    console.log("============================");
    console.log(`Mode: ${options.execute ? "execute" : "dry run"}`);
    console.log(`Review threshold: ${options.threshold}`);
    console.log(`Auto-merge threshold: ${options.autoThreshold}`);
    console.log(`Limit: ${options.limit}`);
    if (options.cohortId) {
      console.log(`Cohort ID: ${options.cohortId}`);
      console.log(`Active persons in cohort: ${cohortPersonCount}`);
    }
    console.log("");

    if (pairs.length === 0) {
      console.log("No duplicate pairs found.");
      return;
    }

    console.log(`Found ${pairs.length} duplicate pairs.`);

    if (!options.execute) {
      printDryRun(pairs, options, curriculumConflictKeys);
      return;
    }

    if (!options.yes) {
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message:
            "This will merge duplicate person records in the database. Continue?",
          default: false,
        },
      ]);

      if (!proceed) {
        console.log("Operation cancelled.");
        return;
      }
    }

    const errorReports: ErrorReport[] = [];
    const processedPersonIds = new Set<string>();
    let successCount = 0;
    let skippedCount = 0;

    for (const [index, pair] of pairs.entries()) {
      if (pair.persons.some((person) => processedPersonIds.has(person.id))) {
        console.log("");
        printPair(pair, index + 1, pairs.length);
        console.log("Skip: one of these records was already merged.");
        skippedCount++;
        continue;
      }

      const plan = chooseDefaultMerge(pair);
      const mergeBlockers = getMergeBlockers(pair, curriculumConflictKeys);
      const auto =
        mergeBlockers.length > 0
          ? { safe: false, reason: mergeBlockers.join(", ") }
          : isAutoMergeSafe(pair, options.autoThreshold);
      let keep = plan.keep;
      let shouldMerge = auto.safe;

      console.log("");
      printPair(pair, index + 1, pairs.length);
      console.log(`Default: keep record ${plan.keep + 1} (${plan.reason})`);

      if (mergeBlockers.length > 0) {
        console.log(`Skip: ${auto.reason}`);
        skippedCount++;
        continue;
      }

      if (auto.safe) {
        console.log(`Auto-merge: ${auto.reason}`);
      } else if (options.yes) {
        console.log(`Skip: ${auto.reason}`);
        skippedCount++;
        continue;
      } else {
        const response = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            message: `Action for score ${pair.score}?`,
            choices: [
              {
                name: `Merge - keep record 1 (${pair.persons[0].fullName})`,
                value: "merge-keep-1",
              },
              {
                name: `Merge - keep record 2 (${pair.persons[1].fullName})`,
                value: "merge-keep-2",
              },
              { name: "Skip", value: "skip" },
              { name: "Quit", value: "quit" },
            ],
            default: "skip",
          },
        ]);

        if (response.action === "quit") break;
        if (response.action === "skip") {
          skippedCount++;
          continue;
        }

        keep = response.action === "merge-keep-1" ? 0 : 1;
        shouldMerge = true;
      }

      if (!shouldMerge) {
        skippedCount++;
        continue;
      }

      const targetPersonId = pair.persons[keep].id;
      const personId = pair.persons[keep === 0 ? 1 : 0].id;

      try {
        console.log(`Merging ${personId} into ${targetPersonId}...`);
        await User.Person.mergePersons({ personId, targetPersonId });
        processedPersonIds.add(personId);
        processedPersonIds.add(targetPersonId);
        successCount++;
        console.log("Merged.");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Merge failed: ${errorMessage}`);
        errorReports.push({
          timestamp: new Date().toISOString(),
          personId,
          targetPersonId,
          score: pair.score,
          error: errorMessage,
        });

        if (!options.yes) {
          const { errorAction } = await inquirer.prompt([
            {
              type: "list",
              name: "errorAction",
              message: "Continue after this error?",
              choices: [
                { name: "Continue", value: "continue" },
                { name: "Quit", value: "quit" },
              ],
              default: "continue",
            },
          ]);

          if (errorAction === "quit") break;
        }
      }
    }

    console.log("");
    console.log("Summary:");
    console.log(`- Merged: ${successCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorReports.length}`);

    if (errorReports.length > 0) {
      const reportPath = await writeErrorReport(errorReports);
      console.log(`- Error report: ${reportPath}`);
    }
  });
}

function printDryRun(
  pairs: DuplicatePersonPair[],
  options: Options,
  curriculumConflictKeys: Set<string>,
) {
  console.log("");
  console.log("Dry-run plan:");
  console.log("Use --execute to actually merge records.");
  console.log("");

  let autoCount = 0;
  let reviewCount = 0;
  let blockedCount = 0;

  for (const [index, pair] of pairs.entries()) {
    const plan = chooseDefaultMerge(pair);
    const mergeBlockers = getMergeBlockers(pair, curriculumConflictKeys);
    const auto =
      mergeBlockers.length > 0
        ? { safe: false, reason: mergeBlockers.join(", ") }
        : isAutoMergeSafe(pair, options.autoThreshold);
    if (mergeBlockers.length > 0) blockedCount++;
    else if (auto.safe) autoCount++;
    else reviewCount++;

    printPair(pair, index + 1, pairs.length);
    console.log(`Default: keep record ${plan.keep + 1} (${plan.reason})`);
    console.log(
      `Action: ${mergeBlockers.length > 0 ? "blocked" : auto.safe ? "auto-merge candidate" : auto.reason}`,
    );
    if (mergeBlockers.length > 0) {
      console.log(`Blockers: ${mergeBlockers.join(", ")}`);
    }
    console.log("");
  }

  console.log("Dry-run summary:");
  console.log(`- Auto-merge candidates: ${autoCount}`);
  console.log(`- Manual review needed: ${reviewCount}`);
  console.log(`- Blocked by known merge constraints: ${blockedCount}`);
}

function printPair(pair: DuplicatePersonPair, index: number, total: number) {
  console.log(`[${index}/${total}] Score ${pair.score}`);
  console.log(`Reasons: ${pair.matchReasons.join(", ")}`);
  if (pair.riskFlags.length > 0) {
    console.log(`Risks: ${pair.riskFlags.join(", ")}`);
  }
  console.log(`1: ${formatPerson(pair.persons[0])}`);
  console.log(`2: ${formatPerson(pair.persons[1])}`);
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    execute: false,
    yes: false,
    threshold: DEFAULT_MERGE_THRESHOLD,
    autoThreshold: DEFAULT_AUTO_MERGE_THRESHOLD,
    limit: DEFAULT_LIMIT,
  };

  for (const arg of args) {
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--yes") {
      options.yes = true;
      continue;
    }

    const [name, value] = arg.split("=");
    if (name === "--threshold" && value) {
      options.threshold = parsePositiveInteger(value, "threshold");
      continue;
    }
    if (name === "--auto-threshold" && value) {
      options.autoThreshold = parsePositiveInteger(value, "auto-threshold");
      continue;
    }
    if (name === "--limit" && value) {
      options.limit = parsePositiveInteger(value, "limit");
      continue;
    }
    if ((name === "--cohort-id" || name === "--cohort") && value) {
      options.cohortId = parseUuid(value, "cohort-id");
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

function parseUuid(value: string, name: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error(`--${name} must be a UUID`);
  }
  return value;
}

function getMergeBlockers(
  pair: DuplicatePersonPair,
  curriculumConflictKeys: Set<string>,
): string[] {
  const blockers: string[] = [];

  if (curriculumConflictKeys.has(buildDuplicatePersonPairKey(pair))) {
    blockers.push("student curriculum conflict requires a merge fix first");
  }

  return blockers;
}

async function writeErrorReport(errorReports: ErrorReport[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(process.cwd(), `merge-errors-${timestamp}.txt`);

  const lines = [
    "PERSON MERGE ERROR REPORT",
    `Generated: ${new Date().toISOString()}`,
    `Total errors: ${errorReports.length}`,
    "=".repeat(60),
    "",
  ];

  for (const report of errorReports) {
    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Score: ${report.score}`);
    lines.push(`Person ID: ${report.personId}`);
    lines.push(`Target Person ID: ${report.targetPersonId}`);
    lines.push(`Error: ${report.error}`);
    lines.push("-".repeat(60));
    lines.push("");
  }

  await fs.writeFile(reportPath, lines.join("\n"), "utf-8");
  return reportPath;
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter @nawadi/scripts persons:duplicates:merge [options]

Options:
  --execute           Actually merge records. Without this, the script is a dry run.
  --yes               Do not prompt. Merges only auto-safe pairs and skips the rest.
  --threshold=N       Minimum score to review. Default: ${DEFAULT_MERGE_THRESHOLD}
  --auto-threshold=N  Minimum score for auto-merge candidates. Default: ${DEFAULT_AUTO_MERGE_THRESHOLD}
  --limit=N           Maximum number of pairs. Default: ${DEFAULT_LIMIT}
  --cohort-id=ID      Only compare pairs where at least one person is allocated to this cohort.
`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
