/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Partially taken from https://github.com/leerob/leerob.io/blob/main/app/components/mdx.tsx#L168

import clsx from "clsx";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ImageProps } from "next/image";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import FaqDisclosure from "../../_components/faq/faq";

function CustomLink(props: any) {
  const href = typeof props.href === "string" ? props.href : props.href.href;

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
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
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: number) {
  return ({ children }: { children: string }) => {
    const slug = slugify(children);
    return React.createElement(
      `h${level}`,
      { id: slug, className: "scroll-mt-[calc(var(--header-height)+16px)]" },
      [
        React.createElement(
          "a",
          {
            href: `#${slug}`,
            key: `link-${slug}`,
            className: "anchor text-gray-900",
          },
          children,
        ),
      ],
    );
  };
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  Faq: FaqDisclosure,
};

export function HelpArticle(props: any) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
