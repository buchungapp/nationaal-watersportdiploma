import clsx from "clsx";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { PDFViewer } from "../pdf-viewer";

export default function Media({
  setValidMedia,
  small,
  errors,
  stepIndex,
  allowRemove,
  defaultValue,
}: {
  setValidMedia?: (valid: boolean) => void;
  small?: boolean;
  errors?: Record<string, string>;
  allowRemove?: boolean;
  stepIndex: number;
  defaultValue?: string;
}) {
  const [removeMedia, setRemoveMedia] = useState(false);
  const [filled, setFilled] = useState(false);

  return (
    <Fieldset>
      <Legend className="mb-3">
        {stepIndex}. Upload een kopie van je certificaat (jpg, png of pdf)
      </Legend>
      {!removeMedia ? (
        <Field>
          <MediaDropzone
            name="media"
            setValidMedia={setValidMedia}
            setFilled={setFilled}
            invalid={!!errors?.media}
            small={small}
            defaultValue={defaultValue}
          />
        </Field>
      ) : (
        <div className="flex flex-col justify-center items-center mt-3 border border-dashed rounded-md w-full h-50 cursor-pointer">
          <div className="flex flex-col justify-center items-center p-2 text-[#878787] text-xs text-center">
            Sleep hier je afbeelding heen, of klik om te uploaden.
            <span>Max 5MB.</span>
          </div>
        </div>
      )}
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-1 mt-3">
        {allowRemove ? (
          <CheckboxField>
            <Checkbox
              name="removeMedia"
              onChange={setRemoveMedia}
              checked={removeMedia}
            />
            <Label>Verwijder geüploade foto</Label>
          </CheckboxField>
        ) : null}
        {filled ? (
          <Button
            className="ml-auto"
            outline
            onClick={() => {
              setRemoveMedia(true);
              setFilled(false);
              setValidMedia?.(false);
              setTimeout(() => {
                setRemoveMedia(false);
              }, 1000);
            }}
          >
            <XMarkIcon />
            Verwijder upload
          </Button>
        ) : null}
      </div>
    </Fieldset>
  );
}

function MediaDropzone({
  required,
  name,
  setValidMedia,
  small,
  invalid,
  setFilled,
  defaultValue,
}: {
  required?: boolean;
  name: string;
  setValidMedia?: (valid: boolean) => void;
  setFilled?: (filled: boolean) => void;
  small?: boolean;
  invalid?: boolean;
  defaultValue?: string;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [type, setType] = useState<"image" | "pdf" | null>(null);

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
      maxSize: 5_000_000, // 5MB
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "application/pdf": [".pdf"],
      },

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
            setPreview(URL.createObjectURL(file));
            setType(file.type.includes("pdf") ? "pdf" : "image");
          }
          hiddenInputRef.current.files = dataTransfer.files;
        }

        setIsLoading(false);
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
        className="hidden w-0 h-0"
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
              <img
                src={preview}
                alt="certificaat voorbeeld"
                className="rounded max-h-45"
              />
            ) : (
              <div className="w-full h-45">
                <PDFViewer file={preview} multiplePages={true} />
              </div>
            )
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
