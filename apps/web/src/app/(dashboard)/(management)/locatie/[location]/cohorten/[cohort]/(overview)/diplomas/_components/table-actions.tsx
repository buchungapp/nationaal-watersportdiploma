import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { toast } from "sonner";
import { z } from "zod";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import {
  Description,
  ErrorMessage,
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import { SmartDatetimePicker } from "~/app/(dashboard)/_components/natural-language-input";
import {
  Radio,
  RadioField,
  RadioGroup,
} from "~/app/(dashboard)/_components/radio";
import { TableSelectionButton } from "~/app/(dashboard)/_components/table-action";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import { completeAllCoreCompetencies } from "../../_actions/nwd";
import { kickOffGeneratePDF } from "../_actions/download";
import {
  issueCertificates,
  withDrawCertificates,
} from "../_actions/quick-actions";
import type { Student } from "./students-table";

interface Props {
  rows: {
    id: string;
    certificate: Student["certificate"];
    studentCurriculum: Student["studentCurriculum"];
  }[];
  cohortId: string;
  defaultVisibleFrom?: string;
  resetSelection: () => void;
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  const allRowsHaveIssuedCertificates = props.rows.every(
    (row) => !!row.certificate?.issuedAt,
  );
  const noneRowsHaveIssuedCertificates = props.rows.every(
    (row) => !row.certificate,
  );

  const allRowsHaveACurriculum = props.rows.every((row) => {
    return !!row.studentCurriculum;
  });

  const allRowsHaveACurriculumWithAtLeastOneModule = props.rows.every((row) => {
    if (!row.studentCurriculum) return false;

    const completedModules = row.studentCurriculum.moduleStatus.filter(
      (status) => status.completedCompetencies === status.totalCompetencies,
    ).length;

    return completedModules > 0;
  });

  const params = new URLSearchParams();

  for (const row of props.rows) {
    if (!row.certificate) continue;
    params.append("certificate[]", row.certificate.handle);
  }

  return (
    <>
      <TableSelectionButton>
        <DropdownItem
          onClick={() => setIsDialogOpen("issue")}
          disabled={
            !(
              noneRowsHaveIssuedCertificates &&
              allRowsHaveACurriculumWithAtLeastOneModule
            )
          }
          title={
            !(
              noneRowsHaveIssuedCertificates &&
              allRowsHaveACurriculumWithAtLeastOneModule
            )
              ? "Niet alle cursisten hebben minimaal één module afgerond"
              : undefined
          }
        >
          <DropdownLabel>Diploma's uitgeven</DropdownLabel>
        </DropdownItem>
        <DropdownItem
          onClick={() => setIsDialogOpen("remove")}
          disabled={!allRowsHaveIssuedCertificates}
          title={
            !allRowsHaveIssuedCertificates
              ? "Niet alle cursisten hebben een uitgegeven diploma"
              : undefined
          }
        >
          <DropdownLabel>Diploma's verwijderen</DropdownLabel>
        </DropdownItem>
        <DropdownItem
          onClick={() => setIsDialogOpen("download")}
          disabled={!allRowsHaveIssuedCertificates}
          title={
            !allRowsHaveIssuedCertificates
              ? "Niet alle cursisten hebben een uitgegeven diploma"
              : undefined
          }
        >
          <DropdownLabel>Diploma's downloaden</DropdownLabel>
        </DropdownItem>
        <DropdownItem
          onClick={() => setIsDialogOpen("complete-core-modules")}
          disabled={!(allRowsHaveACurriculum && noneRowsHaveIssuedCertificates)}
          title={
            !(allRowsHaveACurriculum && noneRowsHaveIssuedCertificates)
              ? "Niet alle cursisten zijn gekoppeld aan een curriculum"
              : undefined
          }
        >
          <DropdownLabel>Kernmodules afronden</DropdownLabel>
        </DropdownItem>
      </TableSelectionButton>

      <IssueCertificateDialog
        {...props}
        isOpen={isDialogOpen === "issue"}
        setIsOpen={(value) => setIsDialogOpen(value ? "issue" : null)}
      />

      <RemoveCertificateDialog
        {...props}
        isOpen={isDialogOpen === "remove"}
        setIsOpen={(value) => setIsDialogOpen(value ? "remove" : null)}
      />

      <CompleteCoreModulesDialog
        {...props}
        isOpen={isDialogOpen === "complete-core-modules"}
        setIsOpen={(value) =>
          setIsDialogOpen(value ? "complete-core-modules" : null)
        }
      />

      <DownloadCertificatesDialog
        {...props}
        isOpen={isDialogOpen === "download"}
        setIsOpen={(value) => setIsDialogOpen(value ? "download" : null)}
      />
    </>
  );
}

export function IssueCertificateDialog({
  rows,
  cohortId,
  defaultVisibleFrom,
  isOpen,
  setIsOpen,
  resetSelection,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [delayVisibility, setDelayVisibility] = useState(!!defaultVisibleFrom);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          const formData = new FormData(e.target as HTMLFormElement);
          const visibleFrom = formData.get("visibleFrom") as string | null;

          startTransition(async () => {
            await issueCertificates({
              cohortAllocationIds: rows.map((row) => row.id),
              visibleFrom: delayVisibility
                ? dayjs(visibleFrom).toISOString()
                : null,
              cohortId,
            })
              .then(() => {
                setIsOpen(false);
                resetSelection();
              })
              .catch((error) => {
                if (error instanceof Error) {
                  return setError(error.message);
                }
                setError("Er is een fout opgetreden.");
              });
          });
        }}
      >
        <AlertTitle>Diploma's uitgeven</AlertTitle>

        <AlertBody>
          <CheckboxField>
            <Checkbox
              checked={delayVisibility}
              onChange={() => setDelayVisibility(!delayVisibility)}
            />
            <Label>Vertraagd zichtbaar maken</Label>
          </CheckboxField>

          {delayVisibility ? (
            <>
              <Text className="mt-2">
                Het diploma kan met een maximale vertraging van 72 uur worden
                uitgegeven voordat het zichtbaar wordt in de online omgeving van
                de cursist. <Strong>Let op:</Strong> De QR-code op het diploma
                werkt altijd.
              </Text>
              <div className="mt-4">
                <SmartDatetimePicker
                  name="visibleFrom"
                  required={true}
                  defaultValue={
                    defaultVisibleFrom
                      ? dayjs(defaultVisibleFrom).toDate()
                      : dayjs().toDate()
                  }
                />
              </div>
            </>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        </AlertBody>
        <AlertActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="text-white" /> : null}
            Uitgeven
          </Button>
        </AlertActions>
      </form>
    </Alert>
  );
}

export function RemoveCertificateDialog({
  rows,
  isOpen,
  cohortId,
  setIsOpen,
  resetSelection,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="md">
      <AlertTitle>Diploma's verwijderen</AlertTitle>
      <AlertDescription>
        Tot 24 uur na het uitgeven van een diploma kan deze nog verwijderd
        worden.{" "}
        <strong>
          Het verwijderen maakt het reeds uitgegeven diploma onbruikbaar!
        </strong>{" "}
        <br />
        Weet je zeker dat je de diploma's wilt verwijderen?
      </AlertDescription>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={() => setIsOpen(false)}>
          Annuleren
        </Button>
        <Button
          color="red"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await withDrawCertificates({
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                certificateIds: rows.map((row) => row.certificate!.id),
                cohortId,
              })
                .then(() => {
                  setIsOpen(false);
                  resetSelection();
                })
                .catch(() => {
                  setError(
                    "Er is een fout opgetreden, mogelijk is het diploma meer dan 72 uur geleden uitgegeven. Neem in dat geval contact op met het Secretariaat.",
                  );
                });
            });
          }}
        >
          {pending ? <Spinner className="text-white" /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}

const CONFIRMATION_WORD = "begrepen";

function CompleteCoreModulesDialog({
  rows,
  isOpen,
  setIsOpen,
  resetSelection,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (_prevState: unknown, formData: FormData) => {
    try {
      z.literal(CONFIRMATION_WORD).parse(formData.get("confirm"));

      await completeAllCoreCompetencies({
        cohortAllocationId: rows.map((row) => row.id),
      });

      toast.success("Kernmodules afgerond");
      setIsOpen(false);
      resetSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan");
    }
  };

  const [_state, formAction] = useActionState(submit, undefined);

  return (
    <>
      <Alert open={isOpen} onClose={setIsOpen} size="lg">
        <AlertTitle>Alle kernmodules afronden</AlertTitle>
        <AlertDescription>
          With great power comes great responsibility. Houd rekening met het
          volgende:
          <ul className="mt-2 mb-4 list-disc list-inside">
            <li>
              Niet alle kernmodules zijn vereist voor het behalen van een
              diploma.
            </li>
            <li>
              Het doel is een realistisch en herkenbaar diploma dat alleen de
              daadwerkelijk geoefende en beheerste modules weergeeft.
            </li>
            <li>
              Niet alle kernmodules kunnen in elk vaartuig worden afgerond.
            </li>
          </ul>
          Als je zeker bent van wat je doet en de gevolgen begrijpt, typ dan het
          woord <Strong>{CONFIRMATION_WORD}</Strong> om de kernmodules af te
          ronden.
        </AlertDescription>
        <form action={formAction}>
          <AlertBody>
            <Input
              name="confirm"
              type="text"
              required
              pattern={CONFIRMATION_WORD}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <CoreModulesSubmitButton />
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

function CoreModulesSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Afronden
    </Button>
  );
}

function DownloadCertificatesDialog({
  rows,
  isOpen,
  setIsOpen,
  resetSelection,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (_prevState: unknown, formData: FormData) => {
    const advancedOptionsSchema = z.object({
      filename: z.string().catch(`${dayjs().toISOString()}-export-diplomas`),
      sort: z.enum(["student", "instructor"]).catch("student"),
    });

    const advancedOptions = advancedOptionsSchema.parse({
      filename: formData.get("filename"),
      sort: formData.get("sort"),
    });

    try {
      await kickOffGeneratePDF({
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        handles: rows.map((row) => row.certificate!.handle),
        fileName: advancedOptions.filename,
        sort: advancedOptions.sort,
      });

      toast.success("Bestand gedownload");
      setIsOpen(false);
      resetSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan");
    }
  };

  const [_state, formAction] = useActionState(submit, undefined);

  return (
    <>
      <Alert open={isOpen} onClose={setIsOpen} size="lg">
        <AlertTitle>Diploma's downloaden</AlertTitle>
        <AlertDescription>
          Download een PDF-bestand met de diploma's van de geselecteerde
          cursisten.
        </AlertDescription>
        <form action={formAction}>
          <AlertBody>
            <HeadlessDisclosure>
              <HeadlessDisclosureButton className="flex">
                <div className="flex justify-center items-center mr-6 h-6">
                  <ChevronRightIcon className="w-3.5 h-3.5 ui-open:rotate-90 transition-transform shrink-0" />
                </div>
                <Subheading>Geavanceerde opties</Subheading>
              </HeadlessDisclosureButton>
              <HeadlessDisclosurePanel className="mt-2 pl-10">
                <Field>
                  <Label>Bestandsnaam</Label>
                  <Input
                    name="filename"
                    type="text"
                    required
                    defaultValue={`${dayjs().toISOString()}-export-diplomas`}
                  />
                </Field>

                <Fieldset className="mt-6">
                  <Legend>Sortering</Legend>
                  <Text>
                    Hoe moeten de diploma's in de PDF gesorteerd zijn?
                  </Text>
                  <RadioGroup name="sort" defaultValue="student">
                    <RadioField>
                      <Radio value="student" />
                      <Label>Naam cursist</Label>
                      <Description>Sortering op voornaam, A tot Z.</Description>
                    </RadioField>
                    <RadioField>
                      <Radio value="instructor" />
                      <Label>Naam instructeur</Label>
                      <Description>
                        Sortering op voornaam instructeur, A tot Z. Diploma's
                        zonder instructeur worden als laatste getoond.
                      </Description>
                    </RadioField>
                  </RadioGroup>
                </Fieldset>
              </HeadlessDisclosurePanel>
            </HeadlessDisclosure>
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <DownloadSubmitButton />
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

function DownloadSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Download
    </Button>
  );
}
