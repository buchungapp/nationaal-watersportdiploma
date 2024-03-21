import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import { micromark } from "micromark";
import { unstable_cache } from "next/cache";
import slugify from "slugify";
import { z } from "zod";

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets.readonly",
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
});

const service = google.sheets({ version: "v4", auth });
const faqCategory = z.union([
  z.literal("consument"),
  z.literal("instructeur"),
  z.literal("vaarlocatie"),
]);

type FaqCategory = z.infer<typeof faqCategory>;
export interface Faq {
  category: FaqCategory;
  question: string;
  answer: string;
}

interface FaqFilters {
  category?: FaqCategory | [FaqCategory, ...FaqCategory[]];
  featured?: true;
}

async function retrieveQuestions({
  filter,
}: {
  filter?: FaqFilters;
} = {}) {
  try {
    const result = await service.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_FAQ_SPREADSHEET_ID,
      range: "A2:D",
    });

    const rowSchema = z.tuple([
      faqCategory,
      z.string().trim(),
      z.string().trim(),
      z.union([z.literal("TRUE"), z.literal("FALSE")]),
    ]);

    const validQuestions: z.infer<typeof rowSchema>[] = [];

    // Loop over result.data.values, skip each row that doesn't match the schema
    for (const row of result.data.values ?? []) {
      try {
        const parsed = rowSchema.parse(row);

        if (filter?.category) {
          if (Array.isArray(filter)) {
            if (!filter.includes(parsed[0])) {
              continue;
            }
          } else {
            if (parsed[0] !== filter.category) {
              continue;
            }
          }
        }

        if (!!filter?.featured) {
          if (parsed[3] !== "TRUE") {
            continue;
          }
        }

        validQuestions.push(parsed);
      } catch (err) {
        continue;
      }
    }

    return validQuestions.map(([category, question, answer, featured]) => ({
      category,
      slug: slugify(question, { strict: true }),
      featured: featured === "TRUE",
      question,
      answer: micromark(answer),
    }));
  } catch (err) {
    console.error("error fetching faq", err);
    return [];
  }
}

export function listFaqs({
  filter,
}: {
  filter?: FaqFilters;
} = {}) {
  return unstable_cache(
    () => retrieveQuestions({ filter }),
    [`faq`, `faq-${JSON.stringify(filter)}`],
  )();
}
