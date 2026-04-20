"use client";

import {
  AiChatWindow,
  type AiChatInitialMessage,
  type AiChatStarter,
} from "~/app/_components/ai-chat";
import type { ProfielOption } from "../../portfolios/_components/upload/useUploadPortfolioForm";
import { Artefact } from "./Artefact";
import {
  type ArtefactRow,
  useArtefactDropHandler,
  useArtefactPasteHandler,
  useArtefactSubmitBlock,
} from "./artefact-context";
import { UploadPortfolioInline } from "./UploadPortfolioInline";

type Props = {
  handle: string;
  chatId: string;
  initialMessages: AiChatInitialMessage[];
  /** Full profiel list for the portfolio upload dialog's picker. */
  profielen: ProfielOption[];
  /** Current chat's profielId — pre-selected in the portfolio upload picker. */
  currentProfielId: string;
  /**
   * How many prior portfolios the kandidaat has already uploaded.
   * Drives the "I've already written one" starter chip: when > 0 we
   * prompt the leercoach to open the uploads directly (imperative); when
   * 0 we keep the hypothetical "what happens if I upload?" wording.
   */
  priorPortfolioCount: number;
  /** Existing artefacten for this chat (server-rendered). */
  initialArtefacten: ArtefactRow[];
};

// Thin leercoach-specific wrapper around AiChatWindow. Responsibilities:
//   - leercoach API endpoint + starter chips
//   - per-chat artefact surface (via the Artefact compound)
//   - in-chat portfolio upload (via UploadPortfolioInline)
//
// The Artefact compound owns all artefact state; the AiChatWindow
// owns all chat state. `ChatInner` sits inside both so it can read
// the paste handler from ArtefactContext and pass it to AiChatWindow.
export function ChatShell({
  handle,
  chatId,
  initialMessages,
  profielen,
  currentProfielId,
  priorPortfolioCount,
  initialArtefacten,
}: Props) {
  return (
    <Artefact.Provider
      handle={handle}
      chatId={chatId}
      initialArtefacten={initialArtefacten}
    >
      <ChatInner
        handle={handle}
        chatId={chatId}
        initialMessages={initialMessages}
        profielen={profielen}
        currentProfielId={currentProfielId}
        priorPortfolioCount={priorPortfolioCount}
      />
      <Artefact.UploadDialog />
    </Artefact.Provider>
  );
}

function ChatInner({
  handle,
  chatId,
  initialMessages,
  profielen,
  currentProfielId,
  priorPortfolioCount,
}: Omit<Props, "initialArtefacten">) {
  const handlePaste = useArtefactPasteHandler();
  const handleDrop = useArtefactDropHandler();
  const submitBlock = useArtefactSubmitBlock();
  const starters = buildStarters({ priorPortfolioCount });
  return (
    <AiChatWindow
      chatId={chatId}
      initialMessages={initialMessages}
      apiEndpoint="/api/leercoach/chat"
      starters={starters}
      handlePaste={handlePaste}
      handleDrop={handleDrop}
      submitBlock={submitBlock}
    >
      {/* Renderless bridge: sits inside both the AiChat and Artefact
          contexts so it can clear staged chips when a new user
          message lands. Must be a child of AiChatWindow so
          useAiChatContext resolves. */}
      <Artefact.CommitOnSend />
      <div className="flex flex-col gap-2">
        <Artefact.ErrorBanner />
        <div className="flex flex-wrap items-center gap-2">
          <UploadPortfolioInline
            handle={handle}
            profielen={profielen}
            currentProfielId={currentProfielId}
          />
          <Artefact.UploadButton />
        </div>
        <Artefact.ChipStrip />
      </div>
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
function buildStarters({
  priorPortfolioCount,
}: {
  priorPortfolioCount: number;
}): AiChatStarter[] {
  const hasPriorPortfolios = priorPortfolioCount > 0;
  return [
    {
      label: "Leg me uit wat dit portfolio moet zijn",
      prompt:
        "Kun je me eerst uitleggen wat dit portfolio moet zijn? Hoe is het opgebouwd, wat zoekt een beoordelaar, en waar werk ik uiteindelijk naartoe? Ik wil overzicht voor we aan de slag gaan.",
    },
    hasPriorPortfolios
      ? {
          // Imperative: the kandidaat has uploaded — ask the leercoach
          // to pick it up directly. Phrasing is deliberately
          // unambiguous ("mijn eerder werk staat al geüpload") so the
          // model calls searchPriorPortfolio on the first turn instead
          // of explaining a hypothetical workflow.
          label: "Pak mijn geüploade portfolio erbij",
          prompt:
            "Mijn eerdere PvB-portfolio staat al geüpload. Kijk er eens naar, vat in je eigen woorden samen wat je ziet, en stel me een paar vragen zodat we kunnen zien waar ik nu sta en waar de groei naartoe moet voor dit niveau.",
        }
      : {
          // No uploads yet: keep the hypothetical wording so the
          // leercoach can explain the workflow + point at the 📎.
          label: "Ik heb eerdere PvB-portfolio's geschreven",
          prompt:
            "Ik heb voor een lager niveau al een PvB-portfolio geschreven, maar nog niet geüpload. Hoe gaat dat in z'n werk, en hoe gaan we er daarna mee werken?",
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
}
