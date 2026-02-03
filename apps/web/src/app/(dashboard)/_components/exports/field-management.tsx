"use client";
import { ArrowPathIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  type Field,
  type FieldCategories,
  type FieldId,
  type FieldLabel,
  type FieldMap,
  useExportFields,
} from "./use-export-fields";

export function FieldManagement() {
  const {
    selectedFields,
    toggleField,
    updateLabel,
    selectAllFields,
    deselectAllFields,
    fields,
    categories,
  } = useExportFields();

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Subheading>Selecteer velden</Subheading>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={selectAllFields}
            className="text-gray-600 hover:text-gray-900"
          >
            Selecteer alles
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={deselectAllFields}
            className="text-gray-600 hover:text-gray-900"
          >
            Deselecteer alles
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
        {[...new Set(fields.map((field) => field.category))].map((category) => (
          <FieldGroup
            key={category}
            category={category}
            fields={fields}
            categories={categories}
            selectedFields={selectedFields}
            onToggle={toggleField}
            onUpdateLabel={updateLabel}
          />
        ))}
      </div>

      <p className="text-gray-500 text-sm italic">
        Tip: klik op een label om deze aan te passen
      </p>
    </div>
  );
}

function FieldGroup({
  category,
  fields,
  categories,
  selectedFields,
  onToggle,
  onUpdateLabel,
}: {
  category: string;
  fields: readonly Field[];
  categories: FieldCategories;
  selectedFields: FieldMap;
  onToggle: (fieldId: FieldId) => void;
  onUpdateLabel: (fieldId: FieldId, label: FieldLabel) => void;
}) {
  const categoryFields = fields.filter((field) => field.category === category);

  if (categoryFields.length === 0) return null;

  const allFieldsSelected = categoryFields.every((field) =>
    selectedFields.has(field.id),
  );
  const _someFieldsSelected = categoryFields.some((field) =>
    selectedFields.has(field.id),
  );

  const toggleCategory = () => {
    if (allFieldsSelected) {
      // Deselect all fields in category
      for (const field of categoryFields) {
        if (selectedFields.has(field.id)) {
          onToggle(field.id);
        }
      }
    } else {
      // Select all fields in category
      for (const field of categoryFields) {
        if (!selectedFields.has(field.id)) {
          onToggle(field.id);
        }
      }
    }
  };

  return (
    <div className="first:mt-0">
      <div className="top-0 z-10 sticky flex justify-between items-center bg-white/80 backdrop-blur-lg px-3 py-2.5 border-gray-200 border-b">
        <h4 className="font-medium text-gray-900 text-sm">
          {categories[category]}
        </h4>
        <button
          type="button"
          onClick={toggleCategory}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          {allFieldsSelected ? "Deselecteer alles" : "Selecteer alles"}
        </button>
      </div>
      <div className="space-y-1 px-3 py-2">
        {categoryFields.map((field) => (
          <FieldSelector
            key={field.id}
            field={field}
            isSelected={selectedFields.has(field.id)}
            label={selectedFields.get(field.id) ?? field.label}
            onToggle={() => onToggle(field.id)}
            onUpdateLabel={(value) => onUpdateLabel(field.id, value)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldSelector({
  field,
  isSelected,
  label,
  onToggle,
  onUpdateLabel,
}: {
  field: Field;
  isSelected: boolean;
  label: string;
  onToggle: () => void;
  onUpdateLabel: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex justify-between items-center py-1">
      <label
        htmlFor={`field-${field.id}`}
        className="flex flex-1 items-center space-x-2"
      >
        <input
          type="checkbox"
          id={`field-${field.id}`}
          name={`field[${field.id}][selected]`}
          checked={isSelected}
          onChange={(value) => {
            if (!value && isEditing) setIsEditing(false);
            onToggle();
          }}
          className="hidden"
        />
        <input type="hidden" name={`field[${field.id}][label]`} value={label} />
        <Checkbox
          checked={isSelected}
          onChange={(value) => {
            if (!value && isEditing) setIsEditing(false);
            onToggle();
          }}
        />

        {isEditing ? (
          <Input
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              if (label === "") {
                onUpdateLabel(field.label);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsEditing(false);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onUpdateLabel(field.label);
                setIsEditing(false);
              }
            }}
          />
        ) : (
          <div className="flex flex-1 justify-between items-center">
            {isSelected ? (
              <button
                data-slot="label"
                className="data-disabled:opacity-50 w-fit text-zinc-950 dark:text-white sm:text-sm/6 text-base/6 select-none"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Klik om label aan te passen"
              >
                {label}
              </button>
            ) : (
              <span className="text-zinc-950 dark:text-white sm:text-sm/6 text-base/6 select-none">
                {label}
              </span>
            )}
            {label !== field.label && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateLabel(field.label);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </label>
    </div>
  );
}
