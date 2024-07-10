"use client";
import { useParams, useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Select } from "~/app/(dashboard)/_components/select";

export function SetView({
  value,
  children,
}: PropsWithChildren<{ value: string }>) {
  const params = useParams();
  const router = useRouter();

  return (
    <Select
      value={value}
      onChange={(newValue) => {
        router.push(
          `/locatie/${String(params.location)}/cohorten/${String(params.cohort)}?view=${newValue.target.value}`,
        );
      }}
    >
      {children}
    </Select>
  );
}
