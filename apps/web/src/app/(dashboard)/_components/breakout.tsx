import clsx from "clsx";
import type React from "react";
import type { PropsWithChildren } from "react";

const DEFAULT_COMPONENT = "div";

export default function Breakout<
  TTag extends React.ElementType = typeof DEFAULT_COMPONENT,
>({
  children,
  ...props
}: PropsWithChildren<
  {
    as?: TTag;
  } & React.ComponentPropsWithoutRef<TTag>
>) {
  const { as: cmp, ...rest } = props;
  const Cmp: React.ElementType = cmp ?? DEFAULT_COMPONENT;

  return (
    <Cmp
      {...rest}
      className={clsx(
        rest.className,
        "lg:w-[calc(100vw-16rem-5rem)] lg:-ml-[max(calc(calc(100vw-72rem-16rem-5rem)/2),0px)]",
      )}
    >
      {children}
    </Cmp>
  );
}

export function BreakoutCenter<
  TTag extends React.ElementType = typeof DEFAULT_COMPONENT,
>({
  children,
  ...props
}: PropsWithChildren<
  {
    as?: TTag;
  } & React.ComponentPropsWithoutRef<TTag>
>) {
  const { as: cmp, ...rest } = props;
  const Cmp: React.ElementType = cmp ?? DEFAULT_COMPONENT;

  return (
    <Cmp
      {...rest}
      className={clsx(
        rest.className,
        "lg:px-[max(calc(calc(100vw-72rem-16rem-5rem)/2),0px)]",
      )}
    >
      {children}
    </Cmp>
  );
}
