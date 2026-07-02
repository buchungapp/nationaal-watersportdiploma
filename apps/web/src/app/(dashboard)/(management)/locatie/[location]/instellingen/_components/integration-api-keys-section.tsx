"use client";

import {
  ClipboardDocumentIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  createIntegrationApiKeyAction,
  revokeIntegrationApiKeyAction,
} from "~/app/_actions/location/integration-api-key-actions";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Input } from "~/app/(dashboard)/_components/input";
import { Code, Text } from "~/app/(dashboard)/_components/text";
import { FieldSection } from "./field-selection";

type IntegrationApiKey = {
  id: string;
  name: string;
  partialKey: string;
  expires: string | null;
  createdAt: string;
};

type CreatedIntegrationApiKey = {
  id: string;
  token: string;
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function IntegrationApiKeysSection({
  apiKeys,
  locationHandle,
  locationId,
}: {
  apiKeys: IntegrationApiKey[];
  locationHandle: string;
  locationId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [createdKey, setCreatedKey] = useState<CreatedIntegrationApiKey | null>(
    null,
  );
  const createAction = useAction(
    createIntegrationApiKeyAction.bind(null, locationId, locationHandle),
    {
      onSuccess: ({ data }) => {
        if (!data) {
          toast.error("Integratiesleutel kon niet worden aangemaakt.");
          return;
        }

        setCreatedKey(data);
        formRef.current?.reset();
        toast.success("Integratiesleutel aangemaakt.");
      },
      onError: () => toast.error(DEFAULT_SERVER_ERROR_MESSAGE),
    },
  );

  const isCreating = createAction.status === "executing";

  return (
    <FieldSection
      label="API toegang"
      description="Persoonlijke sleutels voor externe systemen die import-sessies beheren. Sleutels werken voor locaties waar jouw account beheerder is."
      className="space-y-6"
    >
      <form ref={formRef} action={createAction.execute} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            placeholder="Naam van de integratie"
          />
          <Button
            color="branding-dark"
            type="submit"
            disabled={isCreating}
            className="shrink-0"
          >
            {isCreating ? (
              <Spinner className="text-white" />
            ) : (
              <PlusIcon data-slot="icon" />
            )}
            Sleutel maken
          </Button>
        </div>
      </form>

      {createdKey ? <CreatedKeyNotice apiKey={createdKey} /> : null}

      <div className="space-y-3">
        {apiKeys.length > 0 ? (
          apiKeys.map((apiKey) => (
            <IntegrationApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              locationHandle={locationHandle}
              locationId={locationId}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-950/15 p-4 dark:border-white/15">
            <Text>Nog geen persoonlijke integratiesleutels.</Text>
          </div>
        )}
      </div>
    </FieldSection>
  );
}

function CreatedKeyNotice({ apiKey }: { apiKey: CreatedIntegrationApiKey }) {
  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey.token);
    toast.success("Integratiesleutel gekopieerd.");
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <div className="flex items-start gap-3">
        <KeyIcon className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
              Nieuwe sleutel
            </p>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
              Deze volledige sleutel wordt hierna niet opnieuw getoond.
            </p>
          </div>
          <Code className="block break-all border-emerald-500/30 bg-white/80 p-2 text-emerald-950 dark:bg-white/10 dark:text-emerald-50">
            {apiKey.token}
          </Code>
          <Button outline type="button" onClick={copyKey}>
            <ClipboardDocumentIcon data-slot="icon" />
            Kopieer
          </Button>
        </div>
      </div>
    </div>
  );
}

function IntegrationApiKeyRow({
  apiKey,
  locationHandle,
  locationId,
}: {
  apiKey: IntegrationApiKey;
  locationHandle: string;
  locationId: string;
}) {
  const revokeAction = useAction(
    revokeIntegrationApiKeyAction.bind(null, locationId, locationHandle),
    {
      onSuccess: () => toast.success("Integratiesleutel ingetrokken."),
      onError: () => toast.error(DEFAULT_SERVER_ERROR_MESSAGE),
    },
  );
  const isRevoking = revokeAction.status === "executing";

  return (
    <div className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">
              {apiKey.name}
            </p>
            <Badge color="zinc">Import-sessies</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Code>{apiKey.partialKey}</Code>
            <span>
              Aangemaakt {dateFormatter.format(new Date(apiKey.createdAt))}
            </span>
            {apiKey.expires ? (
              <span>
                Verloopt {dateFormatter.format(new Date(apiKey.expires))}
              </span>
            ) : null}
          </div>
        </div>

        <Button
          color="red"
          type="button"
          disabled={isRevoking}
          onClick={() => revokeAction.execute({ apiKeyId: apiKey.id })}
          className="shrink-0"
        >
          {isRevoking ? (
            <Spinner className="text-white" />
          ) : (
            <TrashIcon data-slot="icon" />
          )}
          Intrekken
        </Button>
      </div>
    </div>
  );
}
