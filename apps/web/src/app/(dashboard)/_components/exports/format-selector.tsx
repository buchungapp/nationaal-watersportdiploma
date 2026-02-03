import { DocumentTextIcon, TableCellsIcon } from "@heroicons/react/16/solid";
import { Tab, TabGroup, TabList } from "~/app/(dashboard)/_components/tabs";
import { useExportFormat } from "./use-export-format";

export function FormatSelector() {
  const { selectedFormat, setSelectedFormat } = useExportFormat();

  return (
    <TabGroup
      selectedIndex={selectedFormat === "csv" ? 0 : 1}
      onChange={(index) => {
        setSelectedFormat(index === 0 ? "csv" : "xlsx");
      }}
    >
      <input type="hidden" name="format" value={selectedFormat} />
      <TabList>
        <Tab>
          <DocumentTextIcon className="size-5" />
          CSV
        </Tab>
        <Tab>
          <TableCellsIcon className="size-5" />
          XLSX
        </Tab>
      </TabList>
    </TabGroup>
  );
}
