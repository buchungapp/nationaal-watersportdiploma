import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest config for component + hook tests in apps/web.
//
// Scope (intentional):
// - Component tests that render React with a mocked useChat hook.
// - Hook tests (useStickyScroll) driven in a real jsdom DOM.
// - NOT streaming-integration tests with simulateReadableStream — that's a
//   follow-up layer once we want to assert partial-token rendering.
// - NOT E2E — that's a separate Playwright setup if we ever need it.
//
// Pure-logic tests (our existing node --test suites for portfolio-helper-
// sandbox + ai-chat scroll helpers) stay on node --test. Faster startup,
// no JSX transform cost, and no reason to migrate them until they need a
// DOM.
//
// Alias resolution: Vite v7 (vitest@4) supports tsconfig paths natively
// via resolve.tsconfigPaths; we explicitly declare the `~/` alias here
// instead of walking every tsconfig in the repo (which caused noisy
// warnings from unrelated .tmp/midday configs).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Limit to component tests. Pure-logic tests in the same dirs use the
    // `.test.ts` extension and are run by node --test; the `.test.tsx`
    // extension is reserved for component tests run by vitest.
    include: ["src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "out", "dist"],
  },
});
