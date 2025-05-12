import { Suspense } from "react";
import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "~/app/(dashboard)/_components/sidebar";
import { listRolesForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import { LocationSidebarMenuClient } from "./sidebar-menu-client";

async function LocationSidebarMenuContent(props: {
  params: Promise<{
    location: string;
  }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const rolesForPerson = await listRolesForLocation(location.id);

  return <LocationSidebarMenuClient personRoles={rolesForPerson} />;
}

function LocationSidebarMenuFallback() {
  return (
    <SidebarSection>
      {[1, 2].map((i) => (
        <SidebarItem key={`sidebar-menu-fallback-${i}`} href="#" disabled>
          <div
            data-slot="icon"
            className="bg-gray-300 rounded animate-pulse"
            style={{
              animationDelay: `${i * 0.3}s`,
            }}
          />
          <SidebarLabel className="w-full">
            <span
              className="inline-block bg-gray-300 rounded w-full h-4.5 align-middle animate-pulse"
              style={{
                animationDelay: `${i * 0.3 + 0.1}s`,
              }}
            />
          </SidebarLabel>
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}

export function LocationSidebarMenu(props: {
  params: Promise<{
    location: string;
  }>;
}) {
  return (
    <Suspense fallback={<LocationSidebarMenuFallback />}>
      <LocationSidebarMenuContent params={props.params} />
    </Suspense>
  );
}
