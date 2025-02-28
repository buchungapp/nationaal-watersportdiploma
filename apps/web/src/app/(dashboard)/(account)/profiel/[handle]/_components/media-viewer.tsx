"use client";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import { type PropsWithChildren, useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import type { ExternalCertificate } from "./certificates";
import { PDFViewer } from "./pdf-viewer";

type Media = NonNullable<ExternalCertificate["media"]>;

export default function MediaViewer({
  media,
  children,
  className,
}: PropsWithChildren<{
  media: Media;
  className?: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>
      <Dialog size="4xl" onClose={() => setIsOpen(false)} open={isOpen}>
        <div className="flex justify-between items-center gap-1">
          <DialogTitle>Media bekijken</DialogTitle>
          <Button outline onClick={() => setIsOpen(false)} className="-my-1.5">
            <XMarkIcon />
          </Button>
        </div>
        <DialogBody className="flex justify-center">
          {media.type === "image" ? (
            <Image
              src={media.url}
              alt={media.alt || "Media"}
              width={media.width || 100}
              height={media.height || 100}
              className="rounded-xs w-auto h-auto object-contain"
            />
          ) : (
            <PDFViewer file={media.url} multiplePages={true} />
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}
