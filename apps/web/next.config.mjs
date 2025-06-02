import nextMDX from "@next/mdx";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.usefathom.com https://maps.googleapis.com https://vercel.live https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live;
    img-src 'self' blob: data: https://*.mux.com https://*.googleapis.com https://*.gstatic.com https://vercel.live https://vercel.com https://cdn.usefathom.com https://service.nwd.nl 127.0.0.1:* localhost:*;
    font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com https://vercel.live https://assets.vercel.com;
    connect-src 'self' 
        https://cdn.usefathom.com
        https://*.fastly.mux.com
        https://*.mux.com
        https://*.googleapis.com
        https://*.gstatic.com
        wss://ws-us3.pusher.com
        https://vercel.live
        https://service.nwd.nl;
    media-src 'self' blob: https://*.mux.com https://service.nwd.nl;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src https://vercel.live;
    frame-ancestors 'none';
    upgrade-insecure-requests;
    report-to csp-endpoint;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    mdxRs: true,
    serverActions: {
      bodySizeLimit: "6mb",
    },

    useCache: true,
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  serverExternalPackages: [
    "require-in-the-middle",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/instrumentation",
    "@opentelemetry/sdk-node",
  ],
  outputFileTracingIncludes: {
    "/api/export/certificate/pdf/**/*": [
      "./src/assets/fonts/**/*",
      "./src/assets/certificates/**/*",
    ],
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
      // {
      //   source: "/help/artikel/nwd-of-cwo-wat-is-het-beste-voor-jou",
      //   destination: "/help/artikel/nwd-vervangt-cwo-als-nationale-standaard",
      //   permanent: true,
      // },
      {
        source: "/de-nieuwe-standaard",
        destination:
          "/help/artikel/watersportverbond-kiest-voor-het-nwd-wat-betekent-dit-voor-jou",
        permanent: true,
      },
      {
        source: "/helpcentrum/:path*",
        destination: "/help/:path*",
        permanent: true,
      },
      {
        source: "/aansluiten",
        destination:
          "/help/artikel/hoe-werkt-de-aansluitingsprocedure-van-het-nwd",
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
          {
            key: "Reporting-Endpoints",
            value:
              'csp-endpoint="https://www.nationaalwatersportdiploma.nl/api/csp-report"',
          },
        ],
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
