"use client";
import {
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
  CheckIcon,
} from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useQueryState, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { mergePersonsAction } from "~/app/_actions/person/merge-persons-action";
import Spinner from "~/app/_components/spinner";
import { searchParams } from "../_search-params";

export function SwapButton() {
  const [swapping, startTransition] = useTransition();
  const [query, setQuery] = useQueryStates(
    {
      primaryPerson: searchParams.primaryPerson,
      secondaryPerson: searchParams.secondaryPerson,
    },
    {
      shallow: false,
      startTransition,
    },
  );

  return (
    <Button
      onClick={() => {
        console.log("swap", query);
        setQuery((prev) => ({
          ...prev,
          primaryPerson: prev.secondaryPerson,
          secondaryPerson: prev.primaryPerson,
        }));
      }}
      disabled={swapping}
    >
      {swapping ? <Spinner className="text-white" /> : <ArrowsRightLeftIcon />}
      Wisselen
    </Button>
  );
}

export function ContinueButton() {
  const [confirming, startTransition] = useTransition();
  const [_, setConfirm] = useQueryState(
    "confirm",
    searchParams.confirm.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  return (
    <Button
      color="branding-dark"
      onClick={() => setConfirm(true)}
      disabled={confirming}
    >
      {confirming ? <Spinner className="text-white" /> : <CheckIcon />}
      Doorgaan
    </Button>
  );
}

export function BackButton() {
  const [confirming, startTransition] = useTransition();
  const [_, setConfirm] = useQueryState(
    "confirm",
    searchParams.confirm.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  return (
    <Button
      color="branding-dark"
      onClick={() => setConfirm(false)}
      disabled={confirming}
    >
      {confirming ? <Spinner className="text-white" /> : <ArrowLeftIcon />}
      Terug
    </Button>
  );
}

export function MergeButton({
  primaryPersonId,
  secondaryPersonId,
}: {
  primaryPersonId: string;
  secondaryPersonId: string;
}) {
  const router = useRouter();

  const { execute, result } = useAction(
    mergePersonsAction.bind(null, primaryPersonId, secondaryPersonId),
    {
      onSuccess: () => {
        router.push(`/secretariaat/gebruikers/${primaryPersonId}`);
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );
  console.log(result);

  return (
    <form action={execute}>
      <Fieldset>
        <Field className="mb-2">
          <CheckboxField>
            <Checkbox
              name="confirm"
              invalid={!!result?.validationErrors?.confirm}
            />
            <Label>
              Ik begrijp dat de secundaire gebruiker permanent verwijderd wordt
              na de samenvoeging. Deze actie kan niet ongedaan worden gemaakt.
            </Label>
          </CheckboxField>

          {result?.validationErrors?.confirm ? (
            <ErrorMessage>
              Je moet deze checkbox aanvinken om de samenvoeging te bevestigen.
            </ErrorMessage>
          ) : null}
        </Field>
      </Fieldset>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button color="branding-orange" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Samenvoegen
    </Button>
  );
}
