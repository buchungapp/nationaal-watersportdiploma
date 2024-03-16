import clsx from "clsx";

import Double from "~/app/_components/brand/double-line";
import { TekstButton } from "~/app/_components/style/buttons";

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
  color: "light" | "dark" | "orange" | "black";
}) {
  const { background, text } = {
    light: {
      text: "text-branding-light",
      background: "hover:bg-branding-light/10",
    },
    dark: {
      text: "text-branding-dark",
      background: "hover:bg-branding-dark/10",
    },
    orange: {
      text: "text-branding-orange",
      background: "hover:bg-branding-orange/10",
    },
    black: {
      text: "text-black",
      background: "hover:bg-black/10",
    },
  }[color];

  return (
    <div>
      <div
        className={clsx(text, "flex items-center gap-x-3 font-bold uppercase")}
      >
        {label}
        <Double />
      </div>
      <h3 className="mt-1.5 text-2xl font-bold text-gray-900">{title}</h3>
      <p className="mt-2.5 text-gray-700">{description}</p>
      <TekstButton href={href} className={clsx(background, text, "mt-4")}>
        Lees meer
      </TekstButton>
    </div>
  );
}
