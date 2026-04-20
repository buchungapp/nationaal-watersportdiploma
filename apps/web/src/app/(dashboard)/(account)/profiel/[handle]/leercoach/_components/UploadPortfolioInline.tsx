"use client";

import { useState } from "react";
import { useAiChatContext } from "~/app/_components/ai-chat";
import { PortfolioUploadDialog } from "../../portfolios/_components/PortfolioUploadDialog";
import type { ProfielOption } from "../../portfolios/_components/upload/useUploadPortfolioForm";

// Inline upload affordance rendered inside the chat. Lives as a child of
// <AiChat.Frame> (or AiChatWindow's children slot) and grabs
// sendMessage + isLoading from the shared AiChatContext via `use()` —
// per the patterns-children-over-render-props + state-context-interface
// rules, no render-prop callback needed.
//
// On successful upload: dialog closes, a confirmation message is
// auto-posted into the chat so the leercoach can immediately call
// searchPriorPortfolio and continue the conversation.

export function UploadPortfolioInline({
  handle,
  profielen,
  currentProfielId,
}: {
  handle: string;
  profielen: ProfielOption[];
  currentProfielId: string;
}) {
  const { actions, meta } = useAiChatContext();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-600">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={meta.isLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 shadow-sm transition-colors hover:border-branding-light/40 hover:bg-branding-light/5 hover:text-branding-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">📎</span>
          <span>Eerder portfolio uploaden</span>
        </button>
        {/*
          Privacy reassurance visible on desktop/tablet. Hidden on
          narrow viewports so it doesn't wrap awkwardly mid-sentence
          between the two upload buttons; the same claim is spelled
          out inside the upload dialog itself.
        */}
        <span className="hidden text-zinc-500 sm:inline">
          — geanonimiseerd opgeslagen, alleen jij + de digitale leercoach
          zien ’m.
        </span>
      </div>

      <PortfolioUploadDialog
        handle={handle}
        profielen={profielen}
        defaultProfielId={currentProfielId}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={({ result, niveauRang }) => {
          const niveauLabel = niveauRang ? `niveau-${niveauRang} ` : "";
          const message = result.alreadyIngested
            ? `Ik heb mijn ${niveauLabel}portfolio geüpload — maar ik zie dat dezelfde versie er al stond, dus niets nieuws toegevoegd.`
            : `Ik heb zojuist mijn ${niveauLabel}portfolio geüpload (${result.pageCount} pagina's, ${result.chunkCount} fragmenten). Neem even de tijd om erin te kijken, dan kunnen we daarna bespreken hoe we dit gebruiken.`;
          actions.sendMessage({ text: message });
        }}
      />
    </>
  );
}
