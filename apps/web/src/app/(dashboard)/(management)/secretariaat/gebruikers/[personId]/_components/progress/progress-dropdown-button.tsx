import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";
import type { ComponentProps } from "react";
import type { CardType } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/progress-card";
import type { Button } from "~/app/(dashboard)/_components/button";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";

const details: Record<
  CardType,
  {
    color: ComponentProps<typeof Button>["color"];
  }
> = {
  certificate: {
    color: "branding-orange",
  },
  course: {
    color: "branding-dark",
  },
  program: {
    color: "branding-light",
  },
};

export function ProgressDropdownButton({ type }: { type: CardType }) {
  return (
    <DropdownButton color={details[type].color} className="-my-1.5">
      <EllipsisVerticalIcon />
    </DropdownButton>
  );
}
