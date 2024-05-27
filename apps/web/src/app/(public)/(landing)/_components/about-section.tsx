import clsx from "clsx";

import Double from "~/app/_components/brand/double-line";

export default function AboutSection({
  label,
  title,
  description,
  color,
}: {
  label: string;
  title: string;
  description: string;
  color: "light" | "dark" | "orange" | "black";
}) {
  const { text } = {
    light: {
      text: "text-branding-light",
    },
    dark: {
      text: "text-branding-dark",
    },
    orange: {
      text: "text-branding-orange",
    },
    black: {
      text: "text-black",
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
    </div>
  );
}
