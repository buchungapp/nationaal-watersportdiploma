"use client";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateLocationSettingsAction } from "~/app/_actions/location/update-location-settings-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Input } from "~/app/(dashboard)/_components/input";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
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

export default function SettingsForm({
  className,
  locationId,
  name,
  shortDescription,
  email,
  websiteUrl,
}: {
  className?: string;
  locationId: string;
  name: Awaited<ReturnType<typeof retrieveLocationByHandle>>["name"];
  shortDescription: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["shortDescription"];
  email: Awaited<ReturnType<typeof retrieveLocationByHandle>>["email"];
  websiteUrl: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["websiteUrl"];
}) {
  const { execute, input } = useAction(
    updateLocationSettingsAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Instellingen zijn geüpdatet.");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    name,
    shortDescription,
    email,
    websiteUrl,
  });

  return (
    <form className={className} action={execute}>
      <FieldSection
        label="Naam"
        description="De naam zoals deze getoond wordt op de website."
      >
        <Input name="name" defaultValue={getInputValue("name")} required />
      </FieldSection>

      <Divider soft className="my-10" />

      <FieldSection
        label="Bio"
        description="Een korte omschrijving zoals deze getoond wordt op de website. Maximaal 260 karakters."
      >
        <Textarea
          name="shortDescription"
          defaultValue={getInputValue("shortDescription")}
          rows={3}
          maxLength={260}
        />
      </FieldSection>

      <Divider soft className="my-10" />

      <FieldSection
        label="E-mail"
        description="Hoe kunnen deelnemers contact met jullie opnemen?"
      >
        <Input
          name="email"
          defaultValue={getInputValue("email")}
          type="email"
          required
        />
      </FieldSection>

      <Divider soft className="my-10" />

      <FieldSection
        label="Website"
        description="Waar kunnen deelnemers meer informatie vinden?"
      >
        <Input
          name="websiteUrl"
          defaultValue={getInputValue("websiteUrl")}
          required
          type="url"
        />
      </FieldSection>

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
