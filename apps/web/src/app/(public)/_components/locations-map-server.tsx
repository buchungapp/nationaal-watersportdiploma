import type { PropsWithChildren } from "react";
import type { Location } from "../vaarlocaties/_lib/retrieve-locations";
import { SelectedLocationProvider } from "./locations-map";

export async function SelectedLocationProviderServer({
  children,
  locationPromise,
}: PropsWithChildren<{ locationPromise: Promise<Location[]> }>) {
  const locations = await locationPromise;
  return (
    <SelectedLocationProvider locations={locations}>
      {children}
    </SelectedLocationProvider>
  );
}
