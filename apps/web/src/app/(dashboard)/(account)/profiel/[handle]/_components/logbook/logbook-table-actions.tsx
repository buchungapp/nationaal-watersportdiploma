import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { TableSelectionButton } from "~/app/(dashboard)/_components/table-action";
import { DialogProvider, useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
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
  clearRowSelection,
}: {
  rows: LogbookType[];
  personId: string;
  clearRowSelection: () => void;
}) {
  return (
    <DialogProvider>
      <TableSelectionButton>
        <EditLogbookButton rows={rows} />
        <RemoveLogbookRows />
      </TableSelectionButton>

      {rows.length === 1 ? (
        // biome-ignore lint/style/noNonNullAssertion: This is guaranteed by the check above
        <EditLogbook logbook={rows[0]!} personId={personId} />
      ) : null}
      <RemoveLogbook
        logbookId={rows.map((row) => row.id)}
        personId={personId}
        onSuccess={clearRowSelection}
      />
    </DialogProvider>
  );
}
