import Nav from "./nav/nav";
import Trustbar from "./trustbar";

export default function Header() {
  return (
    <header className="bg-branding-light">
      <a
        href="#content"
        className="border-branding text-branding fixed left-4 top-4 z-50 -translate-x-[calc(100%+2rem)] border-2 bg-white p-4 shadow-lg transition-transform focus:translate-x-0"
      >
        Naar de inhoud gaan
      </a>
      <Trustbar />
      {/* TODO: I don't find this 'active' prop intuitive. 
      It's also not flexibel enough, the help & contact section is currently not highlighted for example.
      ideally it take a function (segments: string[]) => boolean */}
      <Nav
        items={[
          {
            label: "Cashback",
            href: "/cashback",
          },
          {
            label: "Vaarlocaties",
            href: "/vaarlocaties",
          },
          {
            label: "Diplomeringslijn",
            active: "/diplomalijn",
            component: [
              {
                label: "Consumenten",
                href: "/diplomalijn/consument",
                description: "De consumentenlijn van het NWD",
              },
              {
                label: "Instructeurs",
                href: "/diplomalijn/instructeur",
                description: "De instructeurslijn van het NWD",
              },
              {
                label: "Erkenningen",
                href: "/partners",
                description: "Hoe wordt de NWD-diplomalijn erkend?",
              },
            ],
          },
          {
            label: "Actueel",
            href: "/actueel",
          },

          {
            label: "Vereniging",
            active: "/vereniging",
            component: [
              {
                label: "Manifest",
                href: "/vereniging/manifest",
                description: "Waar we voor staan en in geloven",
              },
              {
                label: "Vertrouwenspersoon",
                href: "/vereniging/vertrouwenspersoon",
                description: "Hulp bij ongewenst gedrag",
              },
              {
                label: "Gedragscode",
                href: "/vereniging/gedragscode",
                description: "Gedragsregels voor een prettige omgeving",
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
                href: "/vereniging/statuten-reglementen",
              },
            ],
          },
          {
            label: "Hulp & contact",
            active: "/help",
            component: [
              {
                label: "Helpcentrum",
                href: "/help",
                description: "Antwoord op vele vragen.",
              },
              {
                label: "Contact",
                href: "/contact",
                description: "Neem contact met ons op.",
              },
            ],
          },
        ]}
      />
    </header>
  );
}
