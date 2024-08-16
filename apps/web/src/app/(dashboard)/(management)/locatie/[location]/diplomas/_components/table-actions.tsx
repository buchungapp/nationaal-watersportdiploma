import { useState } from "react";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import { useFormState as useActionState, useFormStatus } from "react-dom";

import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { toast } from "sonner";
import { z } from "zod";
import { AlertActions } from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Description,
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
import { Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import { kickOffGeneratePDF } from "../_actions/download";

interface Props {
  rows: {
    handle: string;
  }[];
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <Dropdown>
        <DropdownButton aria-label="Bulk actie">Bulk actie</DropdownButton>
        <DropdownMenu anchor="top">
          <DropdownItem onClick={() => setIsDialogOpen("download")}>
            <DropdownLabel>Diploma's downloaden</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <DownloadCertificatesDialog
        {...props}
        isOpen={isDialogOpen === "download"}
        setIsOpen={(value) => setIsDialogOpen(value ? "download" : null)}
      />
    </>
  );
}

function DownloadCertificatesDialog({
  rows,
  isOpen,
  setIsOpen,
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
        handles: rows.map((row) => row.handle),
        fileName: advancedOptions.filename,
        sort: advancedOptions.sort,
      });

      toast.success("Bestand gedownload");
      setIsOpen(false);
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
                <div className="mr-6 flex h-6 items-center justify-center">
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform ui-open:rotate-90" />
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
