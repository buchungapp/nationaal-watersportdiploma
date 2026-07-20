"use client";
import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { downloadCertificatesAction } from "~/app/_actions/certificate/download-certificates-action";
import { withdrawCertificatesAtLocationAction } from "~/app/_actions/certificate/withdraw-certificates-at-location-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
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
import {
  Radio,
  RadioField,
  RadioGroup,
} from "~/app/(dashboard)/_components/radio";
import { TableSelectionButton } from "~/app/(dashboard)/_components/table-action";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import type { listCertificates } from "~/lib/nwd";

type Certificate = Awaited<ReturnType<typeof listCertificates>>[number];

interface Props {
  rows: Certificate[];
  locationId: string;
  resetSelection: () => void;
}

function DownloadCertificatesDialog({
  rows,
  isOpen,
  close,
  resetSelection,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, input, reset, result } = useAction(
    downloadCertificatesAction.bind(
      null,
      rows.map((row) => row.handle),
    ),
    {
      onSuccess: (result) => {
        resetSelection();
        if (result?.data?.redirectUrl) {
          // Automatically start download
          window.open(result.data.redirectUrl, "_blank");
        }
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const downloadUrl = result?.data?.redirectUrl;

  const { getInputValue } = useFormInput(input, {
    filename: `${dayjs().toISOString()}-export-diplomas`,
    sort: "student",
    previousModules: "off",
  });

  return (
    <Alert open={isOpen} onClose={closeDialog} size="lg">
      <AlertTitle>Diploma's downloaden</AlertTitle>
      {downloadUrl ? (
        <AlertDescription className="space-y-3">
          <p className="font-medium text-green-600">
            ✓ Download wordt automatisch gestart...
          </p>
          <p className="text-gray-600 text-sm">
            Werkt de download niet?
            <a
              href={downloadUrl}
              className="ml-1 text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Klik hier om handmatig te downloaden
            </a>
          </p>
        </AlertDescription>
      ) : (
        <AlertDescription>
          Download een PDF-bestand met de diploma's van de geselecteerde
          cursisten.
        </AlertDescription>
      )}
      {!downloadUrl && (
        <form action={execute}>
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
                    defaultValue={getInputValue("filename")}
                  />
                </Field>

                <Fieldset className="mt-6">
                  <Legend>Sortering</Legend>
                  <Text>
                    Hoe moeten de diploma's in de PDF gesorteerd zijn?
                  </Text>
                  <RadioGroup name="sort" defaultValue={getInputValue("sort")}>
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

                <Fieldset className="mt-6">
                  <Legend>Opleidingsvoortgang</Legend>
                  <CheckboxField>
                    <Checkbox
                      name="previousModules"
                      defaultChecked={getInputValue("previousModules") === "on"}
                      key={`previousModules-${getInputValue("previousModules")}`}
                    />
                    <Label>
                      Print ook de modules op het diploma die al via eerdere
                      diploma's voor deze opleiding zijn behaald.
                    </Label>
                  </CheckboxField>
                </Fieldset>
              </HeadlessDisclosurePanel>
            </HeadlessDisclosure>
          </AlertBody>
          <AlertActions>
            <Button plain onClick={closeDialog}>
              Annuleren
            </Button>
            <DownloadSubmitButton />
          </AlertActions>
        </form>
      )}
      {downloadUrl && (
        <AlertActions>
          <Button plain onClick={closeDialog}>
            Sluiten
          </Button>
        </AlertActions>
      )}
    </Alert>
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

function withdrawCertificatesAtLocationErrorMessage(
  error: InferUseActionHookReturn<
    typeof withdrawCertificatesAtLocationAction
  >["result"],
) {
  if (error.serverError) {
    return "Er is een fout opgetreden, mogelijk is het diploma meer dan 72 uur geleden uitgegeven. Neem in dat geval contact op met het Secretariaat.";
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  return null;
}

function RemoveCertificatesDialog({
  rows,
  isOpen,
  locationId,
  close,
  resetSelection,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const { execute, isPending, result, reset } = useAction(
    withdrawCertificatesAtLocationAction.bind(
      null,
      locationId,
      rows.map((row) => row.id),
    ),
    {
      onSuccess: () => {
        close();
        resetSelection();
        toast.success("Diploma's verwijderd");
      },
    },
  );

  const closeDialog = () => {
    close();
    reset();
  };

  const errorMessage = withdrawCertificatesAtLocationErrorMessage(result);

  return (
    <Alert open={isOpen} onClose={closeDialog} size="md">
      <AlertTitle>Diploma's verwijderen</AlertTitle>
      <AlertDescription>
        Tot 72 uur na het uitgeven van een diploma kan deze nog verwijderd
        worden.{" "}
        <strong>
          Het verwijderen maakt het reeds uitgegeven diploma onbruikbaar!
        </strong>{" "}
        <br />
        Weet je zeker dat je de diploma's wilt verwijderen?
      </AlertDescription>
      {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={closeDialog}>
          Annuleren
        </Button>
        <Button color="red" disabled={isPending} onClick={() => execute()}>
          {isPending ? <Spinner className="text-white" /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <TableSelectionButton>
        <DropdownItem onClick={() => setIsDialogOpen("download")}>
          <DropdownLabel>Diploma's downloaden</DropdownLabel>
        </DropdownItem>
        <DropdownItem onClick={() => setIsDialogOpen("remove")}>
          <DropdownLabel>Diploma's verwijderen</DropdownLabel>
        </DropdownItem>
      </TableSelectionButton>

      <DownloadCertificatesDialog
        {...props}
        isOpen={isDialogOpen === "download"}
        close={() => setIsDialogOpen(null)}
      />

      <RemoveCertificatesDialog
        {...props}
        isOpen={isDialogOpen === "remove"}
        close={() => setIsDialogOpen(null)}
      />
    </>
  );
}
