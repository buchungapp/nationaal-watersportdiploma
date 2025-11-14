"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useQueryState } from "nuqs";
import { use } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import type { listCategories, listDisciplines } from "~/lib/nwd";
import { searchParams } from "../_search-params";

export function FilterCard({
  disciplinesPromise,
  ageCategoriesPromise,
}: {
  disciplinesPromise: ReturnType<typeof listDisciplines>;
  ageCategoriesPromise: ReturnType<typeof listCategories>;
}) {
  const disciplines = use(disciplinesPromise);
  const ageCategories = use(ageCategoriesPromise);

  const [disciplineId, setDisciplineId] = useQueryState(
    "disciplineId",
    searchParams.disciplineId.withOptions({
      shallow: false,
    }),
  );
  const [ageCategoryId, setAgeCategoryId] = useQueryState(
    "categoryId",
    searchParams.categoryId.withOptions({
      shallow: false,
    }),
  );

  return (
    <div className="bg-branding-orange p-4 rounded-2xl w-full">
      <h3 className="font-semibold text-white text-lg leading-6">
        Zoek NWD vaarlocatie
      </h3>
      <h4 className="text-white sm:text-sm/6 text-base/6">Disciplines </h4>
      <div className="flex gap-2">
        <Listbox
          name="disciplineId"
          className="w-full"
          value={disciplineId?.[0] ?? null}
          onChange={(value) => value !== null && setDisciplineId([value])}
        >
          {disciplines.map((discipline) => (
            <ListboxOption key={discipline.id} value={discipline.id}>
              {discipline.title}
            </ListboxOption>
          ))}
        </Listbox>
        <Button
          color="white"
          onClick={() => {
            setDisciplineId(null);
          }}
        >
          <XMarkIcon />
        </Button>
      </div>
      <h4 className="mt-4 text-white sm:text-sm/6 text-base/6">
        Leeftijdscategorieën
      </h4>
      <div className="flex gap-2">
        <Listbox
          name="ageCategoryId"
          className="w-full"
          value={ageCategoryId?.[0] ?? null}
          onChange={(value) => value !== null && setAgeCategoryId([value])}
        >
          {ageCategories.map((ageCategory) => (
            <ListboxOption key={ageCategory.id} value={ageCategory.id}>
              {ageCategory.title}
            </ListboxOption>
          ))}
        </Listbox>
        <Button
          color="white"
          onClick={() => {
            setAgeCategoryId(null);
          }}
        >
          <XMarkIcon />
        </Button>
      </div>
    </div>
  );
}
