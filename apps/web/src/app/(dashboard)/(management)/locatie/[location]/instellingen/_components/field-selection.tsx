import * as Headless from "@headlessui/react";
import type { PropsWithChildren } from "react";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

export function FieldSection({
  label,
  description,
  children,
}: PropsWithChildren<{
  label: React.ReactNode;
  description?: React.ReactNode;
}>) {
  return (
    <Headless.Field
      as="section"
      className="gap-x-8 gap-y-6 grid sm:grid-cols-2"
    >
      <div className="space-y-1">
        <Headless.Label>
          <Subheading>{label}</Subheading>
        </Headless.Label>
        {description ? (
          <Headless.Description>
            <Text>{description}</Text>
          </Headless.Description>
        ) : null}
      </div>
      <div>{children}</div>
    </Headless.Field>
  );
}
