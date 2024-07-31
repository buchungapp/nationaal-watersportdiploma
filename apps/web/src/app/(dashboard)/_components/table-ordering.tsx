"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PopoverPanelProps } from "@headlessui/react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/16/solid";
import type { Column, Table as TableType } from "@tanstack/react-table";
import { clsx } from "clsx";
import { createContext, useContext, type PropsWithChildren } from "react";
import DragIcon from "~/app/_components/drag-icon";
import type { useColumnOrdering } from "../_hooks/use-column-ordering";
import { useCustomSensors } from "../_hooks/use-custom-sensors";
import { Button } from "./button";
import { Checkbox, CheckboxField } from "./checkbox";
import { Divider } from "./divider";
import { Label } from "./fieldset";
import { Popover, PopoverButton, PopoverPanel } from "./popover";
export function updateColumnOrder(
  columnOrder: string[],
  activeId: string,
  overId: string,
): string[] {
  const oldIndex = columnOrder.indexOf(activeId);
  const newIndex = columnOrder.indexOf(overId);
  return arrayMove(columnOrder, oldIndex, newIndex);
}

const TableOrdering = createContext<{
  columnOrder: string[];
  handleDragEnd: (event: DragEndEvent) => void;
  sensors: SensorDescriptor<SensorOptions>[];
} | null>(null);

function useTableOrdering() {
  const context = useContext(TableOrdering);

  if (!context) {
    throw new Error(
      "useTableOrdering must be used within a TableOrderingContext",
    );
  }

  return context;
}

export function TableOrderingContext({
  options: {
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
  },
  children,
}: PropsWithChildren<{
  options: ReturnType<typeof useColumnOrdering>;
}>) {
  const sensors = useCustomSensors();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const newColumnOrder = updateColumnOrder(
        columnOrder,
        active.id as string,
        over.id as string,
      );

      void setColumnOrder(newColumnOrder);
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={(event) => handleDragEnd(event)}
      sensors={sensors}
    >
      <TableOrdering.Provider value={{ columnOrder, handleDragEnd, sensors }}>
        {children}
      </TableOrdering.Provider>
    </DndContext>
  );
}

export function TableDisplay<TData>({
  table,
  anchor = "bottom end",
}: {
  table: TableType<TData>;
  anchor?: PopoverPanelProps["anchor"];
}) {
  const { columnOrder, handleDragEnd, sensors } = useTableOrdering();

  const pinnedColumns = [
    table.getState().columnPinning.left ?? [],
    table.getState().columnPinning.right ?? [],
  ].flat();

  const isLastColumnVisible =
    table.getVisibleLeafColumns().length === pinnedColumns.length + 1;
  const ordableColumns = table
    .getAllLeafColumns()
    .filter((column) => !pinnedColumns.includes(column.id));

  return (
    <Popover>
      <PopoverButton
        outline
        className={clsx(
          !table.getIsAllColumnsVisible() && "border-branding-dark/10",
        )}
      >
        <AdjustmentsHorizontalIcon />
      </PopoverButton>
      <PopoverPanel anchor={anchor} modal className="min-w-64">
        <div className="py-2.5">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => handleDragEnd(event)}
            sensors={sensors}
          >
            {ordableColumns.map((column) => {
              return (
                <SortableContext
                  key={column.id}
                  items={columnOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <SortableItem
                    column={column as Column<unknown, unknown>}
                    isDisabled={column.getIsVisible() && isLastColumnVisible}
                  />
                </SortableContext>
              );
            })}
          </DndContext>
        </div>
        <Divider />
        <Button
          plain
          className="w-full rounded-none"
          onClick={() => {
            if (!table.getIsAllColumnsVisible())
              table.toggleAllColumnsVisible();
          }}
          disabled={table.getIsAllColumnsVisible()}
        >
          Toon alle kolommen
        </Button>
      </PopoverPanel>
    </Popover>
  );
}

function SortableItem({
  column,
  isDisabled,
}: {
  column: Column<unknown, unknown>;
  isDisabled: boolean;
}) {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column?.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    touchAction: "none",
  };

  return (
    <div
      style={style}
      className={clsx(
        "flex items-center justify-between px-4 py-1.5 gap-x-2.5 hover:bg-slate-100 relative cursor-default",
        isDisabled ? "opacity-50" : "opacity-100",
      )}
    >
      <CheckboxField disabled={isDisabled} className={clsx("flex-1")}>
        <Checkbox
          checked={column.getIsVisible()}
          onChange={() => column.toggleVisibility()}
        />

        <Label className="w-full">
          {typeof column.columnDef.header === "function"
            ? column.columnDef.meta?.label
            : column.columnDef.header}
        </Label>
      </CheckboxField>
      <div ref={setNodeRef} {...attributes} {...listeners}>
        <DragIcon isDragging={isDragging} />
      </div>
    </div>
  );
}
