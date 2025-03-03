"use client";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import { parseAsString } from "nuqs";
import { useQueryState } from "nuqs";
import type { PropsWithChildren } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import type { ExternalCertificate } from "./certificates";
import { PDFViewer } from "./pdf-viewer";

type Media = NonNullable<ExternalCertificate["media"]>;

export function MediaViewerButton({
  media,
  children,
  className,
}: PropsWithChildren<{
  media: Media;
  className?: string;
}>) {
  const [_, setIsOpen] = useQueryState(
    "media-viewer",
    parseAsString.withOptions({
      shallow: false,
    }),
  );

  return (
    <button
      type="button"
      onClick={() => setIsOpen(media.id)}
      className={className}
    >
      {children}
    </button>
  );
}

export default function MediaViewer({
  medias,
}: {
  medias: (Media | null)[];
}) {
  const [isOpen, setIsOpen] = useQueryState("media-viewer", parseAsString);

  const close = () => {
    setIsOpen(null);
  };

  const media = medias.find((media) => media?.id === isOpen);
  if (!media) {
    return null;
  }

  return (
    <Dialog size="4xl" onClose={close} open={!!media}>
      <div className="flex justify-between items-center gap-1">
        <DialogTitle>Media bekijken</DialogTitle>
        <div className="flex gap-1 -my-1.5">
          <Button
            outline
            onClick={() => {
              const ext = media.type === "image" ? "jpg" : "pdf";
              window.open(`${media.url}&download=media.${ext}`, "_blank");
            }}
          >
            Download
          </Button>
          <Button outline onClick={close}>
            <XMarkIcon />
          </Button>
        </div>
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
  );
}
