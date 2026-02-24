// Partially taken from https://github.com/leerob/leerob.io/blob/main/app/components/mdx.tsx#L168

import { InformationCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { MDXComponents } from "mdx/types";
import type { ImageProps } from "next/image";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Disclosure from "../../_components/disclosure";
import FaqDisclosure from "../../_components/faq/faq";

type CustomLinkProps = Omit<
  React.ComponentPropsWithoutRef<"a">,
  "href"
> & {
  href?: string | { href: string };
};

function CustomLink(props: CustomLinkProps) {
  const { href: hrefProp, ...restProps } = props;
  const href = typeof hrefProp === "string" ? hrefProp : hrefProp?.href;

  if (!href) {
    return <a {...restProps} />;
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...restProps}>
        {restProps.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...restProps} href={href} />;
  }

  return (
    <a {...restProps} href={href} target="_blank" rel="noopener noreferrer" />
  );
}

function RoundedImage({ alt, className, ...props }: ImageProps) {
  return (
    <Image
      alt={alt ?? ""}
      className={clsx(className, "rounded-lg")}
      {...props}
    />
  );
}

function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-en-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters except for -
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

function flattenText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return children.toString();
  }

  if (Array.isArray(children)) {
    return children.map(flattenText).join(" ");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return flattenText(children.props.children);
  }

  return "";
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(flattenText(children));

    return React.createElement(
      `h${level}`,
      { id: slug, className: "scroll-mt-[calc(var(--header-height)+16px)]" },
      [
        React.createElement(
          "a",
          {
            href: `#${slug}`,
            key: `link-${slug}`,
            className: "anchor text-slate-800 break-words hyphens-auto",
          },
          children,
        ),
      ],
    );
  };

  Heading.displayName = `MdxHeading${level}`;

  return Heading;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-2.5 rounded-2xl border border-branding-light/20 bg-branding-light/10 p-4 leading-6 text-branding-dark">
      <InformationCircleIcon className="mt-1 size-4 flex-none fill-branding-light stroke-white" />
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export const helpMdxComponents = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  Faq: FaqDisclosure,
  Note,
  Disclosure,
} satisfies MDXComponents;
