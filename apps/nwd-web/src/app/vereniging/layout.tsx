import Heading from "../_components/style/Heading";
import SideNav from "../_components/style/SideNav";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Heading className="bg-branding-light">
        <div className="px-4 lg:px-16">
          <div className="text-white grid gap-6">
            <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">
              Verenigingszaken
            </h1>
            <p className="text-xl">Waar we in geloven bij het Nationaal Watersportdiploma.</p>
          </div>
        </div>
      </Heading>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,3fr] gap-12 mt-12 px-4 lg:px-16">
        <div className="flex justify-end">
          <SideNav
            label="Verenigingszaken"
            items={[
              {
                label: "Manifest",
                href: "/vereniging/manifest",
              },
              {
                label: "Vertrouwenspersoon",
                href: "/vereniging/vertrouwenspersoon",
              },
              {
                label: "Gedragscode",
                href: "/vereniging/gedragscode",
              },
              {
                label: "Bestuur",
                href: "/vereniging/bestuur",
              },
              {
                label: "Secretariaat",
                href: "/vereniging/secretariaat",
              },
              {
                label: "Kwaliteitscommissie",
                href: "/vereniging/kwaliteitscommissie",
              },
              {
                label: "Statuten en reglementen",
                href: "/vereniging/statuten-en-reglementen",
              },
            ]}
            className="w-full sm:w-[18rem]"
          />
        </div>
        <div className="flex flex-col justify-center">{children}</div>
      </div>
    </main>
  );
}
