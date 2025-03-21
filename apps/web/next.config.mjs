import nextMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    mdxRs: true,
    serverActions: {
      bodySizeLimit: "6mb",
    },
    turbo: {
      resolveAlias: {
        canvas: "./empty-module.ts",
      },
    },
    useCache: true,
  },
  outputFileTracingIncludes: {
    "/api/export/certificate/pdf": ["./src/assets/fonts/**/*"],
    "/": ["./src/app/(public)/**/*.mdx"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "kfwvxetvsoujgiighiqx.supabase.co",
      },
    ],
  },
  transpilePackages: ["next-mdx-remote"],
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
      {
        source: "/help/artikel/nwd-of-cwo-wat-is-het-beste-voor-jou",
        destination: "/help/artikel/nwd-vervangt-cwo-als-nationale-standaard",
        permanent: true,
      },
      {
        source: "/de-nieuwe-standaard",
        destination: "/help/artikel/nwd-vervangt-cwo-als-nationale-standaard",
        permanent: true,
      },
      {
        source: "/helpcentrum/:path*",
        destination: "/help/:path*",
        permanent: true,
      },
      {
        source: "/profiel",
        destination: "/account",
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
  webpack: (config, context) => {
    /** Uncomment to enable WhyDidYouRender */
    // injectWhyDidYouRender(config, context);

    config.resolve.alias.canvas = false;
    return config;
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
