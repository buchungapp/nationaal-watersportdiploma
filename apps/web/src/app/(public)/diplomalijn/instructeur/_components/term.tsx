import slugify from "@sindresorhus/slugify";
import Link from "next/link";

export function Term({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  const anchor =
    id ??
    slugify(typeof children === "string" ? children : String(children), {
      lowercase: true,
    });
  return (
    <Link
      href={`/diplomalijn/instructeur/begrippenlijst#${anchor}`}
      className="border-b border-dotted border-branding-light/60 text-inherit no-underline transition-colors hover:border-branding-light hover:text-branding-dark"
      prefetch={false}
    >
      {children}
    </Link>
  );
}
