import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { downloadKnowledgeCenterDocument } from "~/lib/nwd";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url);

  const forceDownload = searchParams.has("download");

  const url = await downloadKnowledgeCenterDocument(
    (await context.params).id,
    forceDownload,
  ).catch(() => notFound());

  redirect(url);
}
