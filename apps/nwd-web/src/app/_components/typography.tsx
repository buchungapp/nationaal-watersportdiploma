import { PropsWithChildren } from "react";

export function H3({ children }: PropsWithChildren) {
  return (
    <h3 className="text-xl font-bold leading-tight tracking-tight text-neutral-900">{children}</h3>
  );
}
