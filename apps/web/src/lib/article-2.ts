/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import assert from "assert";
import glob from "fast-glob";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { z } from "zod";

function getMDXFiles(dir: string) {
  return glob("**/*.mdx", {
    cwd: dir,
  });
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return matter(rawContent);
}

interface MDXData<T> {
  metadata: T;
  slug: string;
  content: string;
  pathSegments: string[];
}

async function getMDXData<T extends z.ZodSchema<any>>(
  dir: string,
  metadataSchema: T,
): Promise<MDXData<z.infer<T>>[]>;
async function getMDXData(dir: string): Promise<MDXData<Record<string, any>>[]>;
async function getMDXData<T extends z.ZodSchema<any>>(
  dir: string,
  metadataSchema?: T,
) {
  const mdxFiles = await getMDXFiles(dir);

  return mdxFiles.map((file) => {
    const { content, data } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    const pathSegments = file.split("/").slice(0, -1);

    const metadata = metadataSchema ? metadataSchema.parse(data) : data;

    return {
      pathSegments,
      metadata,
      slug,
      content,
    };
  });
}

export async function getHelpArticles() {
  const articles = await getMDXData(
    path.join(process.cwd(), "./src/app/(public)/help/artikel/_content"),
    z.object({
      title: z.string(),
      publishedAt: z.string().date(),
      lastUpdatedAt: z.string().date(),
      summary: z.string(),
    }),
  );

  return articles.map(({ pathSegments, ...article }) => {
    assert.strictEqual(
      pathSegments.length,
      1,
      "Help articles should be in a category folder",
    );
    const category = pathSegments[0]!;
    return {
      category,
      ...article,
    };
  });
}

export async function getHelpFaqs() {
  const articles = await getMDXData(
    path.join(
      process.cwd(),
      "./src/app/(public)/help/veelgestelde-vragen/_content",
    ),
    z.object({
      question: z.string(),
      lastUpdatedAt: z.string().date(),
    }),
  );

  return articles.map(({ pathSegments: _p, ...article }) => {
    return article;
  });
}
