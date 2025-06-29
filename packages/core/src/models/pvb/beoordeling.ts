import { schema as s } from "@nawadi/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { singleRow } from "../../utils/data-helpers.js";
import { withZod, wrapCommand } from "../../utils/index.js";

import { logPvbEvent } from "./index.js";

// Start the assessment (transition to in_beoordeling)
export const startBeoordeling = wrapCommand(
  "pvb.startBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current status
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "gereed_voor_beoordeling") {
        throw new Error(
          "Alleen aanvragen die gereed zijn voor beoordeling kunnen worden gestart",
        );
      }

      // Update status to in_beoordeling
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "in_beoordeling",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling gestart",
      });

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "beoordeling_gestart",
        data: {
          gestartDoor: input.aangemaaktDoor,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling gestart",
      });

      return {
        success: true,
      };
    },
  ),
);

// Complete the assessment (transition to afgerond)
export const completeBeoordeling = wrapCommand(
  "pvb.completeBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current status
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "in_beoordeling") {
        throw new Error(
          "Alleen aanvragen die in beoordeling zijn kunnen worden afgerond",
        );
      }

      // Update status to afgerond
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "afgerond",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling afgerond",
      });

      // Log the completion event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "beoordeling_afgerond",
        data: {
          afgerondDoor: input.aangemaaktDoor,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling afgerond",
      });

      return {
        success: true,
      };
    },
  ),
);
