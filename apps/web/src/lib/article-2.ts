import fs from "fs";
import matter from "gray-matter";
import path from "path";

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return matter(rawContent);
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { content, data } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    return {
      metadata: data,
      slug,
      content,
    };
  });
}

export function getHelpArticles() {
  return getMDXData(
    path.join(process.cwd(), "./src/app/(public)/help/_content"),
  );
}
