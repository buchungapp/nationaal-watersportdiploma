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
    "1. **Leg me eerst uit wat dit portfolio moet zijn** — ik wil snappen hoe het is opgebouwd, wat een beoordelaar zoekt, en waar ik heen werk.",
    "2. **Ik heb al eerdere portfolio's geschreven** — bijv. voor een lager niveau. Ik wil daarop voortbouwen zonder alles opnieuw te doen.",
    "3. **Ik heb aantekeningen of tekst voor dit specifieke portfolio** — ik wil hulp bij het bij elkaar brengen van wat ik al heb.",
    "4. **Ik begin helemaal blanco** — geen eerdere portfolio's, geen aantekeningen, we starten vanaf nul.",
    "",
    "Je kunt hieronder een van de knoppen gebruiken of gewoon in je eigen woorden vertellen waar je staat.",
  ].join("\n");
}
