import type { PropsWithChildren, ReactNode } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";

export function StatCard({
  title,
  children,
}: PropsWithChildren<{
  title: ReactNode;
}>) {
  return (
    <div>
      <Divider />
      <div className="mt-6 font-medium sm:text-sm/6 text-lg/6">{title}</div>
      <div className="mt-3 font-semibold tabular-nums sm:text-2xl/8 text-3xl/8">
        {children}
      </div>
    </div>
  );
}
