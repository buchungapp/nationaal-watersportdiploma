"use client";

import {
  AiChatWindow,
  type AiChatInitialMessage,
  type AiChatStarter,
} from "~/app/_components/ai-chat";

type Props = {
  chatId: string;
  initialMessages: AiChatInitialMessage[];
};

// Thin leercoach-specific wrapper around the reusable AiChatWindow. Only
// responsibility: pass the leercoach API endpoint and the starter chips
// matching the four user archetypes from the opening message. Everything
// else — scroll behaviour, markdown rendering, message ordering, input
// handling — lives in the shared component.
//
// Future surfaces (portfolio-checker, portfolio-review) will instantiate
// AiChatWindow directly with their own endpoint + starters.
export function ChatShell({ chatId, initialMessages }: Props) {
  return (
    <AiChatWindow
      chatId={chatId}
      initialMessages={initialMessages}
      apiEndpoint="/api/leercoach/chat"
      starters={LEERCOACH_STARTERS}
    />
  );
}

// Four starter chips matching the archetypes in the opening message.
// Each chip sends a full first-person prompt straight into the chat so
// the leercoach knows exactly where the kandidaat is and can respond
// appropriately without another round of "waar begin je?".
//
// Key distinction: "eerdere portfolio's voor lager niveau" is a different
// starting point than "materiaal voor dit portfolio" — collapsing them
// confused N4/N5 kandidaten with N3 portfolios in the drawer.
const LEERCOACH_STARTERS: AiChatStarter[] = [
  {
    label: "Leg me uit wat dit portfolio moet zijn",
    prompt:
      "Kun je me eerst uitleggen wat dit portfolio moet zijn? Hoe is het opgebouwd, wat zoekt een beoordelaar, en waar werk ik uiteindelijk naartoe? Ik wil overzicht voor we aan de slag gaan.",
  },
  {
    label: "Ik heb eerdere PvB-portfolio's geschreven",
    prompt:
      "Ik heb voor een lager niveau al een PvB-portfolio geschreven. Voor dit portfolio heb ik nog niks nieuws op papier, maar ik wil niet alles opnieuw doen. Hoe kunnen we daarop voortbouwen?",
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
