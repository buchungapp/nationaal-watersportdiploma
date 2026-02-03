import {
  Location,
  Platform,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import fs from "node:fs";
import inquirer from "inquirer";

export const validSlugRegex = new RegExp(/^[a-zA-Z0-9-]+$/);

async function processFile(filePath: string) {
  // Read the file into a buffer
  const buffer = fs.readFileSync(filePath);

  if (buffer.length < 1) {
    console.log("The file is empty");
    process.exit(1);
  }

  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "For which location would you like to add media?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
  ]);

  const mediaId = await Platform.Media.create({
    file: buffer,
    locationId: location,
  });

  console.log("Media created with ID:", mediaId);
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
      async () => {
        // Get the file path from the command-line arguments
        const filePath = process.argv[2];

        // Check if the file path was provided
        if (!filePath) {
          console.log("Please provide a file path.");
          process.exit(1);
        }

        await processFile(filePath);
      },
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
