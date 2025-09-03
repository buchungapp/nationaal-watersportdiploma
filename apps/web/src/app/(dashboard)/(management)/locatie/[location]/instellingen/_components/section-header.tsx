import type React from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

export function SectionHeader({
  divider,
  heading,
  title,
  description,
}: {
  divider?: boolean;
  heading?: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  const HeaderComp = heading ? Heading : Subheading;
  return (
    <>
      <HeaderComp>{title}</HeaderComp>
      <Text>{description}</Text>
      {divider ? (
        <Divider soft className={heading ? "mt-6 mb-10" : "my-10"} />
      ) : null}
    </>
  );
}
