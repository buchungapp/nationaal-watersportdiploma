import { withDatabase } from "@nawadi/core";
import "dotenv/config";
import inquirer from "inquirer";

async function main() {
  const result = await inquirer.prompt([
    {
      type: "input",
      name: "number",
      message: "Enter the certificate number",
    },
  ]);
}

const pgUri = process.env.PGURI;

if (!pgUri) {
  throw new Error("PGURI environment variable is required");
}

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
