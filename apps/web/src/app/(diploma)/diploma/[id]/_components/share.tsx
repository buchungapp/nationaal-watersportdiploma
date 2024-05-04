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
          <div className="divide-x-200 mt-2 flex items-center justify-between divide-x overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            <div className="scrollbar-hide overflow-scroll pl-2">
              <p className="whitespace-nowrap text-gray-600">{shareUrl}</p>
            </div>
            <button
              className="h-8 flex-none border-l bg-white px-2 hover:bg-gray-50 active:bg-gray-100"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
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
