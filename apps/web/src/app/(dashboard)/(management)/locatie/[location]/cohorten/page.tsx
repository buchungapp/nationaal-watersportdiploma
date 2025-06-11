import { Heading } from "~/app/(dashboard)/_components/heading";
import { LayoutSingleCard } from "~/app/(dashboard)/_components/layout-card";
import Search from "../../../_components/search";
import CreateDialog from "./_components/create-dialog";
import { FilterSelect } from "./_components/filter";
import { Table } from "./_components/table";

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <LayoutSingleCard>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Cohorten</Heading>
        </div>
        <CreateDialog params={props.params} />
      </div>

      <div className="flex sm:flex-row flex-col sm:justify-between items-start sm:items-center gap-1 mt-8">
        <div className="w-full max-w-xl">
          <Search placeholder="Doorzoek cohorten..." />
        </div>
        <div className="flex items-center gap-1 sm:shrink-0">
          <FilterSelect params={props.params} />
        </div>
      </div>

      <div className="mt-4">
        <Table params={props.params} searchParams={props.searchParams} />
      </div>
    </LayoutSingleCard>
  );
}
