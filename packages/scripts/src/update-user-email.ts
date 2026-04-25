import { Auth, User, withDatabase } from "@nawadi/core";
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

  await Auth.updateUserEmail({
    userId: row.authUserId,
    email: row.newEmail,
  });
}

const pgUri = process.env.PGURI;

assert(pgUri, "PGURI environment variable is required");

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
  });
