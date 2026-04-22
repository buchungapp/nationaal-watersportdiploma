"use client";

// "+" attach menu that lives in the composer's bottom-left slot.
// Opens a popover with the two upload entry points:
//   - Materiaal toevoegen → artefact dialog (screenshot, note, …)
//   - Eerder portfolio uploaden → structured portfolio dialog
//
// Mirrors the send button's size (size-8) + position (bottom-1
// left-1.5) so the composer is visually balanced left-to-right.

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  DocumentIcon,
  PaperClipIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { useArtefactContext } from "./artefact-context";
import { usePortfolioUploadLauncher } from "./portfolio-upload-context";

export function AttachmentMenu() {
  const {
    actions: { openDialog: openArtefactDialog },
  } = useArtefactContext();
  const openPortfolioDialog = usePortfolioUploadLauncher();

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label="Bijlage toevoegen"
        className="flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
      </MenuButton>
      <MenuItems
        transition
        // Positioned above the composer, left-anchored to the +
        // button. `bottom-full` floats the menu upward, `mb-2`
        // gives a small gap.
        className="absolute bottom-full left-0 mb-2 w-64 origin-bottom-left rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={openArtefactDialog}
              className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 ${
                focus ? "bg-slate-100" : ""
              }`}
            >
              <PaperClipIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-slate-400"
              />
              <span className="flex flex-col">
                <span className="font-medium text-slate-900">
                  Materiaal toevoegen
                </span>
                <span className="text-xs text-slate-500">
                  Screenshot, notitie, e-mail — blijft in deze chat.
                </span>
              </span>
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={openPortfolioDialog}
              className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-slate-700 ${
                focus ? "bg-slate-100" : ""
              }`}
            >
              <DocumentIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-slate-400"
              />
              <span className="flex flex-col">
                <span className="font-medium text-slate-900">
                  Eerder portfolio uploaden
                </span>
                <span className="text-xs text-slate-500">
                  PvB-portfolio van een lager niveau, voor stijl-matching +
                  inhoud.
                </span>
              </span>
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
