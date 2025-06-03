import {
  ArrowRightStartOnRectangleIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { connection } from "next/server";
import { type PropsWithChildren, Suspense } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import { LogOutDropdownItem } from "../../_components/auth";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../_components/dropdown";
import FeedbackDialog, {
  FeedbackProvider,
  FeedbackButton,
} from "../_components/feedback";
import { PersonItem } from "./_components/person-item";

async function PersonsDropdownMenu() {
  await connection();
  const { persons } = await getUserOrThrow();

  if (persons.length === 0) {
    return (
      <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom end">
        <DropdownItem disabled>
          <DropdownLabel>Geen personen beschikbaar.</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem href="/account">
          <UserIcon />
          <DropdownLabel>Mijn account</DropdownLabel>
        </DropdownItem>
        <LogOutDropdownItem>
          <ArrowRightStartOnRectangleIcon />
          <DropdownLabel>Uitloggen</DropdownLabel>
        </LogOutDropdownItem>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom end">
      {persons.map((person) => {
        return (
          <PersonItem
            key={person.id}
            handle={person.handle}
            name={[person.firstName, person.lastNamePrefix, person.lastName]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}
      <DropdownDivider />
      <FeedbackButton />
      <DropdownItem
        href="/help/categorie/app-consumenten"
        className="lg:hidden"
      >
        <LifebuoyIcon />
        <DropdownLabel>Helpcentrum</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/privacy">
        <ShieldCheckIcon />
        <DropdownLabel>Privacybeleid</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/account">
        <UserIcon />
        <DropdownLabel>Mijn account</DropdownLabel>
      </DropdownItem>
      <LogOutDropdownItem>
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Uitloggen</DropdownLabel>
      </LogOutDropdownItem>
    </DropdownMenu>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <FeedbackProvider>
      <Dropdown>
        {children}
        <Suspense fallback={null}>
          <PersonsDropdownMenu />
        </Suspense>
      </Dropdown>
      <FeedbackDialog />
    </FeedbackProvider>
  );
}
