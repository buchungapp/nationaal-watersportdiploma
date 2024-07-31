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

const options = ["verleden", "aankomend", "open"] as const;

export function FilterSelect() {
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "weergave",
    parseAsArrayOf(parseAsStringLiteral(options))
      .withOptions({
        startTransition,
      })
      .withDefault(["open", "aankomend"]),
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
              onClick={() => toggleValue("verleden")}
              checked={query?.includes("verleden")}
            />
            <Label>Afgerond</Label>
            <Description>Toon afgesloten cohorten.</Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("open")}
              checked={query?.includes("open")}
            />
            <Label>Open</Label>
            <Description>
              Toon cohorten die op dit moment geopend zijn.
            </Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("aankomend")}
              checked={query?.includes("aankomend")}
            />
            <Label>Aankomend</Label>
            <Description>Toon cohorten die in de toekomst openen.</Description>
          </CheckboxField>
        </CheckboxGroup>
      </PopoverPanel>
    </Popover>
  );
}
