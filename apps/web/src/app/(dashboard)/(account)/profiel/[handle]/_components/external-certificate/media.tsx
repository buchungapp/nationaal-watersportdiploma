import { useState } from "react";
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
import { MediaDropzone } from "~/app/(dashboard)/_components/media-dropzone";

export default function Media({
  setValidMedia,
  small,
  invalid,
  stepIndex,
  allowRemove,
}: {
  setValidMedia?: (valid: boolean) => void;
  small?: boolean;
  invalid?: boolean;
  allowRemove?: boolean;
  stepIndex: number;
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
            invalid={invalid}
            small={small}
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
