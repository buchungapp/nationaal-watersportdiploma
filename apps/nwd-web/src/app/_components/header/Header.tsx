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
            description: "",
            href: "/diplomeringslijn",
          },
          {
            label: "FAQ",
            description: "",
            href: "/faq",
          },

          {
            label: "Veiligheid",
            description:
              "Een veilige omgeving voor iedereen, met aandacht voor fysieke en sociale veiligheid.",
            href: "/veiligheid",
          },
          {
            label: "Kwaliteit",
            description:
              "Moderne materialen, hooggekwalificeerde instructeurs, strenge kwaliteitsnormen.",
            href: "/kwaliteit",
          },
          {
            label: "Plezier",
            description:
              "Leren watersporten moet leuk zijn, met heldere stappen naar je volgende diploma en vele succesmomenten.",
            href: "/plezier",
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
