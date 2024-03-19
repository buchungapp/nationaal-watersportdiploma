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
      <Nav
        items={[
          {
            label: "Vaarlocaties",
            href: "/vaarlocaties",
          },
          {
            label: "Diplomeringslijn",
            active: "/diplomalijn",
            component: (
              <div className="p-4">
                {[
                  {
                    name: "Consumenten",
                    href: "/diplomalijn/consument",
                    description: "De consumentenlijn van het NWD",
                  },
                  {
                    name: "Instructeurs",
                    href: "/diplomalijn/instructeur",
                    description: "De instructeurslijn van het NWD",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="group relative flex gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50"
                  >
                    {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <item.icon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                      </div> */}
                    <div className="flex-auto">
                      <a
                        href={item.href}
                        className="block font-semibold text-gray-900"
                      >
                        {item.name}
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            label: "Actueel",
            href: "/actueel",
          },

          {
            label: "Vereniging",
            active: "/vereniging",
            component: (
              <div className="p-4">
                {[
                  {
                    name: "Manifest",
                    href: "/vereniging/manifest",
                    description: "Waar we voor staan en in geloven",
                  },
                  {
                    name: "Vertrouwenspersoon",
                    href: "/vereniging/vertrouwenspersoon",
                    description: "Hulp bij ongewenst gedrag",
                  },
                  {
                    name: "Gedragscode",
                    href: "/vereniging/gedragscode",
                    description: "Gedragsregels voor een prettige omgeving",
                  },
                  {
                    name: "Bestuur",
                    href: "/vereniging/bestuur",
                  },
                  {
                    name: "Secretariaat",
                    href: "/vereniging/secretariaat",
                  },
                  {
                    name: "Kwaliteitscommissie",
                    href: "/vereniging/kwaliteitscommissie",
                  },
                  {
                    name: "Statuten en reglementen",
                    href: "/vereniging/statuten-en-reglementen",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="group relative flex gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50"
                  >
                    {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <item.icon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                      </div> */}
                    <div className="flex-auto">
                      <a
                        href={item.href}
                        className="block font-semibold text-gray-900"
                      >
                        {item.name}
                        <span className="absolute inset-0" />
                      </a>
                      {item.description ? (
                        <p className="mt-1 font-normal text-gray-600">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ),
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
