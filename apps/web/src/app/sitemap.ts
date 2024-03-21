import { WEBSITE_URL } from "@nawadi/lib/constants";
import { type MetadataRoute } from "next";
import { getAllArticles } from "~/lib/articles";

import { listFaqs } from "~/lib/faqs";
import {
  getAllDiplomalijnConsumentenPages,
  getAllDiplomalijnInstructeurPages,
} from "~/lib/mdx-pages";
import { verenigingSegments } from "./vereniging/_utils/segments";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = WEBSITE_URL;

  const [articles, dcPages, diPages, faqs] = await Promise.all([
    getAllArticles(),
    getAllDiplomalijnConsumentenPages(),
    getAllDiplomalijnInstructeurPages(),
    listFaqs(),
  ]);
  const articleMaps: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/actueel/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const consument: MetadataRoute.Sitemap = dcPages.map((page) => ({
    url: `${BASE_URL}/diplomalijn/consument/${page.pathSegments.join("/")}${page.pathSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const instructeur: MetadataRoute.Sitemap = diPages.map((page) => ({
    url: `${BASE_URL}/diplomalijn/consument/${page.pathSegments.join("/")}${page.pathSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const vereniging: MetadataRoute.Sitemap = verenigingSegments.map((page) => ({
    url: `${BASE_URL}/diplomalijn/consument/${page.pathSegments.join("/")}${page.pathSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const faqPages: MetadataRoute.Sitemap = faqs.map((faq) => ({
    url: `${BASE_URL}/helpcentrum/veelgestelde-vragen/${faq.category}/${faq.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/vaarlocaties`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/over`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/helpcentrum`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/actueel`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...articleMaps,
    ...consument,
    ...instructeur,
    ...vereniging,
    ...faqPages,
    {
      url: `${BASE_URL}/merk`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
