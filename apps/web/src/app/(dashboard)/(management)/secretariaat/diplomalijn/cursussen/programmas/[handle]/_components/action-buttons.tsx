"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import SmartDatetimePicker from "~/app/(dashboard)/_components/natural-language-input";
import Spinner from "~/app/_components/spinner";
import type { listGearTypes } from "~/lib/nwd";
import {
  copyCurriculumAction,
  linkGearTypeToCurriculumAction,
  removeCurriculumAction,
  startCurriculumAction,
  unlinkGearTypeFromCurriculumAction,
} from "../_actions/mutations";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : null}
      {children}
    </Button>
  );
}

export function CopyCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionWithId = copyCurriculumAction.bind(null, { curriculumId });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithId(prevState, formData);

    if (!!result.id) {
      setIsOpen(false);
      toast.success(`Curriculum ${result.id} aangemaakt`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Kopie maken
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={action}>
          <AlertTitle>Curriculum kopiëren</AlertTitle>
          <AlertDescription>
            Deze actie kopieert alle onderdelen van het geselecteerde curriculum
            naar een nieuwe revisie. De nieuwe revisie wordt toegevoegd aan het
            programma, maar staat dan nog in concept.
          </AlertDescription>
          <AlertBody>
            <Input
              name="revision"
              required
              invalid={!!state?.errors.revision}
            />
            {state?.errors.revision && (
              <ErrorMessage>{state.errors.revision}</ErrorMessage>
            )}
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <SubmitButton>Kopieren</SubmitButton>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

export function RemoveCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionWithId = removeCurriculumAction.bind(null, { curriculumId });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithId(prevState, formData);

    if (result.message === "Success") {
      setIsOpen(false);
      toast.success(`Curriculum verwijderd`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [_state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button type="button" color="red" onClick={() => setIsOpen(true)}>
        Verwijderen
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={action}>
          <AlertTitle>Curriculum verwijderen</AlertTitle>
          <AlertDescription>
            Weet je zeker dat je dit curriculum wilt verwijderen?
          </AlertDescription>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton>Verwijderen</SubmitButton>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

export function StartCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionWithId = startCurriculumAction.bind(null, { curriculumId });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithId(prevState, formData);

    if (result.message === "Success") {
      setIsOpen(false);
      toast.success(`Curriculum gestart`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [_state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button
        type="button"
        color="branding-dark"
        onClick={() => setIsOpen(true)}
      >
        Starten vanaf
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={action}>
          <AlertTitle>Curriculum starten</AlertTitle>
          <AlertDescription>
            Vanaf wanneer is dit curriculum actief?
          </AlertDescription>
          <AlertBody>
            <Fieldset>
              <Field className="relative">
                <Label>Startdatum</Label>
                <SmartDatetimePicker name="startAt" required />
              </Field>
            </Fieldset>
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton>Starten vanaf</SubmitButton>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

export function UnlinkGearTypeFromCurriculum({
  curriculumId,
  gearTypeId,
}: {
  curriculumId: string;
  gearTypeId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const actionWithIds = unlinkGearTypeFromCurriculumAction.bind(null, {
    curriculumId,
    gearTypeId,
  });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithIds(prevState, formData);

    if (result.message === "Success") {
      setIsOpen(false);
      toast.success(`Materiaal ontkoppeld`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [_state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button type="button" plain onClick={() => setIsOpen(true)}>
        <XMarkIcon className="w-4 h-4" />
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={action}>
          <AlertTitle>Materiaal ontkoppelen</AlertTitle>
          <AlertDescription>
            Weet je zeker dat je dit materiaal wilt ontkoppelen van dit
            curriculum?
          </AlertDescription>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton>Ontkoppelen</SubmitButton>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

export function LinkGearTypeToCurriculum({
  curriculumId,
  availableGearTypes,
}: {
  curriculumId: string;
  availableGearTypes: Awaited<ReturnType<typeof listGearTypes>>;
}) {
  const actionWithIds = linkGearTypeToCurriculumAction.bind(null, {
    curriculumId,
  });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithIds(prevState, formData);

    if (result.message === "Success") {
      toast.success(`Materiaal gekoppeld`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [_state, action] = useFormState(submit, undefined);

  return (
    <form ref={formRef} action={action}>
      <Field>
        <Listbox
          name="gearTypeId"
          placeholder={"Voeg een materiaal toe"}
          disabled={availableGearTypes.length < 1}
          onChange={() => {
            setTimeout(() => {
              // Attempt to use requestSubmit if available
              if (typeof formRef.current?.requestSubmit === "function") {
                formRef.current.requestSubmit();
              } else {
                // Fallback for older browsers
                submitButtonRef.current?.click();
              }
            }, 100);
          }}
        >
          {availableGearTypes.map((gearType) => (
            <ListboxOption key={gearType.id} value={gearType.id}>
              <ListboxLabel>{gearType.title ?? gearType.handle}</ListboxLabel>
            </ListboxOption>
          ))}
        </Listbox>
      </Field>
      <button type="submit" className="hidden" ref={submitButtonRef} />
    </form>
  );
}
