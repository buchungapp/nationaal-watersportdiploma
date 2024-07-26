"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Column, Table as TableType } from "@tanstack/react-table";
import { clsx } from "clsx";
import {
  ComponentProps,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import DragIcon from "~/app/_components/drag-icon";
import { useColumnOrdering } from "../_hooks/use-column-ordering";
import { useCustomSensors } from "../_hooks/use-custom-sensors";
import { Checkbox } from "./checkbox";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from "./dropdown";

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
}>({
  columnOrder: [],
  handleDragEnd: () => {},
  sensors: [],
});

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

      setColumnOrder(newColumnOrder);
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

export function TableColumnOrderingContext({ children }: PropsWithChildren) {
  const { columnOrder } = useContext(TableOrdering);

  return (
    <SortableContext
      items={columnOrder}
      strategy={horizontalListSortingStrategy}
    >
      {children}
    </SortableContext>
  );
}

export function TableDisplay<TData>({
  table,
  anchor = "bottom end",
}: {
  table: TableType<TData>;
  anchor?: ComponentProps<typeof DropdownMenu>["anchor"];
}) {
  const { columnOrder, handleDragEnd, sensors } = useContext(TableOrdering);
  const isLastColumnVisible = table.getVisibleLeafColumns().length === 1;

  return (
    <Dropdown>
      <DropdownButton
        outline
        className={clsx(
          !table.getIsAllColumnsVisible() && "border-branding-dark/10",
        )}
      >
        <span
          className={clsx(
            "hidden sm:inline",
            !table.getIsAllColumnsVisible() && "text-branding-dark",
          )}
        >
          Weergave
        </span>
        {!table.getIsAllColumnsVisible() ? (
          <EyeSlashIcon className="h-4 w-4 [--btn-icon:theme(colors.branding.dark)]" />
        ) : (
          <EyeIcon className="h-4 w-4" />
        )}
      </DropdownButton>
      <DropdownMenu anchor={anchor} className="min-w-64">
        <DropdownSection>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => handleDragEnd(event)}
            sensors={sensors}
          >
            {table.getAllLeafColumns().map((column) => {
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
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            className={clsx(
              "!grid-cols-[1fr_1.5rem_0.5rem_auto]",
              table.getIsAllColumnsVisible()
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer opacity-100",
            )}
            onClick={() => {
              if (!table.getIsAllColumnsVisible())
                table.toggleAllColumnsVisible();
            }}
          >
            <span className="font-medium">Toon alles</span>
            <Checkbox
              disabled={table.getIsAllColumnsVisible()}
              checked={table.getIsAllColumnsVisible()}
              onChange={() => {
                if (!table.getIsAllColumnsVisible())
                  table.toggleAllColumnsVisible();
              }}
            />
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
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
  };

  return (
    <DropdownItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={() => !isDisabled && column.toggleVisibility()}
      className={isDisabled ? "opacity-50" : "opacity-100"}
      as={"div"}
    >
      <DragIcon isDragging={isDragging} />
      <span>
        {typeof column.columnDef.header === "function"
          ? (column.columnDef.meta as { label?: string })?.label
          : column.columnDef.header}
      </span>

      <Checkbox
        disabled={isDisabled}
        checked={column.getIsVisible()}
        onChange={() => column.toggleVisibility()}
      />
    </DropdownItem>
  );
}
