import { CheckIcon, XMarkIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { Fragment } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

export function PersonAttributes({
  attributes,
  showSummary = true,
}: {
  attributes: {
    label: string;
    value?: string | null;
    remove?: boolean;
  }[];
  showSummary?: boolean;
}) {
  const totalAttributes = attributes.length;
  const attributesToKeep = attributes.filter(
    (attribute) => !attribute.remove,
  ).length;
  const attributesToRemove = attributes.filter(
    (attribute) => attribute.remove,
  ).length;
  const keepsAll = attributesToKeep === totalAttributes;

  return (
    <>
      <div className="flex sm:flex-row flex-col justify-between sm:items-center mt-2">
        <Subheading level={2}>{totalAttributes} Gegevens</Subheading>
        {showSummary ? (
          <Text>
            {keepsAll ? (
              "Alle gegevens zullen behouden blijven"
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CheckIcon className="size-4 text-green-500" />
                  {attributesToKeep} behouden
                </div>
                <div className="flex items-center gap-1">
                  <XMarkIcon className="size-4 text-red-500" />
                  {attributesToRemove} bestaand
                </div>
              </div>
            )}
          </Text>
        ) : null}
      </div>
      <Divider className="my-2" />

      {attributes.map((attribute, index) => (
        <Fragment key={attribute.label}>
          <Text className="text-sm">{attribute.label}</Text>
          <Text
            className={clsx(
              "font-medium text-zinc-950",
              attribute.remove && "line-through",
            )}
          >
            {attribute.value ?? "-"}
          </Text>
          {index !== attributes.length - 1 && <Divider className="my-2" />}
        </Fragment>
      ))}
    </>
  );
}
