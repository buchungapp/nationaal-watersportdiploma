"use client";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "~/app/_actions/files";
import { PDFViewer } from "./pdf-viewer";

export function MediaDropzone({
  required,
  name,
  setValidMedia,
  small,
  invalid,
  setFilled,
  defaultPreview,
}: {
  required?: boolean;
  name: string;
  setValidMedia?: (valid: boolean) => void;
  setFilled?: (filled: boolean) => void;
  small?: boolean;
  invalid?: boolean;
  defaultPreview?: {
    preview: string;
    type: "image" | "pdf";
  };
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    defaultPreview?.preview ?? null,
  );
  const [type, setType] = useState<"image" | "pdf" | null>(
    defaultPreview?.type ?? null,
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles: 1,
      onDropRejected: ([reject]) => {
        setFilled?.(true);
        setValidMedia?.(false);
        setPreview(null);

        if (reject?.errors.find(({ code }) => code === "file-invalid-type")) {
          return toast.error("Bestand niet ondersteund", { duration: 2500 });
        }

        if (reject?.errors.find(({ code }) => code === "file-too-large")) {
          return toast.error("Bestand is te groot", { duration: 2500 });
        }
      },
      maxSize: MAX_FILE_SIZE, // 5MB
      accept: ACCEPTED_IMAGE_TYPES,

      onDropAccepted: (acceptedFiles) => {
        setFilled?.(true);
        setIsLoading(true);
        setValidMedia?.(true);

        if (hiddenInputRef.current) {
          // Note the specific way we need to munge the file into the hidden input
          // https://stackoverflow.com/a/68182158/1068446
          const dataTransfer = new DataTransfer();
          for (const file of acceptedFiles) {
            dataTransfer.items.add(file);

            if (file.type.includes("pdf")) {
              const reader = new FileReader();
              reader.onload = (e) => {
                setPreview(e.target?.result as string);
                setType("pdf");
                setIsLoading(false);
              };
              reader.readAsDataURL(file);
            } else {
              setPreview(URL.createObjectURL(file));
              setType("image");
              setIsLoading(false);
            }
          }
          hiddenInputRef.current.files = dataTransfer.files;
        }
      },
    });

  return (
    <div
      className={clsx(
        "flex flex-col justify-center items-center mt-3 border border-dashed rounded-md w-full cursor-pointer",
        !preview && small ? "h-15" : "h-50",
        isDragActive && "bg-slate-100",
        (isDragReject || invalid) && "border-destructive",
      )}
      {...getRootProps()}
    >
      <input
        type="file"
        name={name}
        required={required}
        className="opacity-0 w-[1px] h-[1px]"
        ref={hiddenInputRef}
      />
      {isLoading ? (
        <div className="flex items-center">
          <span className="text-[#606060] text-sm">Uploaden...</span>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center p-2 w-full text-[#878787] text-xs text-center">
          <input {...getInputProps()} />

          {preview ? (
            type === "image" ? (
              <img src={preview} alt="voorbeeld" className="rounded max-h-45" />
            ) : (
              <div className="w-full h-45">
                <PDFViewer file={preview} multiplePages={true} />
              </div>
            )
          ) : (
            <>
              Sleep hier je afbeelding heen, of klik om te uploaden.
              <span>Max {MAX_FILE_SIZE / 1000 / 1000}MB.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
