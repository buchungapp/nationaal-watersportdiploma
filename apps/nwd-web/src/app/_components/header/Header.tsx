import Trustbar from "./Trustbar";
import Nav from "./nav/Nav";

export default async function Header() {
  return (
    <header>
      <a
        href="#content"
        className="fixed left-4 top-4 z-50 -translate-x-[calc(100%+2rem)] border-2 border-branding bg-white p-4 text-branding shadow-lg transition-transform focus:translate-x-0"
      >
        Naar de inhoud gaan
      </a>
      <Trustbar />
      <Nav
        // @TODO: add descriptions to nav items
        items={[
          {
            label: "Vaarlocaties",
            description: "",
            href: "/vaarlocaties",
          },
          {
            label: "Diplomeringslijn",
            items: [
              {
                label: "Leeftijdscategorieën",
                description: "",
                href: "/diplomeringslijn/leeftijdscategorieen",
              },
              {
                label: "Disciplines",
                description: "",
                href: "/diplomeringslijn/disciplines",
              },
              {
                label: "Accreditatie",
                description: "",
                href: "/diplomeringslijn/accreditatie",
              },
            ],
          },
          {
            label: "FAQ",
            description: "",
            href: "/faq",
          },

          {
            label: "Vereniging",
            items: [
              {
                label: "Manifest",
                description: "",
                href: "/vereniging/manifest",
              },
              {
                label: "Vertrouwenspersoon",
                description: "",
                href: "/vereniging/vertrouwenspersoon",
              },
              {
                label: "Gedragscode",
                description: "",
                href: "/vereniging/gedragscode",
              },
              {
                label: "Bestuur",
                description: "",
                href: "/vereniging/bestuur",
              },
              {
                label: "Secretariaat",
                description: "",
                href: "/vereniging/secretariaat",
              },
              {
                label: "Kwaliteitscommissie",
                description: "",
                href: "/vereniging/kwaliteitscommissie",
              },
              {
                label: "Statuten en reglementen",
                description: "",
                href: "/vereniging/statuten-en-reglementen",
              },
            ],
          },

          {
            label: "Contact",
            description: "",
            href: "/contact",
          },
        ]}
      />
    </header>
  );
}
