import { User, withDatabase, withSupabaseClient } from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import inquirer from "inquirer";
import { z } from "zod";

async function main() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "personId",
      message: "Person ID",
    },
    {
      type: "input",
      name: "targetPersonId",
      message: "Target person ID",
    },
  ]);

  const rowSchema = z.object({
    personId: z.string(),
    targetPersonId: z.string(),
  });

  const row = rowSchema.parse(answers);

  await User.Person.mergePersons(row);
}

const pgUri = process.env.PGURI;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(pgUri, "PGURI environment variable is required");
assert(
  supabaseUrl,
  "NEXT_PUBLIC_SUPABASE_URL environment variable is required",
);
assert(
  supabaseKey,
  "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
);

withSupabaseClient(
  {
    url: supabaseUrl,
    serviceRoleKey: supabaseKey,
  },
  () =>
    withDatabase(
      {
        connectionString: pgUri,
      },
      async () => await main(),
    )
      .then(() => {
        console.log("Done!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      }),
);
