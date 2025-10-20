import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { Link } from "../../_components/link";

export default function SecretariaatPage() {
  return (
    <>
      <Heading level={1}>Secretariaat</Heading>
      <Text>Beheer alle secretariaat-gerelateerde taken.</Text>

      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <SecretariaatCard
          title="KSS"
          description="Beheer de Kwalificatie Structuur Sport."
          href="/secretariaat/kss"
        />
        <SecretariaatCard
          title="Gebruikers"
          description="Beheer alle gebruikers."
          href="/secretariaat/gebruikers"
        />
        <SecretariaatCard
          title="Vaarlocaties"
          description="Beheer alle vaarlocaties."
          href="/secretariaat/vaarlocaties"
        />
        <SecretariaatCard
          title="Cursussen"
          description="Beheer alle cursussen."
          href="/secretariaat/cursussen"
        />
        <SecretariaatCard
          title="Diploma's"
          description="Beheer alle diploma's."
          href="/secretariaat/diplomas"
          disabled
        />
      </div>
    </>
  );
}

function SecretariaatCard({
  title,
  description,
  href,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex justify-between shadow-sm hover:shadow-md px-6 py-4 border border-gray-200 rounded-xl transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : "hover:border-gray-300",
      )}
    >
      <div>
        <Subheading>{title}</Subheading>
        <Text>{description}</Text>
      </div>
      <ArrowUpRightIcon className="size-6" />
    </Link>
  );
}
