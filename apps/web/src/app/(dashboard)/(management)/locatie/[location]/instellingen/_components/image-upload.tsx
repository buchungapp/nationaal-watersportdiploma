"use client";
import { clsx } from "clsx";
import { useId, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export function ImageUpload() {
  const id = useId();
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = async ([file]: File[]) => {
    if (!file) {
      return;
    }

    setIsLoading(true);

    console.log("file", file);
    // TODO: Do something with the file
    await Promise.resolve();

    setIsLoading(false);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles: 1,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onDrop,
      onDropRejected: ([reject]) => {
        if (reject?.errors.find(({ code }) => code === "file-invalid-type")) {
          return toast.error("Bestand niet ondersteund", { duration: 2500 });
        }

        if (reject?.errors.find(({ code }) => code === "file-too-large")) {
          return toast.error("Bestand is te groot", { duration: 2500 });
        }
      },
      maxSize: 5_000_000, // 5MB
      accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    });

  return (
    <div
      className={clsx(
        "w-full border border-dashed h-[160px] rounded-md flex items-center justify-center",
        isDragActive && "bg-gray-100",
        isDragReject && "border-destructive",
      )}
      {...getRootProps()}
    >
      {isLoading ? (
        <div className="flex items-center">
          <span className="text-sm text-[#606060]">Uploaden...</span>
        </div>
      ) : (
        <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787]">
          <input {...getInputProps()} id={`upload-files-${id}`} />
          Sleep hier je afbeelding heen, of klik om te uploaden.
          <span>Max 5MB.</span>
        </div>
      )}
    </div>
  );
}
