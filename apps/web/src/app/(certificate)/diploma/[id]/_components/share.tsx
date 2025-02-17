"use client";
import {
  CheckIcon,
  ClipboardDocumentListIcon,
  ShareIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { BASE_URL } from "~/constants";

export function ShareCertificate({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${BASE_URL.toString()}diploma/${encodeURIComponent(id)}`;

  return (
    <>
      <Button type="button" color="blue" onClick={() => setIsOpen(true)}>
        <ShareIcon /> Deel je diploma!
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Deel je diploma</DialogTitle>
        <DialogDescription>
          Trots op je diploma? Deel hem met vrienden en familie! Kopieer de link
          hieronder en stuur het via WhatsApp, e-mail of social media.
        </DialogDescription>
        <DialogDescription>
          Jouw persoonsgegevens worden <strong>niet</strong> getoond via deze
          link! Wel zo veilig.
        </DialogDescription>
        <DialogBody>
          <div className="divide-x-200 mt-2 flex items-center justify-between divide-x overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <div className="scrollbar-none overflow-scroll pl-2">
              <p className="whitespace-nowrap text-slate-600">{shareUrl}</p>
            </div>
            <button
              type="button"
              className="h-8 flex-none border-l bg-white px-2 hover:bg-slate-50 active:bg-slate-100"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-slate-500" />
              ) : (
                <ClipboardDocumentListIcon className="h-4 w-4 text-slate-500" />
              )}
            </button>
          </div>
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Sluiten</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
