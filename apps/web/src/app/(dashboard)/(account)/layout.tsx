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

export const dynamic = "force-dynamic";

export default function Layout({
  children,
  selector,
  dashboard,
}: Readonly<{
  children: React.ReactNode;
  selector: React.ReactNode;
  dashboard: React.ReactNode;
}>) {
  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Link href="/profiel?_cacheBust=1">
            <Logo className="size-8 text-white" />
          </Link>

          {dashboard}

          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem
              href="/help/categorie/app-consumenten"
              className="max-lg:hidden"
            >
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
