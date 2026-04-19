import "server-only";
import type { ResolvedChatContext } from "./chat-context";

/**
 * Build the leercoach's opening message for a freshly-created chat. This
 * runs server-side during createChatAction so the kandidaat lands on the
 * chat page with an actual welcome instead of a blank canvas.
 *
 * Deterministic template — no LLM call here. Rationale: keeps session
 * creation fast and free, and the opening is stable enough that a
 * template reads as warm rather than generic. When we want variation we
 * upgrade to an LLM call, but not today.
 */
export function buildOpeningMessage(ctx: ResolvedChatContext): string {
  const profielLabel = ctx.niveauRang
    ? `${ctx.profielTitel} (niveau ${ctx.niveauRang})`
    : ctx.profielTitel;

  return [
    `Welkom. Ik ben je leercoach en ik help je werken aan ${ctx.scopeLabel} voor **${profielLabel}**.`,
    "",
    "Voordat we beginnen, een paar dingen om te weten:",
    "- Ik schrijf jouw portfolio **niet** voor je. Mijn rol is om de juiste vragen te stellen, op blinde vlekken te wijzen, en voorbeelden uit vergelijkbare portfolio's aan te dragen als dat helpt.",
    "- Alles wat je hier typt wordt opgeslagen, dus je kunt deze sessie altijd later weer oppakken.",
    "- Op elk moment kun je zeggen \"ik heb hier geen idee over\" of \"kun je een voorbeeld laten zien\" — dat is waar ik voor ben.",
    "",
    "**Waar sta je nu?** Kies wat het meest bij jou past:",
    "1. **Ik ben nieuw hier** — ik wil eerst begrijpen wat een portfolio voor dit niveau eigenlijk moet zijn en hoe de opbouw werkt.",
    "2. **Ik ben klaar om te schrijven** — ik heb nog niks op papier en wil samen met jou beginnen.",
    "3. **Ik heb al materiaal liggen** — ik heb al wat geschreven of aantekeningen en wil hulp bij het bij elkaar brengen.",
    "",
    "Je kunt hieronder een van de knoppen gebruiken of gewoon in je eigen woorden vertellen waar je staat.",
  ].join("\n");
}
