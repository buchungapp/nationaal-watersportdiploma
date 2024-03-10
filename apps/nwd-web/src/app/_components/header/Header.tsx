import Trustbar from "./Trustbar";
import Nav from "./nav/Nav";

export default async function Header() {
  return (
    <header className="bg-branding-light">
      <a
        href="#content"
        className="fixed left-4 top-4 z-50 -translate-x-[calc(100%+2rem)] border-2 border-branding bg-white p-4 text-branding shadow-lg transition-transform focus:translate-x-0"
      >
        Naar de inhoud gaan
      </a>
      <Trustbar />
      <Nav
        items={[
          {
            label: "Vaarlocaties",
            href: "/vaarlocaties",
          },
          {
            label: "Diplomeringslijn",
            component: null,
          },
          {
            label: "Actueel",
            href: "/actueel",
          },

          {
            label: "Vereniging",
            component: null,
          },

          {
            label: "Contact",
            href: "/contact",
          },
        ]}
      />
    </header>
  );
}
