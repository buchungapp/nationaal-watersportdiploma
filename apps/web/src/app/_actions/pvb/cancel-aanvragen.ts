"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

// TODO: Import from PVB core model once implemented
// import { Pvb } from "@nawadi/core";

const CancelAanvragenSchema = z.object({
  pvbIds: z.array(z.string().uuid()),
  locationHandle: z.string(),
});

export async function cancelPvbAanvragen(
  data: z.infer<typeof CancelAanvragenSchema>,
) {
  try {
    const validatedData = CancelAanvragenSchema.parse(data);

    // TODO: Replace with actual PVB cancel calls
    // const results = await Promise.all(
    //   validatedData.pvbIds.map(id => Pvb.cancel(id))
    // );

    console.log("Canceling PVB aanvragen:", validatedData);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    revalidatePath(`/locatie/${validatedData.locationHandle}/pvb-aanvragen`);

    return { success: true };
  } catch (error) {
    console.error("Error canceling PVB aanvragen:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
