import clsx from "clsx";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Field,
  Fieldset,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";

export default function Media({
  setValidMedia,
  small,
  errors,
}: {
  setValidMedia: (valid: boolean) => void;
  small?: boolean;
  errors?: Record<string, string>;
}) {
  return (
    <Fieldset>
      <Legend className="mb-3">1. Upload een foto of scan</Legend>
      <Field>
        <Dropzone
          name="media"
          setValidMedia={setValidMedia}
          invalid={!!errors?.media}
          small={small}
        />
      </Field>
    </Fieldset>
  );
}

function Dropzone({
  required,
  name,
  setValidMedia,
  small,
  invalid,
}: {
  required?: boolean;
  name: string;
  setValidMedia?: (valid: boolean) => void;
  small?: boolean;
  invalid?: boolean;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles: 1,
      onDropRejected: ([reject]) => {
        setValidMedia?.(false);
        setPreview(null);

        if (reject?.errors.find(({ code }) => code === "file-invalid-type")) {
          return toast.error("Bestand niet ondersteund", { duration: 2500 });
        }

        if (reject?.errors.find(({ code }) => code === "file-too-large")) {
          return toast.error("Bestand is te groot", { duration: 2500 });
        }
      },
      maxSize: 5_000_000, // 5MB
      accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },

      onDropAccepted: (acceptedFiles) => {
        setIsLoading(true);
        setValidMedia?.(true);

        if (hiddenInputRef.current) {
          // Note the specific way we need to munge the file into the hidden input
          // https://stackoverflow.com/a/68182158/1068446
          const dataTransfer = new DataTransfer();
          for (const file of acceptedFiles) {
            dataTransfer.items.add(file);
            setPreview(URL.createObjectURL(file));
          }
          hiddenInputRef.current.files = dataTransfer.files;
        }

        setIsLoading(false);
      },
    });

  return (
    <div
      className={clsx(
        "w-full mt-3 border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer",
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
        className="opacity-0 h-0 w-0"
        ref={hiddenInputRef}
      />
      {isLoading ? (
        <div className="flex items-center">
          <span className="text-sm text-[#606060]">Uploaden...</span>
        </div>
      ) : (
        <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787] p-2">
          <input {...getInputProps()} />
          {preview ? (
            <img
              src={preview}
              alt="certificaat voorbeeld"
              className="rounded max-h-45"
            />
          ) : (
            <>
              Sleep hier je afbeelding heen, of klik om te uploaden.
              <span>Max 5MB.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
