import clsx from "clsx";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";
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
  color: "branding-light" | "branding-dark" | "branding-orange";
}) {
  const colorClass =
    color === "branding-light"
      ? "text-branding-light"
      : color === "branding-dark"
        ? "text-branding-dark"
        : "text-branding-orange";
  return (
    <article className="grid gap-2">
      <div className={clsx("flex gap-3 items-center", colorClass)}>
        <span className="uppercase whitespace-nowrap font-bold">{label}</span>
        <Double />
      </div>
      <h3 className="font-bold text-2xl">
        <Balancer>{title}</Balancer>
      </h3>
      <p>{description}</p>
      <TekstButton href={href} className={colorClass}>
        Lees meer
      </TekstButton>
    </article>
  );
}
