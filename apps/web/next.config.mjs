import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    mdxRs: true,
    outputFileTracingIncludes: {
      "/api/export/certificate/pdf": ["./src/assets/fonts/**/*"],
    },
  },
  async redirects() {
    return [
      {
        source: "/faq-consument",
        destination: "/actueel/RLjvQDiv-lancering-nationaal-watersportdiploma",
        permanent: true,
      },
      {
        source: "/faq-instructeur",
        destination:
          "/actueel/3yHwZSTf-een-nieuw-tijdperk-voor-jou-als-instructeur-met-het-nwd",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
