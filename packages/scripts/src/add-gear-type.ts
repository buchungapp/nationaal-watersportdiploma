import { Curriculum, withDatabase } from "@nawadi/core";
import slugify from "@sindresorhus/slugify";
import "dotenv/config";
import inquirer from "inquirer";
import { z } from "zod";

export const validSlugRegex = new RegExp(/^[a-zA-Z0-9-]+$/);

async function main() {
  const result = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Gear type name",
    },
  ]);

  const slugSchema = z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(48, "Slug must be less than 48 characters")
    .transform((v) => slugify(v))
    .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

  await Curriculum.GearType.create({
    title: result.name,
    handle: slugSchema.parse(result.name),
  });
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
