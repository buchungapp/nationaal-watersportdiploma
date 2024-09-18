import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import remarkGfm from "remark-gfm";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    mdxRs: true,
    outputFileTracingIncludes: {
      "/api/export/certificate/pdf": ["./src/assets/fonts/**/*"],
      "/": ["./src/app/(public)/**/*.mdx"],
    },
    instrumentationHook: true,
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
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

export default withMDX(withSentryConfig(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "frontend070",
  project: "javascript-nextjs",
  // sentryUrl: "https://sentry.io/",

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  // hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
