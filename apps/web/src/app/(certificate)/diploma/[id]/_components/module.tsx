"use client";

import { Button as HeadlessButton } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import type { PropsWithChildren } from "react";
import type React from "react";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Dialog, DialogActions } from "~/app/(dashboard)/_components/dialog";

export default function Module({
  button,
  children,
}: PropsWithChildren<{ button: React.ReactNode }>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <HeadlessButton type="button" onClick={() => setIsOpen(true)}>
        <div className="w-full flex items-center justify-between text-left leading-tight font-medium">
          {button}
          <span className="ml-6 flex h-7 items-center">
            <PlusIcon className="size-5" aria-hidden="true" />
          </span>
        </div>

        <div className="flex mt-1 flex-col gap-y-[4px]">
          <hr className="w-full h-0.5 bg-branding-dark" />
          <hr className="w-full h-0.5 bg-branding-dark" />
        </div>
      </HeadlessButton>
      <Dialog open={isOpen} onClose={setIsOpen} size="xl">
        {children}
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Sluiten</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
