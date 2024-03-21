import glob from "fast-glob";
import path from "path";
import type { Page } from "~/app/types";

// Maurits: I know this is ugly, but need to move fast
// and we get build errors when we try to give this
// function any argument to pass the path
// TODO

export async function getAllDiplomalijnInstructeurPages() {
  const workingPath = process.cwd();
  const contentPath = `./src/app/`;

  const pageFilenames = await glob("**/page.mdx", {
    cwd: path.join(workingPath, contentPath, "diplomalijn/instructeur"),
  });

  const pages = await Promise.all(
    pageFilenames.map(async (pageFilename) => {
      const { page } = (await import(
        `../app/${"diplomalijn/instructeur"}/${pageFilename}`
      )) as {
        default: React.ComponentType;
        page: Page;
      };

      const filePath = pageFilename.replace(/\/page.mdx$/, "");

      const slug = filePath === "page.mdx" ? null : filePath.split("/").at(-1)!;

      return {
        pathSegments: filePath.split("/").slice(0, -1),
        slug,
        ...page,
      };
    }),
  );

  return pages.sort((a, z) => {
    // Sort on order if available
    if (a.order && z.order) return a.order - z.order;

    // Sort on title if order is not available
    return a.title.localeCompare(z.title);
  });
}

export async function getAllDiplomalijnConsumentenPages() {
  const workingPath = process.cwd();
  const contentPath = `./src/app/`;

  const pageFilenames = await glob("**/page.mdx", {
    cwd: path.join(workingPath, contentPath, "diplomalijn/consument"),
  });

  const pages = await Promise.all(
    pageFilenames.map(async (pageFilename) => {
      const { page } = (await import(
        `../app/${"diplomalijn/consument"}/${pageFilename}`
      )) as {
        default: React.ComponentType;
        page: Page;
      };

      const filePath = pageFilename.replace(/\/page.mdx$/, "");

      const slug = filePath === "page.mdx" ? null : filePath.split("/").at(-1)!;

      return {
        pathSegments: filePath.split("/").slice(0, -1),
        slug,
        ...page,
      };
    }),
  );

  return pages.sort((a, z) => {
    // Sort on order if available
    if (a.order && z.order) return a.order - z.order;

    // Sort on title if order is not available
    return a.title.localeCompare(z.title);
  });
}
