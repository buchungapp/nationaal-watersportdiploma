import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { downloadKnowledgeCenterDocument } from "~/lib/nwd";

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  const url = await downloadKnowledgeCenterDocument(context.params.id).catch(
    () => notFound(),
  );

  redirect(url);
}
