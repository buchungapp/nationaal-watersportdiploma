"use client";

import { MultiSelect, MultiSelectItem } from "@tremor/react";
import { useState } from "react";

export function FilterSelect() {
  const [_selectedStatus, setSelectedStatus] = useState<string[]>([]);

  return (
    <MultiSelect
      onValueChange={setSelectedStatus}
      placeholder="Rol..."
      placeholderSearch="Zoek"
      className="w-full sm:w-44 [&>button]:h-9 [&>button]:rounded-tremor-small"
    >
      <MultiSelectItem value="student">Cursist</MultiSelectItem>
      <MultiSelectItem value="instructor">Instructeur</MultiSelectItem>
      <MultiSelectItem value="location-admin">
        Locatie-beheerder
      </MultiSelectItem>
    </MultiSelect>
  );
}
