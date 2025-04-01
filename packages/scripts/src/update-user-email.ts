import {
  User,
  useSupabaseClient,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import inquirer from "inquirer";
import { z } from "zod";

async function main() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "authUserId",
      message: "Auth User Id",
    },
    {
      type: "input",
      name: "email",
      message: "Email address",
    },
    {
      type: "input",
      name: "newEmail",
      message: "New email address",
    },
  ]);

  const rowSchema = z.object({
    authUserId: z.string().trim().uuid(),
    email: z.string().trim().toLowerCase().email(),
    newEmail: z.string().trim().toLowerCase().email(),
  });

  const row = rowSchema.parse(answers);

  const user = await User.fromId(row.authUserId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.email !== row.email) {
    throw new Error("Current email does not match");
  }

  const supabase = useSupabaseClient();

  const { data: userData } = await supabase.auth.admin.getUserById(
    user.authUserId,
  );

  if (!userData) {
    throw new Error("User not found");
  }

  if (userData.user?.email !== row.email) {
    throw new Error("Current email does not match");
  }

  await supabase.auth.admin.updateUserById(user.authUserId, {
    email: row.newEmail,
  });

  await supabase
    .from("user")
    .update({
      email: row.newEmail,
    })
    .eq("auth_user_id", user.authUserId);
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
        pgUri,
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
