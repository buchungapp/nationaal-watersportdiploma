"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from "nuqs";
import { useTransition } from "react";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import Spinner from "~/app/_components/spinner";

const options = [
  "uitgegeven",
  "klaar-voor-uitgifte",
  "geen-voortgang",
] as const;

export function FilterSelect() {
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "weergave",
    parseAsArrayOf(parseAsStringLiteral(options)).withOptions({
      startTransition,
    }),
  );

  const toggleValue = (value: (typeof options)[number]) => {
    const current = query ?? [];

    if (current.includes(value)) {
      void setQuery(current.filter((v) => v !== value));
    } else {
      void setQuery([...current, value]);
    }
  };

  return (
    <Popover className="relative">
      <PopoverButton outline>
        {isPending ? <Spinner /> : null}
        Filter <ChevronDownIcon />
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="flex flex-col gap-1 p-4">
        <CheckboxGroup>
          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("uitgegeven")}
              checked={query?.includes("uitgegeven")}
            />
            <Label>Uitgegeven</Label>
            <Description>Toon regels met een uitgegeven diploma.</Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("klaar-voor-uitgifte")}
              checked={query?.includes("klaar-voor-uitgifte")}
            />
            <Label>Klaar voor uitgifte</Label>
            <Description>
              Toon regels die nog geen diploma hebben, maar wel minimaal één
              afgeronde module.
            </Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("geen-voortgang")}
              checked={query?.includes("geen-voortgang")}
            />
            <Label>Geen voortgang</Label>
            <Description>
              Toon regels zonder diploma, en zonder afgeronde modules.
            </Description>
          </CheckboxField>
        </CheckboxGroup>
      </PopoverPanel>
    </Popover>
  );
}
