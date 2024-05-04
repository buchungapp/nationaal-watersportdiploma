"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { useSetQueryParams } from "~/app/(dashboard)/_utils/set-query-params";
import { Checkbox } from "../../../_components/checkbox";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "../../../_components/dropdown";

export function FilterSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();
  const [_selectedStatus, setSelectedStatus] = useState<string[]>(
    searchParams.has("filter") ? searchParams.getAll("filter") : [],
  );

  const deferredStatus = useDeferredValue(_selectedStatus);

  useEffect(() => {
    router.push(
      setQueryParams({
        filter: deferredStatus,
      }),
    );
  }, [deferredStatus]);

  return (
    <Dropdown>
      <DropdownButton outline className={"min-w-32"}>
        Filter
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <DropdownItem
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("student")
                ? prev.filter((item) => item !== "student")
                : [...prev, "student"],
            );
          }}
        >
          <Checkbox checked={_selectedStatus.includes("student")} />
          <span className="ml-2">Cursist</span>
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("instructor")
                ? prev.filter((item) => item !== "instructor")
                : [...prev, "instructor"],
            );
          }}
        >
          <Checkbox checked={_selectedStatus.includes("instructor")} />
          <span className="ml-2">Instructeur</span>
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("location-admin")
                ? prev.filter((item) => item !== "location-admin")
                : [...prev, "location-admin"],
            );
          }}
        >
          <Checkbox checked={_selectedStatus.includes("location-admin")} />
          <span className="ml-2">Locatie-beheerder</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
