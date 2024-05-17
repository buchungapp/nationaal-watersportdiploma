"use client";
import {
  MotionStyle,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import Link from "next/link";
import { useId } from "react";
import { Wave } from "../../_assets/wave";

export default function CategorieCard({
  category,
  base = "/help/categorie",
}: {
  category: { title: string; description?: string | undefined; slug: string };
  base?: string;
}) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLAnchorElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  let maskImage = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <Link
      href={`${base}/${category.slug}`}
      className="border bg-gray-100 transition-shadow group hover:shadow-md hover:shadow-zinc-900/5 border-gray-100 rounded-2xl pt-16 p-6 relative overflow-hidden"
      onMouseMove={onMouseMove}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-branding-light/20 to-branding-light/10 opacity-0 transition duration-300 group-hover:opacity-100"
        style={style}
      />
      <Pattern
        className="text-white/70 opacity-0 group-hover:opacity-100 duration-300 transition"
        style={style}
      />
      <Pattern className="text-white/40 group-hover:opacity-30 duration-300 transition" />
      <h3 className="text-lg relative font-semibold z-10">{category.title}</h3>
      <p className="text-sm relative z-10">{category.description}</p>
    </Link>
  );
}

function Pattern({
  className,
  style,
}: {
  className?: string;
  style?: MotionStyle;
}) {
  const id = useId();
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full absolute top-0 left-0"
      style={style}
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width="240.24"
          height="36"
        >
          <Wave className={className} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </motion.svg>
  );
}
