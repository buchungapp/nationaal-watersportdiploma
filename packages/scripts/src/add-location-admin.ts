import { Location, User, withDatabase, withSupabaseClient } from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import inquirer from "inquirer";
import { z } from "zod";

async function connect(personId: string, locationId: string) {
  await User.Person.createLocationLink({
    personId: personId,
    locationId: locationId,
  });

  await User.Actor.upsert({
    personId: personId,
    locationId: locationId,
    type: "location_admin",
  });
}

async function main() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "For which location would you like to add an admin?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
    {
      type: "input",
      name: "email",
      message: "Email address",
    },
  ]);

  const rowSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
  });

  const row = rowSchema.parse(answers);

  const user = await User.getOrCreateFromEmail({
    email: row.email,
  });

  const personsForUser = await User.Person.list({
    filter: {
      userId: user.id,
    },
  }).then((res) => res.items);

  // biome-ignore lint/suspicious/noImplicitAnyLet: intentional
  let personId;

  if (personsForUser.length > 0) {
    // Ask if there is a person that should be linked
    const result = await inquirer.prompt([
      {
        type: "list",
        name: "personId",
        message: "Which person would you like to link?",
        choices: [
          {
            name: "Create new person",
            value: null,
          },
          ...personsForUser.map((person) => ({
            name: person.firstName,
            value: person.id,
          })),
        ],
      },
    ]);

    personId = result.personId;
  }

  if (!personId) {
    const personAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "firstName",
        message: "First name",
      },
    ]);

    const person = await User.Person.getOrCreate({
      userId: user.id,
      firstName: z.string().parse(personAnswers.firstName),
    });

    personId = person.id;
  }

  if (!personId) {
    throw new Error("No person ID");
  }

  await connect(personId, answers.location);
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
