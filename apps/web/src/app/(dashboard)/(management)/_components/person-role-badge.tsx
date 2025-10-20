import { Badge } from "~/app/(dashboard)/_components/badge";

type Role =
  | "student"
  | "instructor"
  | "location_admin"
  | "secretariaat"
  | "pvb_beoordelaar"
  | "system";

const dictionary: Record<Role, string> = {
  student: "Cursist",
  instructor: "Instructeur",
  location_admin: "Locatiebeheerder",
  secretariaat: "Secretariaat",
  pvb_beoordelaar: "PVB Beoordelaar",
  system: "Systeem",
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
  pvb_beoordelaar: "purple",
  system: "zinc",
} as const;

export default function PersonRoleBadge({ role }: { role: Role }) {
  return <Badge color={colors[role]}>{dictionary[role]}</Badge>;
}
