import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { findArticleById } from "~/lib/articles";

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string[] }> },
) {
  const params = await props.params;
  const slug = params.slug.at(0);

  if (!slug) {
    notFound();
  }

  const id = slug.split("-").at(0) ?? "";

  const article = await findArticleById(id);

  if (!article) {
    notFound();
  }

  return NextResponse.redirect(
    new URL(`/actueel/${article.slug}`, request.url),
    308,
  );
}
