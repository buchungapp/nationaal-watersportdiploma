"use client";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import { Select } from "~/app/(dashboard)/_components/select";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
  PlaceholderTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import {
  createInstructiegroep,
  deleteInstructiegroep,
} from "~/app/_actions/kss/instructiegroep";
import InstructiegroepDialog from "./instructiegroep-dialog";

type Instructiegroep = {
  id: string;
  title: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  courses: Array<{
    id: string;
    handle: string;
    title: string | null;
    code: string | null;
  }>;
};

type Course = {
  id: string;
  title: string;
  handle: string;
};

const formatRichting = (richting: string) => {
  switch (richting) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB Beoordelaar";
    default:
      return richting;
  }
};

const columnHelper = createColumnHelper<Instructiegroep>();

export default function InstructiegroepTable({
  instructiegroepen,
  totalItems,
  placeholderRows,
  availableCourses,
}: {
  instructiegroepen: Instructiegroep[];
  totalItems: number;
  placeholderRows?: number;
  availableCourses: Course[];
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInstructiegroepId, setSelectedInstructiegroepId] = useState<
    string | null
  >(null);
  const [newInstructiegroep, setNewInstructiegroep] = useState<{
    title: string;
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  }>({
    title: "",
    richting: "instructeur",
  });

  const createAction = useAction(createInstructiegroep, {
    onSuccess: () => {
      toast.success("Instructiegroep aangemaakt");
      setCreateDialogOpen(false);
      setNewInstructiegroep({ title: "", richting: "instructeur" });
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is iets misgegaan");
    },
  });

  const deleteAction = useAction(deleteInstructiegroep, {
    onSuccess: () => {
      toast.success("Instructiegroep verwijderd");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is iets misgegaan");
    },
  });

  const columns = [
    columnHelper.display({
      id: "select",
      cell: ({ row }) => (
        <CheckboxField>
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
            className="-translate-y-[1px]"
          />
        </CheckboxField>
      ),
      header: ({ table }) => (
        <CheckboxField>
          <Checkbox
            {...{
              disabled: false,
              checked:
                table.getIsSomePageRowsSelected() ||
                table.getIsAllPageRowsSelected(),
              indeterminate: !table.getIsAllPageRowsSelected(),
              onChange: (checked) => table.toggleAllPageRowsSelected(checked),
            }}
            className="-translate-y-[1px]"
          />
        </CheckboxField>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("title", {
      header: "Titel",
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    columnHelper.accessor("richting", {
      header: "Richting",
      cell: ({ getValue }) => (
        <Badge color="blue">{formatRichting(getValue())}</Badge>
      ),
    }),
    columnHelper.accessor("courses", {
      header: "Cursussen",
      cell: ({ getValue }) => {
        const courses = getValue();
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {courses.length} cursus{courses.length !== 1 ? "sen" : ""}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Acties",
      cell: ({ row }) => (
        <Button
          plain
          onClick={() => setSelectedInstructiegroepId(row.original.id)}
          className="text-sm"
        >
          Beheren
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: instructiegroepen,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection,
    },
  });

  const anyRowSelected =
    table.getIsAllRowsSelected() || table.getIsSomeRowsSelected();

  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

  const handleDelete = async () => {
    if (selectedRows.length === 0) return;

    const hasCoursesAssigned = selectedRows.some((ig) => ig.courses.length > 0);
    if (hasCoursesAssigned) {
      toast.error(
        "Kan niet verwijderen: sommige instructiegroepen hebben cursussen",
      );
      return;
    }

    if (
      !confirm(
        `Weet je zeker dat je ${selectedRows.length} instructiegroep${
          selectedRows.length > 1 ? "en" : ""
        } wilt verwijderen?`,
      )
    ) {
      return;
    }

    for (const ig of selectedRows) {
      await deleteAction.executeAsync({ id: ig.id });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructiegroep.title.trim()) return;

    await createAction.executeAsync(newInstructiegroep);
  };

  const selectedInstructiegroep = instructiegroepen.find(
    (ig) => ig.id === selectedInstructiegroepId,
  );

  return (
    <>
      <div className="relative mt-8">
        <div className="flex justify-end mb-4">
          <Button
            color="branding-orange"
            onClick={() => setCreateDialogOpen(true)}
          >
            <PlusIcon />
            Nieuwe instructiegroep
          </Button>
        </div>

        <Table
          dense
          className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        >
          {anyRowSelected ? (
            <Popover className="top-0 left-12 absolute flex items-center space-x-2">
              <PopoverButton color="branding-orange">
                Acties <ChevronDownIcon />
              </PopoverButton>
              <PopoverPanel anchor="bottom start">
                <Button
                  color="red"
                  onClick={handleDelete}
                  disabled={deleteAction.status === "executing"}
                  className="w-full justify-start"
                >
                  Verwijderen ({selectedRows.length})
                </Button>
              </PopoverPanel>
            </Popover>
          ) : null}
          <DefaultTableHead table={table} />
          <TableBody>
            <PlaceholderTableRows table={table} rows={placeholderRows}>
              <NoTableRows table={table}>
                Geen instructiegroepen gevonden
              </NoTableRows>
              <DefaultTableRows table={table}>
                {(cell, index, row) => (
                  <DefaultTableCell
                    key={cell.id}
                    cell={cell}
                    index={index}
                    row={row}
                  />
                )}
              </DefaultTableRows>
            </PlaceholderTableRows>
          </TableBody>
        </Table>
        <TableFooter>
          <TableRowSelection
            table={table}
            rowSelection={rowSelection}
            totalItems={totalItems}
          />
          <TablePagination totalItems={totalItems} />
        </TableFooter>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={setCreateDialogOpen}>
        <form onSubmit={handleCreate}>
          <DialogTitle>Nieuwe instructiegroep</DialogTitle>
          <DialogDescription>
            Maak een nieuwe instructiegroep aan voor het beheren van cursussen.
          </DialogDescription>
          <DialogBody>
            <Field>
              <Label>Titel</Label>
              <Input
                type="text"
                value={newInstructiegroep.title}
                onChange={(e) =>
                  setNewInstructiegroep({
                    ...newInstructiegroep,
                    title: e.target.value,
                  })
                }
                placeholder="Bijv. Zeilen Niveau 1"
                required
              />
            </Field>
            <Field>
              <Label>Richting</Label>
              <Select
                value={newInstructiegroep.richting}
                onChange={(e) =>
                  setNewInstructiegroep({
                    ...newInstructiegroep,
                    richting: e.target.value as Instructiegroep["richting"],
                  })
                }
              >
                <option value="instructeur">Instructeur</option>
                <option value="leercoach">Leercoach</option>
                <option value="pvb_beoordelaar">PvB Beoordelaar</option>
              </Select>
            </Field>
          </DialogBody>
          <DialogActions>
            <Button
              plain
              type="button"
              onClick={() => setCreateDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              color="branding-orange"
              type="submit"
              disabled={
                createAction.status === "executing" ||
                !newInstructiegroep.title.trim()
              }
            >
              {createAction.status === "executing" ? "Bezig..." : "Aanmaken"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Individual instructiegroep dialog */}
      {selectedInstructiegroep && (
        <InstructiegroepDialog
          instructiegroep={selectedInstructiegroep}
          isOpen={!!selectedInstructiegroepId}
          onClose={() => setSelectedInstructiegroepId(null)}
          availableCourses={availableCourses}
        />
      )}
    </>
  );
}
