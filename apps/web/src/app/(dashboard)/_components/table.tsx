"use client";

import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  Cell,
  Column,
  Header,
  Table as TableType,
} from "@tanstack/react-table";
import { clsx } from "clsx";
import type React from "react";
import {
  ComponentProps,
  createContext,
  CSSProperties,
  useContext,
  useState,
} from "react";
import DragIcon from "~/app/_components/drag-icon";
import { useCustomSensors } from "../_hooks/custom-sensors";
import { Checkbox } from "./checkbox";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from "./dropdown";
import { Link } from "./link";

const TableContext = createContext<{
  bleed: boolean;
  dense: boolean;
  grid: boolean;
  striped: boolean;
}>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
});

export function Table({
  bleed = false,
  dense = false,
  grid = false,
  striped = false,
  className,
  children,
  ...props
}: {
  bleed?: boolean;
  dense?: boolean;
  grid?: boolean;
  striped?: boolean;
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <TableContext.Provider
      value={
        { bleed, dense, grid, striped } as React.ContextType<
          typeof TableContext
        >
      }
    >
      <div className="flow-root">
        <div
          {...props}
          className={clsx(
            className,
            "-mx-[--gutter] overflow-x-auto whitespace-nowrap",
          )}
        >
          <div
            className={clsx(
              "inline-block min-w-full align-middle",
              !bleed && "sm:px-[--gutter]",
            )}
          >
            <table className="min-w-full text-left text-sm/6">{children}</table>
          </div>
        </div>
      </div>
    </TableContext.Provider>
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      {...props}
      className={clsx(className, "text-zinc-500 dark:text-zinc-400")}
    />
  );
}

export function TableBody(props: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} />;
}

const TableRowContext = createContext<{
  href?: string;
  target?: string;
  title?: string;
}>({
  href: undefined,
  target: undefined,
  title: undefined,
});

export function TableRow({
  href,
  target,
  title,
  className,
  ...props
}: {
  href?: string;
  target?: string;
  title?: string;
} & React.ComponentPropsWithoutRef<"tr">) {
  const { striped } = useContext(TableContext);

  return (
    <TableRowContext.Provider
      value={
        { href, target, title } as React.ContextType<typeof TableRowContext>
      }
    >
      <tr
        {...props}
        className={clsx(
          className,
          href &&
            "has-[[data-row-link][data-focus]]:outline has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-blue-500 dark:focus-within:bg-white/[2.5%]",
          striped && "even:bg-zinc-950/[2.5%] dark:even:bg-white/[2.5%]",
          href && striped && "hover:bg-zinc-950/5 dark:hover:bg-white/5",
          href &&
            !striped &&
            "hover:bg-zinc-950/[2.5%] dark:hover:bg-white/[2.5%]",
        )}
      />
    </TableRowContext.Provider>
  );
}

export function TableHeader<TData, _>({
  className,
  header,
  ...props
}: React.ComponentPropsWithoutRef<"th"> & {
  header: Header<TData, unknown>;
}) {
  const { bleed, grid } = useContext(TableContext);

  // Column Ordering
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <th
      {...props}
      colSpan={header.colSpan}
      ref={setNodeRef} // For column ordering
      className={clsx(
        className,
        "border-b border-b-zinc-950/10 px-4 py-2 font-medium first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))] dark:border-b-white/10",
        grid &&
          "border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5",
        !bleed && "sm:first:pl-1 sm:last:pr-1",
      )}
      style={style} // For column ordering
      {...attributes} // For column ordering
      {...listeners} // For column ordering
    />
  );
}

export function TableCell<TData, _>({
  className,
  children,
  cell,
  ...props
}: React.ComponentPropsWithoutRef<"td"> & {
  cell?: Cell<TData, unknown>;
}) {
  const { bleed, dense, grid, striped } = useContext(TableContext);
  const { href, target, title } = useContext(TableRowContext);
  const [cellRef, setCellRef] = useState<HTMLElement | null>(null);

  // Column Ordering
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell?.column?.id ?? "",
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell?.column ? cell.column.getSize() : "100%",
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <td
      ref={(el) => {
        setNodeRef(el); // For column ordering
        if (href) setCellRef(el);
      }}
      {...props}
      className={clsx(
        className,
        "relative px-4 first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))]",
        !striped && "border-b border-zinc-950/5 dark:border-white/5",
        grid &&
          "border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5",
        dense ? "py-2.5" : "py-4",
        !bleed && "sm:first:pl-1 sm:last:pr-1",
      )}
      style={style} // For column ordering
    >
      {href && (
        <Link
          data-row-link
          href={href}
          target={target}
          aria-label={title}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          className="absolute inset-0 focus:outline-none"
        />
      )}
      {children}
    </td>
  );
}

// For column ordering
export function updateColumnOrder(
  columnOrder: string[],
  activeId: string,
  overId: string,
): string[] {
  const oldIndex = columnOrder.indexOf(activeId);
  const newIndex = columnOrder.indexOf(overId);
  return arrayMove(columnOrder, oldIndex, newIndex);
}

// For column ordering
export function TableDisplay<TData>({
  table,
  columnOrder,
  setColumnOrder,
  anchor = "bottom end",
}: {
  table: TableType<TData>;
  columnOrder: string[];
  setColumnOrder: (columnOrder: string[]) => void;
  anchor?: ComponentProps<typeof DropdownMenu>["anchor"];
}) {
  const sensors = useCustomSensors();
  const isLastColumnVisible = table.getVisibleLeafColumns().length === 1;

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
  };

  return (
    <DropdownItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={() => !isDisabled && column.toggleVisibility()}
      className={clsx(
        isDisabled ? "opacity-50" : "opacity-100",
        isDragging && "z-10", // This is needed to prevent other items accidentally from being dragged
      )}
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
