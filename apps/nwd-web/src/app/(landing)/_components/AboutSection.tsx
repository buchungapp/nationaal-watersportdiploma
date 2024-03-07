import { ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";

export default function AboutSection({
  label,
  title,
  description,
  href,
  color,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
  color: "branding-light" | "branding-dark" | "branding-orange";
}) {
  const colorClass =
    color === "branding-light"
      ? "text-branding-light"
      : color === "branding-dark"
        ? "text-branding-dark"
        : "text-branding-orange";
  return (
    <div className="grid gap-2">
      <div className={clsx("flex gap-3 items-center", colorClass)}>
        <span className="uppercase whitespace-nowrap font-bold">{label}</span>
        <Double />
      </div>
      <h3 className="font-bold text-2xl">
        <Balancer>{title}</Balancer>
      </h3>
      <p>{description}</p>
      <Link
        href={href}
        className={clsx(
          "flex gap-1 items-center font-semibold group",
          colorClass,
        )}
      >
        Lees meer{" "}
        <ArrowRightIcon
          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
          strokeWidth={2.5}
        />
      </Link>
    </div>
  );
}
