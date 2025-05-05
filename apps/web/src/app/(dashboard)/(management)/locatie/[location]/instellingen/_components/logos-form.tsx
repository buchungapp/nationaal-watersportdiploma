"use client";
import { toast } from "sonner";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { useFormInput } from "~/actions/hooks/useFormInput";
import { updateLocationLogosAction } from "~/actions/location/update-location-logos-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  FieldGroup,
  Fieldset,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { MediaDropzone } from "~/app/(dashboard)/_components/media-dropzone";
import { Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import type { retrieveLocationByHandle } from "~/lib/nwd";
import { FieldSection } from "./field-selection";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}

export default function LogosForm({
  className,
  locationId,
  logo,
  logoSquare,
  logoCertificate,
}: {
  className?: string;
  locationId: string;
  logo: Awaited<ReturnType<typeof retrieveLocationByHandle>>["logo"];
  logoSquare: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["logoSquare"];
  logoCertificate: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["logoCertificate"];
}) {
  const { execute, input } = useAction(
    updateLocationLogosAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Logo's zijn geüpdatet.");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  return (
    <form className={className} action={execute}>
      <Fieldset>
        <Legend>
          <Subheading className="select-none">Logo's</Subheading>
        </Legend>
        <Text>
          We gebruiken verschillende variaties. Zorg dat ze allemaal up-to-date
          zijn.
        </Text>

        <FieldGroup>
          <Divider soft className="my-10" />

          <FieldSection
            label="Standaard"
            description="Het algemene logo van de vaarlocatie."
          >
            <MediaDropzone
              name="logo"
              defaultPreview={
                logo
                  ? {
                      preview: logo.url,
                      type: "image",
                    }
                  : undefined
              }
              key={getInputValue("logo")?.lastModified}
            />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Icoon"
            description="Een kleine vierkante versie van het logo, die wordt gebruik op plekken met minder ruimte. Kan zowel vierkant als rond weergegeven worden."
          >
            <MediaDropzone
              name="logoSquare"
              defaultPreview={
                logoSquare
                  ? {
                      preview: logoSquare.url,
                      type: "image",
                    }
                  : undefined
              }
              key={getInputValue("logoSquare")?.lastModified}
            />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Diploma"
            description="Het logo zoals hij geprint wordt op diploma's."
          >
            <MediaDropzone
              name="logoCertificate"
              defaultPreview={
                logoCertificate
                  ? {
                      preview: logoCertificate.url,
                      type: "image",
                    }
                  : undefined
              }
              key={getInputValue("logoCertificate")?.lastModified}
            />
          </FieldSection>
        </FieldGroup>
      </Fieldset>
      <Divider soft className="my-10" />

      <div className="flex justify-end gap-4">
        <Button plain type="reset">
          Reset
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
