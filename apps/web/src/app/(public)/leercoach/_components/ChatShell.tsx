"use client";

import {
  AiChatWindow,
  type AiChatInitialMessage,
  type AiChatStarter,
} from "~/app/_components/ai-chat";
import { UploadPriorPortfolioInline } from "./UploadPriorPortfolioInline";

type Props = {
  chatId: string;
  initialMessages: AiChatInitialMessage[];
};

// Thin leercoach-specific wrapper around AiChatWindow. Responsibilities:
//   - leercoach API endpoint
//   - four starter chips matching our user archetypes
//   - inline "Eerder portfolio uploaden" affordance as children
//     (rendered between the starter chips and the input form).
//     UploadPriorPortfolioInline consumes useAiChatContext() directly
//     to grab sendMessage + isLoading — no render-prop needed.
//
// Future surfaces (/portfolio-checker, /portfolio-review) consume
// AiChatWindow the same way, or drop to the compound <AiChat.Provider>
// + pieces if they need different ordering.
export function ChatShell({ chatId, initialMessages }: Props) {
  return (
    <AiChatWindow
      chatId={chatId}
      initialMessages={initialMessages}
      apiEndpoint="/api/leercoach/chat"
      starters={LEERCOACH_STARTERS}
    >
      <UploadPriorPortfolioInline />
    </AiChatWindow>
  );
}

// Four starter chips matching the archetypes in the opening message.
// Each chip sends a full first-person prompt so the leercoach knows
// exactly where the kandidaat is and can respond without another round
// of "waar begin je?".
//
// Key distinction: "eerdere portfolio's voor lager niveau" is a
// different starting point than "materiaal voor dit portfolio" —
// collapsing them confused N4/N5 kandidaten with N3 portfolios in the
// drawer.
const LEERCOACH_STARTERS: AiChatStarter[] = [
  {
    label: "Leg me uit wat dit portfolio moet zijn",
    prompt:
      "Kun je me eerst uitleggen wat dit portfolio moet zijn? Hoe is het opgebouwd, wat zoekt een beoordelaar, en waar werk ik uiteindelijk naartoe? Ik wil overzicht voor we aan de slag gaan.",
  },
  {
    label: "Ik heb eerdere PvB-portfolio's geschreven",
    prompt:
      "Ik heb voor een lager niveau al een PvB-portfolio geschreven. Als ik die upload via de knop hierboven, hoe gaan we er dan mee werken?",
  },
  {
    label: "Ik heb aantekeningen voor dit portfolio",
    prompt:
      "Ik heb al aantekeningen of wat tekst voor dit specifieke portfolio liggen. Kun je me helpen om dat materiaal bij elkaar te brengen? Ik kan het zo delen zodra je klaar bent.",
  },
  {
    label: "Ik begin helemaal blanco",
    prompt:
      "Ik begin helemaal blanco. Geen eerdere portfolio's, geen aantekeningen, we starten vanaf nul. Waar zullen we starten? Stel gerust eerst een paar vragen om erachter te komen wat ik al heb meegemaakt in mijn praktijk.",
  },
];
