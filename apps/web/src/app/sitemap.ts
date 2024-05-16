import { constants } from "@nawadi/lib";
import { type MetadataRoute } from "next";
import { getAllArticles } from "~/lib/articles";
import { listFaqs as listFaqsGeneral } from "~/lib/faqs";
import { listFaqs as listFaqsDiplomalijn } from "~/lib/faqs-diplomalijn";
import {
  getAllDiplomalijnConsumentenPages,
  getAllDiplomalijnInstructeurPages,
} from "~/lib/mdx-pages";
import { verenigingSegments } from "./(public)/vereniging/_utils/segments";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = constants.WEBSITE_URL;

  const [articles, dcPages, diPages, faqsGeneral, faqsDiplomalijn] =
    await Promise.all([
      getAllArticles(),
      getAllDiplomalijnConsumentenPages(),
      getAllDiplomalijnInstructeurPages(),
      listFaqsGeneral(),
      listFaqsDiplomalijn(),
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
    url: `${BASE_URL}/diplomalijn/instructeur/${page.pathSegments.join("/")}${page.pathSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const vereniging: MetadataRoute.Sitemap = verenigingSegments.map((page) => ({
    url: `${BASE_URL}/vereniging/${page.pathSegments.join("/")}${page.pathSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const faqGeneralPages: MetadataRoute.Sitemap = faqsGeneral.map((faq) => ({
    url: `${BASE_URL}/help/veelgestelde-vragen/${faq.categories.join("/")}/${faq.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const faqDiplomalijnPages: MetadataRoute.Sitemap = faqsDiplomalijn.map(
    (faq) => ({
      url: `${BASE_URL}/help/veelgestelde-vragen/${faq.categories.join("/")}/${faq.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return (
    [
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
        url: `${BASE_URL}/help`,
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
      ...faqGeneralPages,
      ...faqDiplomalijnPages,
      {
        url: `${BASE_URL}/merk`,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ] as const
  ).map((page) => ({
    ...page,
    url: page.url.replace(/\/$/, ""),
    lastModified: new Date().toISOString(),
  }));
}
