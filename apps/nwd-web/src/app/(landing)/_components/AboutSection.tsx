import clsx from "clsx";
import Double from "~/app/_components/brand/double-line";
import { TekstButton } from "~/app/_components/style/Buttons";

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
      <div className={clsx(text, "flex font-bold uppercase items-center gap-x-3")}>
        {label}
        <Double />
      </div>
      <h3 className="text-gray-900 mt-1.5 font-bold text-2xl">{title}</h3>
      <p className="text-gray-700 mt-2.5">{description}</p>
      <TekstButton href={href} className={clsx(background, text, "mt-4")}>
        Lees meer
      </TekstButton>
    </div>
  );
}
