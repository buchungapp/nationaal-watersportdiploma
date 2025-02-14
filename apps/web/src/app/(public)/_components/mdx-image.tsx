// https://github.com/hashicorp/next-mdx-remote/issues/405#issuecomment-1927215958

import clsx from "clsx";
import type { ImageProps } from "next/image";
import Image from "next/image";

export default function MdxImage({ className, ...props }: ImageProps) {
  return (
    <Image {...props} alt={props.alt} className={clsx(className, "shadow-sm")} />
  );
}
