import { WEBSITE_URL } from "@nawadi/lib/constants";
import { type MetadataRoute } from "next";
import { getAllArticles } from "~/lib/articles";
import { consumentSegments } from "./diplomalijn/consument/_utils/segments";
import { instructeurSegments } from "./diplomalijn/instructeur/_utils/segments";
import { verenigingSegments } from "./vereniging/_utils/segments";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = WEBSITE_URL;

  const articles = await getAllArticles();
  const articleMaps: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/actueel/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const consument: MetadataRoute.Sitemap[] = consumentSegments.map((segment) =>
    segment.pages.map((page) => ({
      url: `${BASE_URL}/diplomalijn/consument/${segment.parentSegments.join("/")}${segment.parentSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
      changeFrequency: "monthly",
      priority: page.weight ?? 0.7,
    })),
  );

  const instructeur: MetadataRoute.Sitemap[] = instructeurSegments.map(
    (segment) =>
      segment.pages.map((page) => ({
        url: `${BASE_URL}/diplomalijn/instructeur/${segment.parentSegments.join("/")}${segment.parentSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
        changeFrequency: "monthly",
        priority: page.weight ?? 0.7,
      })),
  );

  const vereniging: MetadataRoute.Sitemap[] = verenigingSegments.map(
    (segment) =>
      segment.pages.map((page) => ({
        url: `${BASE_URL}/vereniging/${segment.parentSegments.join("/")}${segment.parentSegments.length > 0 ? "/" : ""}${page.slug ?? ""}`,
        changeFrequency: "monthly",
        priority: page.weight ?? 0.7,
      })),
  );

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
    ...consument.flat(),
    ...instructeur.flat(),
    ...vereniging.flat(),
    {
      url: `${BASE_URL}/merk`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
