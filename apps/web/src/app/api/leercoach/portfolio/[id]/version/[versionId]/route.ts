import { Leercoach } from "@nawadi/core";
import { NextResponse } from "next/server";
import { getSession } from "~/lib/auth/server";
import { leercoachEnabled } from "~/lib/flags";

// Fetch a single historical portfolio version's full content. Called
// by the history sidebar's preview pane (which only receives version
// metadata on the initial page render; full content is lazy-loaded
// on click to avoid shipping every version's markdown for a portfolio
// with 40+ versions).
//
// The `id` path segment is the portfolio id; `versionId` is the
// specific version to load. Ownership is enforced via the version's
// parent-portfolio userId, not via `id` alone — the core model does
// that join for us.

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; versionId: string }> },
) {
  if (!(await leercoachEnabled())) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  const { id: portfolioId, versionId } = await ctx.params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const version = await Leercoach.Portfolio.getVersionById({
    versionId,
    userId: session.user.id,
  });
  if (!version) {
    return NextResponse.json(
      { error: "Versie niet gevonden." },
      { status: 404 },
    );
  }
  if (version.portfolioId !== portfolioId) {
    // Defensive: someone's fishing with a mismatched portfolio id.
    return NextResponse.json(
      { error: "Versie hoort niet bij dit portfolio." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    versionId: version.versionId,
    portfolioId: version.portfolioId,
    content: version.content,
    createdBy: version.createdBy,
    createdAt: version.createdAt,
    label: version.label,
    changeNote: version.changeNote,
  });
}
