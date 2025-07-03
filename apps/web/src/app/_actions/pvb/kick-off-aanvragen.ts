"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

// TODO: Import from PVB core model once implemented
// import { Pvb } from "@nawadi/core";

const KickOffAanvragenSchema = z.object({
  pvbIds: z.array(z.string().uuid()),
  locationHandle: z.string(),
});

export async function kickOffPvbAanvragen(
  data: z.infer<typeof KickOffAanvragenSchema>,
) {
  try {
    const validatedData = KickOffAanvragenSchema.parse(data);

    // TODO: Replace with actual PVB kick off calls
    // const results = await Promise.all(
    //   validatedData.pvbIds.map(id => Pvb.kickOffAanvraag(id))
    // );

    console.log("Kicking off PVB aanvragen:", validatedData);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    revalidatePath(`/locatie/${validatedData.locationHandle}/pvb-aanvragen`);

    return { success: true };
  } catch (error) {
    console.error("Error kicking off PVB aanvragen:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
