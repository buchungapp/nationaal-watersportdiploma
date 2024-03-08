import Article from "~/app/_components/style/Article";
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
    <Article>
      <Article.Heading className={colorClass}>{label}</Article.Heading>
      <Article.Title as="h3" balance={false}>
        {title}
      </Article.Title>
      <Article.Paragraph>{description}</Article.Paragraph>
      <Article.ButtonSection>
        <TekstButton href={href} className={colorClass}>
          Lees meer
        </TekstButton>
      </Article.ButtonSection>
    </Article>
  );
}
