import { formatters } from "@nawadi/lib";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { Text } from "~/app/(dashboard)/_components/text";
import type { getPersonById } from "~/lib/nwd";

export function PersonHeader({
  person,
}: { person: NonNullable<Awaited<ReturnType<typeof getPersonById>>> }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        initials={(person.firstName ?? person.email).slice(0, 2)}
        square
        className="bg-zinc-900 size-10 text-white shrink-0"
      />
      <div className="flex flex-col gap-0.5">
        <Text className="font-medium text-zinc-950 leading-none!">
          {formatters.formatPersonName(person)}
        </Text>
        <Text className="leading-none!">{person.email}</Text>
      </div>
    </div>
  );
}
