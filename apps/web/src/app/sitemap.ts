import { WEBSITE_URL } from "@nawadi/lib/constants";
import { type MetadataRoute } from "next";
import { getAllArticles } from "~/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = WEBSITE_URL;

  const articles = await getAllArticles();
  const articleMaps: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/actueel/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
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
    {
      url: `${BASE_URL}/diplomalijn/consumenten`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/overgang-cwo`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/erkenningen`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/veelgestelde-vragen`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/catamaran`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/jachtzeilen`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/kielboot`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/windsurfen`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/zwaardboot-1mans`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/diplomalijn/consumenten/disciplines/zwaardboot-2mans`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/manifest`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/vertrouwenspersoon`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/gedragscode`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/bestuur`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/secretariaat`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/kwaliteitscommissie`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vereniging/statuten-en-reglementen`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/merk`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
