"use server";

import { revalidatePath } from "next/cache";
import type { ActorType } from "~/lib/nwd";
import { dropActorForLocation, upsertActorForLocation } from "~/lib/nwd";

export async function addActorToLocation(props: {
  locationId: string;
  personId: string;
  type: ActorType;
}) {
  await upsertActorForLocation(props);

  revalidatePath("/locatie/[location]/personen", "page");
  revalidatePath("/locatie/[location]/personen/[id]", "page");
}

export async function removeActorFromLocation(props: {
  locationId: string;
  personId: string;
  type: ActorType;
}) {
  await dropActorForLocation(props);

  revalidatePath("/locatie/[location]/personen", "page");
  revalidatePath("/locatie/[location]/personen/[id]", "page");
}
