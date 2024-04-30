import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";

export default function Page() {
  return (
    <div className="py-16">
      <div className="md:flex md:items-center md:justify-between md:space-x-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Personen
          </h1>

          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Een overzicht van personen die een rol hebben binnen de locatie.
          </p>
        </div>
        <div className="mt-4 sm:flex sm:items-center sm:space-x-2 md:mt-0">
          <FilterSelect />
          <button
            type="button"
            className="mt-2 flex h-9 w-full items-center whitespace-nowrap rounded-tremor-small bg-branding-light px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-branding-dark dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis sm:mt-0 sm:w-fit"
          >
            Persoon toevoegen
          </button>
        </div>
      </div>

      <Table />
    </div>
  );
}
