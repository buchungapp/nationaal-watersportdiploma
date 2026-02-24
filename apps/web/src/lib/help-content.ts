import path from "node:path";
import glob from "fast-glob";
import { cacheLife } from "next/cache";
import type { ComponentType } from "react";

export interface HelpArticleMetadata {
  title: string;
  publishedAt: string;
  lastUpdatedAt: string;
  summary: string;
  isPopulair?: boolean;
}

export interface HelpFaqMetadata {
  question: string;
  lastUpdatedAt: string;
}

export interface HelpArticle {
  category: string;
  Component: ComponentType<Record<string, unknown>>;
  metadata: HelpArticleMetadata;
  slug: string;
}

export interface HelpFaq {
  Component: ComponentType<Record<string, unknown>>;
  metadata: HelpFaqMetadata;
  slug: string;
}

const HELP_CATEGORIES = [
  {
    slug: "app-consumenten",
    title: "Jouw online omgeving",
    description: "Hoe gebruik je jouw online NWD omgeving?",
  },
  {
    slug: "app-vaarlocaties",
    title: "Vaarlocatie app",
    description:
      "Hoe werkt de online (les)omgeving van vaarlocaties voor instructeurs en locatiebeheerders?",
  },
  {
    slug: "diplomalijn",
    title: "Diplomalijn",
    description:
      "Hoe werkt de NWD diplomalijn, en wat zijn verschillen met andere systemen?",
  },
  {
    slug: "vereniging",
    title: "Vereniging NWD",
    description: "De koepelorganisatie voor commerciële vaarscholen",
  },
  {
    slug: "zeilkampen",
    title: "Zeilkampen",
    description: "Hoe werkt een zeilkamp, en welke is het beste?",
  },
] as const;

function assertHelpArticleMetadata(
  value: unknown,
  filename: string,
): asserts value is HelpArticleMetadata {
  if (!value || typeof value !== "object") {
    throw new Error(`Missing article export in ${filename}`);
  }

  const metadata = value as Record<string, unknown>;
  const requiredStringKeys = [
    "title",
    "publishedAt",
    "lastUpdatedAt",
    "summary",
  ] as const;

  for (const key of requiredStringKeys) {
    if (typeof metadata[key] !== "string") {
      throw new Error(`Invalid article.${key} in ${filename}`);
    }
  }

  if (
    metadata.isPopulair !== undefined &&
    typeof metadata.isPopulair !== "boolean"
  ) {
    throw new Error(`Invalid article.isPopulair in ${filename}`);
  }
}

function assertHelpFaqMetadata(
  value: unknown,
  filename: string,
): asserts value is HelpFaqMetadata {
  if (!value || typeof value !== "object") {
    throw new Error(`Missing faq export in ${filename}`);
  }

  const metadata = value as Record<string, unknown>;
  const requiredStringKeys = ["question", "lastUpdatedAt"] as const;

  for (const key of requiredStringKeys) {
    if (typeof metadata[key] !== "string") {
      throw new Error(`Invalid faq.${key} in ${filename}`);
    }
  }
}

export const getHelpArticles = async (): Promise<HelpArticle[]> => {
  const cwd = path.join(process.cwd(), "./src/app/(public)/help/artikel/_content");
  const filenames = await glob("**/*.mdx", { cwd });

  const articles = await Promise.all(
    filenames.map(async (filename) => {
      const mdxModule = (await import(
        /* webpackInclude: /\.mdx$/ */
        `../app/(public)/help/artikel/_content/${filename}`
      )) as {
        default?: ComponentType<Record<string, unknown>>;
        article?: unknown;
      };

      if (!mdxModule.default) {
        throw new Error(`Missing default export in ${filename}`);
      }

      assertHelpArticleMetadata(mdxModule.article, filename);

      const slug = path.basename(filename, ".mdx");
      const category = path.dirname(filename);

      if (!category || category === ".") {
        throw new Error(`Expected category subfolder for help article: ${filename}`);
      }

      return {
        category,
        Component: mdxModule.default,
        metadata: {
          ...mdxModule.article,
          isPopulair: mdxModule.article.isPopulair ?? false,
        },
        slug,
      };
    }),
  );

  return articles.sort((a, b) => a.slug.localeCompare(b.slug));
};

export const getHelpFaqs = async (): Promise<HelpFaq[]> => {
  const cwd = path.join(
    process.cwd(),
    "./src/app/(public)/help/veelgestelde-vragen/_content",
  );
  const filenames = await glob("**/*.mdx", { cwd });

  const faqs = await Promise.all(
    filenames.map(async (filename) => {
      const mdxModule = (await import(
        /* webpackInclude: /\.mdx$/ */
        `../app/(public)/help/veelgestelde-vragen/_content/${filename}`
      )) as {
        default?: ComponentType<Record<string, unknown>>;
        faq?: unknown;
      };

      if (!mdxModule.default) {
        throw new Error(`Missing default export in ${filename}`);
      }

      assertHelpFaqMetadata(mdxModule.faq, filename);

      return {
        Component: mdxModule.default,
        metadata: mdxModule.faq,
        slug: path.basename(filename, ".mdx"),
      };
    }),
  );

  return faqs.sort((a, b) => a.slug.localeCompare(b.slug));
};

export const getHelpCategories = async () => {
  "use cache";
  cacheLife("minutes");

  return [...HELP_CATEGORIES];
};
