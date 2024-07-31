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

const options = ["geendigd", "aankomend"] as const;

export function FilterSelect() {
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "weergave",
    parseAsArrayOf(parseAsStringLiteral(options))
      .withOptions({
        startTransition,
      })
      .withDefault(["aankomend"]),
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
              onClick={() => toggleValue("geendigd")}
              checked={query?.includes("geendigd")}
            />
            <Label>Geëndigd</Label>
            <Description>Toon regels die gesloten zijn.</Description>
          </CheckboxField>

          <CheckboxField>
            <Checkbox
              onClick={() => toggleValue("aankomend")}
              checked={query?.includes("aankomend")}
            />
            <Label>Aankomend</Label>
            <Description>Toon regels die nog niet gesloten zijn.</Description>
          </CheckboxField>
        </CheckboxGroup>
      </PopoverPanel>
    </Popover>
  );
}
