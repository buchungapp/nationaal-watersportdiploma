import { Location, User, withDatabase, withSupabaseClient } from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import inquirer from "inquirer";
import { z } from "zod";

async function main() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "For which location would you like to add a user?",
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
    {
      type: "input",
      name: "firstName",
      message: "First name",
    },
    {
      type: "input",
      name: "lastName",
      message: "Last name",
    },
    {
      type: "input",
      name: "lastNamePrefix",
      message: "Last name prefix",
    },
    {
      type: "input",
      name: "dateOfBirth",
      message: "Date of birth",
    },
    {
      type: "input",
      name: "birthCity",
      message: "Birth city",
    },
    {
      type: "input",
      name: "birthCountry",
      message: "Birth country",
      default: "nl",
    },
  ]);

  const rowSchema = z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .nullable()
      .catch(() => null),
    firstName: z.string().trim(),
    lastNamePrefix: z
      .string()
      .trim()
      .transform((tussenvoegsel) =>
        tussenvoegsel === "" ? null : tussenvoegsel,
      ),
    lastName: z.string(),
    dateOfBirth: z.string().pipe(z.coerce.date()),
    birthCity: z.string(),
    birthCountry: z.string().length(2),
  });

  const row = rowSchema.parse(answers);

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let user;

  if (row.email) {
    user = await User.getOrCreateFromEmail({
      email: row.email,
      displayName: row.firstName,
    });
  }

  const person = await User.Person.getOrCreate({
    userId: user?.id,
    firstName: row.firstName,
    lastName: row.lastName,
    lastNamePrefix: row.lastNamePrefix,
    dateOfBirth: row.dateOfBirth.toISOString(),
    birthCity: row.birthCity,
    birthCountry: row.birthCountry,
  });

  await User.Person.createLocationLink({
    personId: person.id,
    locationId: answers.location,
  });

  await User.Actor.upsert({
    locationId: answers.location,
    type: "student",
    personId: person.id,
  });
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
