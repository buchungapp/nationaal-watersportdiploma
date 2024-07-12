import { listLocationsForPerson, listPersonsForUser } from "~/lib/nwd";
import { Divider } from "../../_components/divider";
import { Heading, Subheading } from "../../_components/heading";
import { Link } from "../../_components/link";
import { Text, TextLink } from "../../_components/text";

async function Perons() {
  const persons = await listPersonsForUser();

  return (
    <div className="my-6">
      <Subheading>Personen die jij beheert</Subheading>
      {persons.length > 0 ? (
        <ul className="mt-10">
          {persons.map((person, index) => (
            <>
              <li key={person.id}>
                <Divider soft={index > 0} />
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 py-6">
                    <div className="space-y-1.5">
                      <div className="text-base/6 font-semibold">
                        <Link href={`/profiel/${person.handle}`}>
                          {person.firstName}
                        </Link>
                      </div>
                      {/* <div className="text-xs/6 text-zinc-500">
                      {event.date} at {event.time} <span aria-hidden="true">·</span> {event.location}
                    </div>
                    <div className="text-xs/6 text-zinc-600">
                      {event.ticketsSold}/{event.ticketsAvailable} tickets sold
                    </div> */}
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-4">
                  <Badge className="max-sm:hidden" color={event.status === 'On Sale' ? 'lime' : 'zinc'}>
                    {event.status}
                  </Badge>
                  <Dropdown>
                    <DropdownButton plain aria-label="More options">
                      <EllipsisVerticalIcon />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end">
                      <DropdownItem href={event.url}>View</DropdownItem>
                      <DropdownItem>Edit</DropdownItem>
                      <DropdownItem>Delete</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div> */}
                </div>
              </li>
            </>
          ))}
        </ul>
      ) : (
        <>
          <Divider className="mt-2 mb-4" />
          <Text className="italic">
            Er zijn nog geen personen aan jouw account gekoppeld. Neem contact
            op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar de cursus is gevolgd.
          </Text>
        </>
      )}
    </div>
  );
}

async function InstructionLocations() {
  const persons = await listPersonsForUser();

  if (persons.length < 1) return null;

  const loctions = await listLocationsForPerson();

  return (
    <div className="my-6">
      <Subheading>Vaarlocaties waar jij lesgeeft</Subheading>
      <Divider soft />
    </div>
  );
}

export default function Page() {
  return (
    <div className="p-4 max-w-prose mx-auto">
      <Heading>Welkom Maurits!</Heading>

      <Text>
        Dit is jouw NWD-omgeving. Aan jouw account zijn cursisten gekoppeld, die
        NWD-cursussen volgen. Zie je hier niet de cursisten die je verwacht?
        Neem dan contact op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar de cursus is gevolgd.
      </Text>

      <Perons />

      {/* <InstructionLocations /> */}
    </div>
  );
}
