import { notFound, redirect } from "next/navigation";
import { findArticleById } from "~/lib/articles";

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } },
) {
  const slug = params.slug.at(0);

  if (!slug) {
    notFound();
  }

  const id = slug.split("-").at(0) ?? "";

  const article = await findArticleById(id);

  if (!article) {
    notFound();
  }

  redirect(`/actueel/${article.slug}`);
}
