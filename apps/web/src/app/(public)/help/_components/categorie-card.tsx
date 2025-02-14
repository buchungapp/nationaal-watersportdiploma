"use client";
import clsx from "clsx";
import type { MotionStyle } from "motion/react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import Link from "next/link";
import { Wave } from "../../_assets/wave";

export default function CategorieCard({
  category,
  base = "/help/categorie",
}: {
  category: { title: string; description?: string | undefined; slug: string };
  base?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLAnchorElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const maskImage = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <Link
      href={`${base}/${category.slug}`}
      className="bg-gray-100 transition-shadow group hover:shadow-md hover:shadow-zinc-900/5 rounded-2xl pt-16 p-6 relative overflow-hidden ring-1 ring-zinc-900/10"
      onMouseMove={onMouseMove}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-linear-to-r from-branding-light/20 to-branding-light/10 opacity-0 transition duration-300 group-hover:opacity-100"
        style={style}
      />
      <Pattern
        className="text-white/70 opacity-0 group-hover:opacity-100 duration-300 transition"
        style={style}
      />
      <Pattern className="text-white/40 group-hover:opacity-30 duration-300 transition" />
      <h3 className="text-lg relative font-semibold z-10">{category.title}</h3>
      <p className="text-sm/5 relative z-10">{category.description}</p>
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
  return (
    <motion.div
      className="absolute inset-x-0 top-[15%] -translate-y-[15%]"
      style={style}
    >
      <Wave className={clsx(className, "h-14")} />
    </motion.div>
  );
}
