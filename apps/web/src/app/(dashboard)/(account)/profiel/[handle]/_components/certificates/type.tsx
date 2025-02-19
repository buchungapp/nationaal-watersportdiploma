import {
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";

export type CertificateTypes =
  | "cwo"
  | "vaarbewijs"
  | "marifoon"
  | "tkn"
  | "other";

export const certificateTypeLabels: Record<CertificateTypes, string> = {
  cwo: "CWO",
  vaarbewijs: "Vaarbewijs",
  marifoon: "Marifoon",
  tkn: "TKN",
  other: "Overig",
};

export function Type({
  type,
  setType,
}: {
  type: CertificateTypes | null;
  setType: (type: CertificateTypes) => void;
}) {
  return (
    <Fieldset>
      <Legend className="mb-3">2. Wat voor soort diploma is dit?</Legend>

      <div className={"grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4"}>
        <Field className="sm:col-span-3">
          <Listbox name="type" value={type} onChange={setType}>
            {Object.keys(certificateTypeLabels).map((type: string) => (
              <ListboxOption key={type} value={type}>
                <ListboxLabel>
                  {certificateTypeLabels[type as CertificateTypes]}
                </ListboxLabel>
              </ListboxOption>
            ))}
          </Listbox>
        </Field>
        {type === "other" ? (
          <Field className="sm:col-span-3">
            <Label>Soort diploma</Label>
            <Input name="otherType" />
          </Field>
        ) : null}
      </div>
    </Fieldset>
  );
}
