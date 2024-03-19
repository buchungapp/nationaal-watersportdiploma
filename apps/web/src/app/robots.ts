import { WEBSITE_URL } from "@nawadi/lib/constants";
import type { MetadataRoute } from "next";
import { HAVE_WE_LAUNCHED } from "../../launch-control";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      //   🚀 launch control
      disallow: !HAVE_WE_LAUNCHED && ["/actueel/", "/helpcentrum/"],
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
