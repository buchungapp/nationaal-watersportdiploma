// Vitest setup file — runs before every test file.
//
// Extends vitest's `expect` with @testing-library/jest-dom's DOM-aware
// matchers (toBeInTheDocument, toBeVisible, toHaveTextContent, etc.) so
// component tests can make readable assertions against jsdom trees.

import "@testing-library/jest-dom/vitest";
