import { PlusIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import Search from "~/app/(dashboard)/(management)/_components/search";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
} from "~/lib/nwd";
import { DialogButtons } from "../../../personen/_components/dialog-context";
import StudentsTable from "./_components/students-table";

export default async function Page({
  params,
}: {
  params: { location: string; cohort: string };
}) {
  const cohort = await retrieveCohortByHandle(params.cohort);
  if (!cohort) {
    notFound();
  }
  const students = await listStudentsWithCurriculaByCohortId(cohort.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek cursisten..." />
            {/* <FilterSelect /> */}
          </div>
        </div>
        <Dropdown>
          <DropdownButton color="branding-orange">
            <PlusIcon />
            Cursist toevoegen
          </DropdownButton>
          <DropdownMenu>
            <DialogButtons />
          </DropdownMenu>
        </Dropdown>
      </div>

      <StudentsTable students={students} totalItems={students.length} />
    </>
  );
}
