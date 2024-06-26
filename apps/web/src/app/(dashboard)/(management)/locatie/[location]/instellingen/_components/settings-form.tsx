"use client";

import type { PropsWithChildren } from "react";

export default function SettingsForm({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <form className={className}>{children}</form>;
}
