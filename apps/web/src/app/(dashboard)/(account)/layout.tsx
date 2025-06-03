import { LifebuoyIcon } from "@heroicons/react/16/solid";
import Logo from "~/app/_components/brand/logo";
import { Link } from "../_components/link";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../_components/navbar";
import { StackedLayout } from "../_components/stacked-layout";

export default function Layout({
  children,
  selector,
}: Readonly<{
  children: React.ReactNode;
  selector: React.ReactNode;
}>) {
  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Link href="/" target="_blank">
            <Logo className="size-8 text-white" />
          </Link>

          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/help" className="max-lg:hidden">
              <LifebuoyIcon />
              Helpcentrum
            </NavbarItem>
            {selector}
          </NavbarSection>
        </Navbar>
      }
      sidebar={null}
    >
      {children}
    </StackedLayout>
  );
}
