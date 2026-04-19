import "server-only";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";

export type ChatScope =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

export type ResolvedKerntaak = { code: string; titel: string };

export type ResolvedChatContext = {
  profielId: string;
  profielTitel: string;
  niveauRang: number | null;
  scope: ChatScope;
  /** "je volledige portfolio" / "kerntaak 5.1 — Begeleidt cursisten" etc. */
  scopeLabel: string;
  /** For kerntaak/kerntaken scopes: the resolved kerntaak info. */
  kerntaken: ResolvedKerntaak[];
};

/**
 * Resolve human-readable context for a chat — profielTitel, niveauRang, and
 * kerntaak titels matching the scope. Used by both the opening-message
 * generator and the title builder so they agree on how to refer to things.
 *
 * Scans niveaus + profielen because the anonymous read path doesn't expose a
 * by-id helper. Defensive defaults if anything is missing (we'd rather ship
 * a slightly-generic title than fail the whole chat creation).
 */
export async function resolveChatContext(input: {
  profielId: string;
  scope: ChatScope;
}): Promise<ResolvedChatContext> {
  const { profielId, scope } = input;
  const niveaus = await listKssNiveaus();

  let profielTitel = "portfolio";
  let niveauRang: number | null = null;
  const resolvedKerntaken: ResolvedKerntaak[] = [];

  outer: for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    const match = profielen.find((p) => p.id === profielId);
    if (match) {
      profielTitel = match.titel;
      niveauRang = niveau.rang;
      const codes =
        scope.type === "kerntaak"
          ? [scope.kerntaakCode]
          : scope.type === "kerntaken"
            ? scope.kerntaakCodes
            : [];
      for (const code of codes) {
        const kt = match.kerntaken.find((k) => String(k.rang ?? "") === code);
        resolvedKerntaken.push({ code, titel: kt?.titel ?? "" });
      }
      break outer;
    }
  }

  return {
    profielId,
    profielTitel,
    niveauRang,
    scope,
    scopeLabel: describeScope(scope, resolvedKerntaken),
    kerntaken: resolvedKerntaken,
  };
}

function describeScope(scope: ChatScope, kerntaken: ResolvedKerntaak[]): string {
  switch (scope.type) {
    case "full_profiel":
      return "je volledige portfolio";
    case "kerntaak": {
      const first = kerntaken[0];
      if (first?.titel) return `kerntaak ${first.code} — ${first.titel}`;
      return `kerntaak ${scope.kerntaakCode}`;
    }
    case "kerntaken": {
      if (kerntaken.length > 0) {
        const parts = kerntaken.map((c) =>
          c.titel ? `${c.code} (${c.titel})` : c.code,
        );
        return `kerntaken ${parts.join(", ")}`;
      }
      return `kerntaken ${scope.kerntaakCodes.join(", ")}`;
    }
  }
}

/**
 * Build the session title that shows up in the chat list. Compact and
 * scannable — "Instructeur 5 — Hele profiel" / "Instructeur 5 — Kerntaak 5.1".
 * Intentionally does not repeat the kerntaak titel because it would bloat the
 * list row; the full titel is visible inside the chat view.
 */
export function buildChatTitle(ctx: ResolvedChatContext): string {
  const prefix = ctx.niveauRang
    ? `${ctx.profielTitel}`
    : ctx.profielTitel;
  const scopePart = (() => {
    switch (ctx.scope.type) {
      case "full_profiel":
        return "Hele profiel";
      case "kerntaak":
        return `Kerntaak ${ctx.scope.kerntaakCode}`;
      case "kerntaken":
        return `Kerntaken ${ctx.scope.kerntaakCodes.join(", ")}`;
    }
  })();
  return `${prefix} — ${scopePart}`;
}
