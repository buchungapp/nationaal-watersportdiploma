"use client";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { PropsWithChildren } from "react";
import React from "react";
import { Select } from "~/app/(dashboard)/_components/select";

export function SetView({
  children,
  defaultView,
}: PropsWithChildren<{
  defaultView: "allen" | "geclaimd";
}>) {
  const [_isLoading, startTransition] = React.useTransition();
  const [value, setValue] = useQueryState(
    "overzicht",
    parseAsStringLiteral(["allen", "geclaimd"] as const)
      .withDefault(defaultView)
      .withOptions({
        startTransition,
        shallow: false,
      }),
  );

  return (
    // biome-ignore lint/suspicious/noExplicitAny: intentional
    <Select value={value} onChange={(e) => setValue(e.target.value as any)}>
      {children}
    </Select>
  );
}
