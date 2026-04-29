#!/usr/bin/env tsx
import {
  Course,
  Curriculum,
  Location,
  Student,
  User,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import { execSync } from "node:child_process";
import inquirer from "inquirer";

// Dev helper for testing the operator bulk-import preview. Seeds a
// curated set of "existing" persons in the chosen location and prints a
// paste-ready TSV that exercises every preview row variant:
//
//   exact match              — strong-match row
//   typo'd last name         — weak/strong-match row
//   multi-match               — two existing Lisa Bakker variants
//   twin (same name + DOB)   — perfect-match (twin guard)
//   no match                 — fresh person
//   cross-row paste-only     — same brand-new person three times
//   parse error              — invalid date
//
// Usage:
//   pnpm --filter @nawadi/scripts test:seed-bulk-import
//   pnpm --filter @nawadi/scripts test:seed-bulk-import --clipboard
//   pnpm --filter @nawadi/scripts test:seed-bulk-import --location-id <uuid>
//   pnpm --filter @nawadi/scripts test:seed-bulk-import --cleanup

type Args = {
  locationId?: string;
  clipboard: boolean;
  cleanup: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { clipboard: false, cleanup: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--clipboard") args.clipboard = true;
    else if (token === "--cleanup") args.cleanup = true;
    else if (token === "--location-id" && argv[i + 1]) {
      args.locationId = argv[i + 1];
      i++;
    } else if (token?.startsWith("--location-id=")) {
      args.locationId = token.slice("--location-id=".length);
    } else if (token === "--help" || token === "-h") {
      console.log(
        [
          "Seed dev fixtures for the bulk-import preview UI.",
          "",
          "  --location-id <uuid>  Skip the prompt and use this location.",
          "  --clipboard           Copy the generated TSV to the macOS clipboard.",
          "  --cleanup             Delete the seeded persons (use after testing).",
          "",
        ].join("\n"),
      );
      process.exit(0);
    }
  }
  return args;
}

// Marker email domain. Easy to spot in the DB and to clean up later.
const FIXTURE_DOMAIN = "@nwd-bulk-import-fixture.test";
const FIXTURE_HANDLE_TAG = "bulk-import-fixture";

const FIXTURES = {
  adam: {
    firstName: "Adam",
    lastNamePrefix: "de",
    lastName: "Vries",
    dateOfBirth: "2010-05-12",
    birthCity: "Amsterdam",
    birthCountry: "nl",
    email: `adam${FIXTURE_DOMAIN}`,
    seedDiplomas: true,
  },
  eva: {
    firstName: "Eva",
    lastNamePrefix: null,
    lastName: "Janssen",
    dateOfBirth: "2008-03-22",
    birthCity: "Rotterdam",
    birthCountry: "nl",
    email: null,
    seedDiplomas: false,
  },
  lisaA: {
    firstName: "Lisa",
    lastNamePrefix: null,
    lastName: "Bakker",
    dateOfBirth: "2009-07-15",
    birthCity: "Utrecht",
    birthCountry: "nl",
    email: `lisa.a${FIXTURE_DOMAIN}`,
    seedDiplomas: false,
  },
  lisaB: {
    firstName: "Lisa",
    lastNamePrefix: null,
    lastName: "Bakker",
    dateOfBirth: "2009-07-16",
    birthCity: "Den Haag",
    birthCountry: "nl",
    email: null,
    seedDiplomas: false,
  },
  sarah: {
    firstName: "Sarah",
    lastNamePrefix: "de",
    lastName: "Boer",
    dateOfBirth: "2010-12-30",
    birthCity: "Groningen",
    birthCountry: "nl",
    email: null,
    seedDiplomas: false,
  },
} as const;

async function pickLocationId(provided: string | undefined): Promise<string> {
  if (provided) return provided;
  const locations = await Location.list();
  if (locations.length === 0) {
    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
      {
        type: "confirm",
        name: "confirm",
        message:
          "Geen locaties gevonden in de DB. Een 'Bulk Import Test' locatie aanmaken?",
        default: true,
      },
    ]);
    if (!confirm) {
      throw new Error("Geen locatie beschikbaar — maak er eerst één aan.");
    }
    const created = await Location.create({
      handle: "bulk-import-test",
      name: "Bulk Import Test",
    });
    console.log(`  ✓ Locatie 'Bulk Import Test' aangemaakt (${created.id})`);
    return created.id;
  }
  const { locationId } = await inquirer.prompt<{ locationId: string }>([
    {
      type: "list",
      name: "locationId",
      message: "Welke locatie?",
      choices: locations.map((l) => ({ name: l.name, value: l.id })),
    },
  ]);
  return locationId;
}

async function ensurePerson(
  fixture: (typeof FIXTURES)[keyof typeof FIXTURES],
  locationId: string,
): Promise<{ id: string; createdNow: boolean }> {
  let user: { id: string } | undefined;
  if (fixture.email) {
    user = await User.getOrCreateFromEmail({
      email: fixture.email,
      displayName: fixture.firstName,
    });
  }
  const before = await Date.now();
  const person = await User.Person.getOrCreate({
    userId: user?.id,
    firstName: fixture.firstName,
    lastName: fixture.lastName,
    lastNamePrefix: fixture.lastNamePrefix,
    dateOfBirth: fixture.dateOfBirth,
    birthCity: fixture.birthCity,
    birthCountry: fixture.birthCountry,
  });
  // We can't tell from getOrCreate whether the row was created or fetched.
  // Best-effort signal: the helper script only creates persons via this
  // path, so we assume "may already exist" rather than failing if so.
  await User.Person.createLocationLink({
    personId: person.id,
    locationId,
  });
  await User.Actor.upsert({
    locationId,
    type: "student",
    personId: person.id,
  });
  return { id: person.id, createdNow: Date.now() === before };
}

async function seedAll(locationId: string): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const [key, fixture] of Object.entries(FIXTURES)) {
    const { id } = await ensurePerson(fixture, locationId);
    ids[key] = id;
    console.log(
      `  ✓ ${fixture.firstName} ${fixture.lastNamePrefix ?? ""} ${fixture.lastName} (${fixture.dateOfBirth})`.replace(
        /\s+/g,
        " ",
      ),
    );
  }
  return ids;
}

async function seedDiplomaForAdam(personId: string, locationId: string) {
  // Optional: gives Adam at least one issued diploma so the candidate
  // card shows "1 diploma" rather than "Geen diploma's". Best-effort —
  // skips silently if the curriculum scaffolding isn't there.
  try {
    const courses = await Course.list({ filter: {} });
    const firstCourse = courses[0];
    if (!firstCourse) return;

    const programs = await Course.Program.list({
      filter: { courseId: [firstCourse.id] },
    });
    const program = programs[0];
    if (!program) return;

    const curricula = await Curriculum.list({
      filter: { onlyCurrentActive: true, programId: [program.id] },
    });
    const curriculum = curricula[0];
    if (!curriculum) return;

    const gearTypes = await Curriculum.GearType.list();
    const gearType = gearTypes[0];
    if (!gearType) return;

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId: curriculum.id,
      gearTypeId: gearType.id,
    });
    const { id: certificateId } = await Student.Certificate.startCertificate({
      locationId,
      studentCurriculumId,
    });
    await Student.Certificate.completeCertificate({
      certificateId,
      visibleFrom: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(
      "  · Skipping Adam diploma seed (curriculum scaffolding incomplete):",
      (err as Error).message,
    );
  }
}

function buildTsv(): string {
  // Tab-separated, header row matches what the bulk-import dialog's
  // column-mapping defaults expect. Operator can paste this directly.
  const header = [
    "E-mailadres",
    "Voornaam",
    "Tussenvoegsel",
    "Achternaam",
    "Geboortedatum",
    "Geboorteplaats",
    "Geboorteland",
  ];
  const rows = [
    // 1) Exact match against existing Adam → strong-match row, single-match preselects.
    [
      `adam${FIXTURE_DOMAIN}`,
      "Adam",
      "de",
      "Vries",
      "2010-05-12",
      "Amsterdam",
      "nl",
    ],
    // 2) Eva with typo'd last name (Janssen → Jansen) → weak/strong match (depends on score band).
    [
      `eva.test${FIXTURE_DOMAIN}`,
      "Eva",
      "",
      "Jansen",
      "2008-03-22",
      "Rotterdam",
      "nl",
    ],
    // 3) Lisa Bakker → multi-match (two seeded Lisa Bakkers with close DOBs).
    [
      `lisa.test${FIXTURE_DOMAIN}`,
      "Lisa",
      "",
      "Bakker",
      "2009-07-15",
      "Utrecht",
      "nl",
    ],
    // 4) Brand new person → no-match row.
    [
      `nieuw1${FIXTURE_DOMAIN}`,
      "Nieuwe",
      "",
      "Persoon",
      "2012-04-08",
      "Eindhoven",
      "nl",
    ],
    // 5-7) Same brand-new person pasted three times → cross-row paste-only group.
    [
      `maarten1${FIXTURE_DOMAIN}`,
      "Maarten",
      "",
      "Visser",
      "2009-11-11",
      "Almere",
      "nl",
    ],
    [
      `maarten2${FIXTURE_DOMAIN}`,
      "Maarten",
      "",
      "Visser",
      "2009-11-11",
      "Almere",
      "nl",
    ],
    [
      `maarten3${FIXTURE_DOMAIN}`,
      "Maarten",
      "",
      "Visser",
      "2009-11-11",
      "Almere",
      "nl",
    ],
    // 8) Twin case: same name as existing Sarah, DOB 1 day off → perfect-match-ish (no preselect).
    [
      `sarah.twin${FIXTURE_DOMAIN}`,
      "Sarah",
      "de",
      "Boer",
      "2010-12-31",
      "Amsterdam",
      "nl",
    ],
    // 9) Parse error: invalid date.
    [
      `broken${FIXTURE_DOMAIN}`,
      "Broken",
      "",
      "Row",
      "NOT-A-DATE",
      "Testdorp",
      "nl",
    ],
    // 10) Another fresh person → no-match (sanity row).
    [
      `nieuw2${FIXTURE_DOMAIN}`,
      "Maria",
      "van der",
      "Heide",
      "2011-08-03",
      "Tilburg",
      "nl",
    ],
  ];
  return [header.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
}

async function cleanup(locationId: string) {
  const { useQuery } = await import("@nawadi/core");
  const { schema: s } = await import("@nawadi/db");
  const { eq, like } = await import("@nawadi/db/drizzle");
  const query = useQuery();

  // Find all persons whose user_id has a fixture-domain email.
  const fixtureUsers = await query
    .select({ authUserId: s.user.authUserId })
    .from(s.user)
    .where(like(s.user.email, `%${FIXTURE_DOMAIN}`));
  console.log(`  · Fixture users: ${fixtureUsers.length}`);

  // Persons we created via getOrCreate without a user (eva, lisaB, sarah)
  // are recognizable by their (firstName, lastName, dateOfBirth) trio.
  // Hardcode the fixture set — these matchers are dev-only.
  const nonEmailFixtures = [
    { firstName: "Eva", lastName: "Janssen", dateOfBirth: "2008-03-22" },
    { firstName: "Lisa", lastName: "Bakker", dateOfBirth: "2009-07-16" },
    { firstName: "Sarah", lastName: "Boer", dateOfBirth: "2010-12-30" },
  ];

  // For now, just log instructions — destructive deletes across multiple
  // referenced tables (actor, certificate, ...) are non-trivial and the
  // user can pnpm db:reset for a clean slate. Provide the SQL instead.
  console.log(
    `\nCleanup is intentionally manual to avoid destructive surprises.\nFor a clean slate, run: pnpm db:reset\n\nOr remove just the fixtures with:\n  DELETE FROM "user" WHERE email LIKE '%${FIXTURE_DOMAIN}';\n  -- (cascades aren't set; you may need to delete dependent rows too)\n`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.cleanup) {
    const locationId = await pickLocationId(args.locationId);
    await cleanup(locationId);
    return;
  }

  console.log("\n→ Locatie kiezen...");
  const locationId = await pickLocationId(args.locationId);

  console.log(`\n→ Persons seeden in locatie ${locationId}:`);
  const ids = await seedAll(locationId);

  console.log("\n→ Adam diploma seeden (best-effort)...");
  await seedDiplomaForAdam(ids.adam!, locationId);

  console.log("\n→ TSV genereren...\n");
  const tsv = buildTsv();
  console.log(tsv);
  console.log("\n");

  if (args.clipboard) {
    try {
      execSync("pbcopy", { input: tsv });
      console.log("✓ Op klembord geplakt — open de bulk-import dialog en plak.");
    } catch (err) {
      console.warn(
        "Could not copy to clipboard (pbcopy unavailable):",
        (err as Error).message,
      );
    }
  } else {
    console.log(
      "(Tip: voeg --clipboard toe om de TSV direct op het klembord te zetten.)",
    );
  }

  console.log(
    [
      "",
      "Wat te verwachten in de preview:",
      "  · 1 cross-row group   (Maarten Visser, 3 rijen, paste-only)",
      "  · 1 multi-match       (Lisa Bakker — twee bestaande Lisa Bakkers)",
      "  · 1 strong-match      (Adam de Vries, exact)",
      "  · 1 weak/strong       (Eva Jansen — typo van Janssen)",
      "  · 1 perfect/twin      (Sarah de Boer — DOB 1 dag verschil, twin guard)",
      "  · 2 no-match rows     (Nieuwe Persoon, Maria van der Heide)",
      "  · 1 parse error       (rij met ongeldige datum)",
      "",
      "Klik 'Bevestig — zelfde persoon' op de Maarten-groep, kies 'Use existing' op",
      "Adam, los Eva en Lisa op, en bevestig. Daarna kun je naar /personen/duplicaten",
      "om de bestaande Lisa Bakker pair te zien.",
      "",
    ].join("\n"),
  );
}

// Defer env-variable validation until after --help has had a chance to
// short-circuit. parseArgs is called from main() so --help can exit
// without any database setup.
const earlyArgs = process.argv.slice(2);
if (earlyArgs.includes("--help") || earlyArgs.includes("-h")) {
  parseArgs(earlyArgs); // calls process.exit(0)
}

const pgUri = process.env.PGURI;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(pgUri, "PGURI environment variable is required");
assert(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL environment variable is required");
assert(
  supabaseKey,
  "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
);

withSupabaseClient(
  { url: supabaseUrl, serviceRoleKey: supabaseKey },
  () =>
    withDatabase({ connectionString: pgUri }, () => main())
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      }),
);
