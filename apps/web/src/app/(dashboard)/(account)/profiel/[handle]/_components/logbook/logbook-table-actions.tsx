import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import { DialogProvider } from "~/app/(dashboard)/_hooks/use-dialog";
import { EditLogbook } from "./edit-logbook";
import type { LogbookType } from "./logbook-table";
import { RemoveLogbook } from "./remove-logbook";

function RemoveLogbookRows() {
  const { open } = useDialog("remove-logbook");

  return (
    <DropdownItem onClick={open}>
      <DropdownLabel>Verwijderen</DropdownLabel>
    </DropdownItem>
  );
}

function EditLogbookButton({ rows }: { rows: LogbookType[] }) {
  const { open } = useDialog("edit-logbook");

  return (
    <DropdownItem
      onClick={open}
      disabled={rows.length !== 1}
      title={rows.length !== 1 ? "Selecteer één regel" : undefined}
    >
      <DropdownLabel>Bewerken</DropdownLabel>
    </DropdownItem>
  );
}

export function LogbookTableActionsButton({
  rows,
  personId,
  resetRowSelection,
}: {
  rows: LogbookType[];
  personId: string;
  resetRowSelection: () => void;
}) {
  return (
    <DialogProvider>
      <Dropdown>
        <DropdownButton aria-label="Bulk actie">Bulk actie</DropdownButton>
        <DropdownMenu anchor="top">
          <EditLogbookButton rows={rows} />
          <RemoveLogbookRows />
        </DropdownMenu>
      </Dropdown>

      <EditLogbook rows={rows} personId={personId} />
      <RemoveLogbook
        logbookId={rows.map((row) => row.id)}
        personId={personId}
        onSuccess={resetRowSelection}
      />
    </DialogProvider>
  );
}
