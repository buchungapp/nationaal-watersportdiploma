"use client";

import { useState } from "react";
import { PriorPortfolioUploadDialog } from "./PriorPortfolioUploadDialog";

// Inline upload affordance rendered inside the chat (via AiChatWindow's
// slotAboveInput prop). Opens the shared PriorPortfolioUploadDialog and
// on success auto-sends a confirmation message into the chat so the
// leercoach knows the portfolio is now available.

type Props = {
  disabled?: boolean;
  onAfterUpload: (confirmationMessage: string) => void;
};

export function UploadPriorPortfolioInline({
  disabled,
  onAfterUpload,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">📎</span>
          <span>Eerder portfolio uploaden</span>
        </button>
        <span className="text-slate-500">
          — geanonimiseerd opgeslagen, alleen jouw leercoach ziet het.
        </span>
      </div>

      <PriorPortfolioUploadDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={({ result, niveauRang }) => {
          const niveauLabel = niveauRang ? `niveau-${niveauRang} ` : "";
          const message = result.alreadyIngested
            ? `Ik heb mijn ${niveauLabel}portfolio geüpload — maar ik zie dat dezelfde versie er al stond, dus niets nieuws toegevoegd.`
            : `Ik heb zojuist mijn ${niveauLabel}portfolio geüpload (${result.pageCount} pagina's, ${result.chunkCount} fragmenten). Neem even de tijd om erin te kijken, dan kunnen we daarna bespreken hoe we dit gebruiken.`;
          onAfterUpload(message);
        }}
      />
    </>
  );
}
