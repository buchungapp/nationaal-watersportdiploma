import React, { PropsWithChildren } from "react";

export default function Breakout({
  children,
  as: Cmp = "div",
}: PropsWithChildren<{
  as?: React.ElementType;
}>) {
  return (
    <Cmp className="lg:w-[calc(100vw-16rem-5rem)] lg:-ml-[max(calc(calc(100vw-72rem-16rem-5rem)/2),0px)]">
      {children}
    </Cmp>
  );
}

export function BreakoutCenter({
  children,
  as: Cmp = "div",
}: PropsWithChildren<{
  as?: React.ElementType;
}>) {
  return (
    <Cmp className="lg:px-[max(calc(calc(100vw-72rem-16rem-5rem)/2),0px)]">
      {children}
    </Cmp>
  );
}
