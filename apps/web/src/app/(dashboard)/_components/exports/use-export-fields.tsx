"use client";
import { createContext, type ReactNode, useContext, useState } from "react";

export type FieldId = string;
export type FieldLabel = string;

export type Field<Categories extends FieldCategories = FieldCategories> = {
  id: FieldId;
  label: FieldLabel;
  category: Extract<keyof Categories, string>;
};

export type FieldCategories = Record<string, string>;

export type FieldMap = Map<FieldId, FieldLabel>;

/* Hook */
function useExportFieldsInternal(fields: Field[], categories: FieldCategories) {
  const [selectedFields, setSelectedFields] = useState<FieldMap>(() => {
    const map = new Map<FieldId, FieldLabel>();

    // Add default fields
    for (const field of fields) {
      map.set(field.id, field.label);
    }

    return map;
  });

  const toggleField = (fieldId: FieldId) => {
    setSelectedFields((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(fieldId)) {
        newMap.delete(fieldId);
      } else {
        // Add the field
        const defaultField = fields.find((f) => f.id === fieldId);
        if (defaultField) {
          newMap.set(fieldId, defaultField.label);
        } else {
          newMap.set(fieldId, fieldId);
        }
      }
      return newMap;
    });
  };

  const updateLabel = (fieldId: FieldId, label: FieldLabel) => {
    setSelectedFields((prev) => {
      const newMap = new Map(prev);
      const field = newMap.get(fieldId);

      if (typeof field !== "undefined") {
        newMap.set(fieldId, label);
      }
      return newMap;
    });
  };

  const selectAllFields = () => {
    const map = new Map<FieldId, FieldLabel>();

    // Add default fields
    for (const field of fields) {
      map.set(field.id, field.label);
    }

    setSelectedFields(map);
  };

  const deselectAllFields = () => {
    setSelectedFields(new Map());
  };

  return {
    selectedFields,
    toggleField,
    updateLabel,
    selectAllFields,
    deselectAllFields,
    fields,
    categories,
  };
}

/* Context */
interface ExportFieldsContextType {
  selectedFields: FieldMap;
  toggleField: (fieldId: FieldId) => void;
  updateLabel: (fieldId: FieldId, label: FieldLabel) => void;
  selectAllFields: () => void;
  deselectAllFields: () => void;
  fields: readonly Field[];
  categories: FieldCategories;
}

const ExportFieldsContext = createContext<ExportFieldsContextType | null>(null);

interface ExportFieldsProviderProps<Categories extends FieldCategories> {
  children: ReactNode;
  fields: Field<Categories>[];
  categories: Categories;
}

export function ExportFieldsProvider<Categories extends FieldCategories>({
  children,
  fields,
  categories,
}: ExportFieldsProviderProps<Categories>) {
  const exportFields = useExportFieldsInternal(fields as Field[], categories);

  return (
    <ExportFieldsContext.Provider value={exportFields}>
      {children}
    </ExportFieldsContext.Provider>
  );
}

export function useExportFields() {
  const context = useContext(ExportFieldsContext);
  if (!context) {
    throw new Error(
      "useExportFields must be used within an ExportFieldsProvider",
    );
  }
  return context;
}
