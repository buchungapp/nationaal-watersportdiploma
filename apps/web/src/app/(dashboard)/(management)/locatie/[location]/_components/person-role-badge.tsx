import { Badge } from "~/app/(dashboard)/_components/badge";

type Role =
  | "student"
  | "instructor"
  | "location_admin"
  | "secretariaat"
  | "system"
  | "pvb_beoordelaar";

const dictionary: Record<Role, string> = {
  student: "Cursist",
  instructor: "Instructeur",
  location_admin: "Locatiebeheerder",
  secretariaat: "Secretariaat",
  system: "Systeem",
  pvb_beoordelaar: "Interne beoordelaar",
} as const;

const colors: Record<
  Role,
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "indigo"
  | "violet"
  | "fuchsia"
  | "pink"
  | "rose"
  | "zinc"
  | undefined
> = {
  student: "blue",
  instructor: "green",
  location_admin: "purple",
  secretariaat: "yellow",
  system: "zinc",
  pvb_beoordelaar: "red",
} as const;

export default function PersonRoleBadge({ role }: { role: Role }) {
  return <Badge color={colors[role]}>{dictionary[role]}</Badge>;
}
