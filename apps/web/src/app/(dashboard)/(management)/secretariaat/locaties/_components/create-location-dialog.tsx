"use client";

import slugify from "@sindresorhus/slugify";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { createLocationAsSystemAdminAction } from "~/app/_actions/location/create-location-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Description,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";

export function CreateLocationDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  const { execute, reset, isExecuting } = useAction(
    createLocationAsSystemAdminAction,
    {
      onSuccess: ({ data }) => {
        toast.success("Vaarlocatie aangemaakt.");
        if (data?.id) {
          router.push(`/secretariaat/locaties/${data.id}`);
        }
        closeDialog();
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const closeDialog = () => {
    setName("");
    setHandle("");
    setHandleTouched(false);
    setWebsiteUrl("");
    reset();
    onClose();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!handleTouched) {
      setHandle(slugify(value, { lowercase: true }));
    }
  };

  return (
    <Alert open={isOpen} onClose={closeDialog} size="md">
      <AlertTitle>Nieuwe vaarlocatie</AlertTitle>
      <AlertDescription>
        Maak een nieuwe vaarlocatie aan. Je kunt daarna instructeurs en
        locatiebeheerders toevoegen.
      </AlertDescription>
      <AlertBody>
        <Fieldset>
          <Field>
            <Label>Naam</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Zeilschool de Optimist"
            />
          </Field>
          <Field>
            <Label>Handle</Label>
            <Description>
              Wordt gebruikt in URLs. Alleen kleine letters, cijfers en
              streepjes.
            </Description>
            <Input
              value={handle}
              onChange={(e) => {
                setHandleTouched(true);
                setHandle(e.target.value);
              }}
              placeholder="zeilschool-de-optimist"
            />
          </Field>
          <Field>
            <Label>Website (optioneel)</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.voorbeeld.nl"
              type="url"
            />
          </Field>
        </Fieldset>
      </AlertBody>
      <AlertActions>
        <Button plain onClick={closeDialog}>
          Annuleren
        </Button>
        <Button
          color="branding-dark"
          disabled={!name.trim() || !handle.trim() || isExecuting}
          onClick={() => {
            execute({
              name: name.trim(),
              handle: handle.trim(),
              websiteUrl: websiteUrl.trim() || undefined,
            });
          }}
        >
          {isExecuting ? "Aanmaken..." : "Aanmaken"}
        </Button>
      </AlertActions>
    </Alert>
  );
}
