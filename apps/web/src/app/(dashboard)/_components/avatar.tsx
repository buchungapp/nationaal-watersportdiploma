import * as Headless from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";

interface AvatarProps {
  src?: string | null;
  square?: boolean;
  initials?: string;
  alt?: string;
  className?: string;
}

export function Avatar({
  src = null,
  square = false,
  initials,
  alt = "",
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="avatar"
      className={clsx(
        className,

        // Basic layout
        "inline-grid align-middle *:col-start-1 *:row-start-1",

        // Add the correct border radius
        square
          ? "rounded-[20%] *:rounded-[20%]"
          : "rounded-full *:rounded-full",
      )}
      {...props}
    >
      {initials && (
        <svg
          className="select-none fill-current text-[48px] font-medium uppercase"
          viewBox="0 0 100 100"
          aria-hidden={alt ? undefined : "true"}
        >
          {alt && <title>{alt}</title>}
          <text
            x="50%"
            y="50%"
            alignmentBaseline="middle"
            dominantBaseline="middle"
            textAnchor="middle"
            dy=".125em"
          >
            {initials}
          </text>
        </svg>
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          className="object-contain object-center h-full w-full p-0.5 bg-white"
        />
      )}
      {/* Add an inset border that sits on top of the image */}
      <span
        className="ring-1 ring-inset ring-black/5 dark:ring-white/5 forced-colors:outline"
        aria-hidden="true"
      />
    </span>
  );
}

export const AvatarButton = React.forwardRef(function AvatarButton(
  {
    src,
    square = false,
    initials,
    alt,
    className,
    ...props
  }: AvatarProps &
    (Headless.ButtonProps | React.ComponentPropsWithoutRef<typeof Link>),
  ref: React.ForwardedRef<HTMLElement>,
) {
  const classes = clsx(
    className,
    square ? "rounded-lg" : "rounded-full",
    "relative focus:outline-hidden data-focus:outline data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-branding-light",
  );

  return "href" in props ? (
    <Link
      {...props}
      className={classes}
      ref={ref as React.ForwardedRef<HTMLAnchorElement>}
    >
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Headless.Button>
  );
});
