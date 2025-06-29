import { schema as s } from "@nawadi/db";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { singleRow, withZod, wrapCommand } from "../../utils/index.js";

export * as Aanvraag from "./aanvraag.js";
export * as Beoordeling from "./beoordeling.js";

// Log a general PvB event
export const logPvbEvent = wrapCommand(
  "pvb.logEvent",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      pvbOnderdeelId: z.string().uuid().optional(),
      gebeurtenisType: z.enum([
        "aanvraag_ingediend",
        "leercoach_toestemming_gevraagd",
        "leercoach_toestemming_gegeven",
        "leercoach_toestemming_geweigerd",
        "voorwaarden_voltooid",
        "beoordeling_gestart",
        "beoordeling_afgerond",
        "aanvraag_ingetrokken",
        "onderdeel_toegevoegd",
        "onderdeel_beoordelaar_gewijzigd",
        "onderdeel_uitslag_gewijzigd",
      ]),
      data: z.record(z.any()).optional(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
      opmerkingen: z.string().optional(),
    }),
    z.object({
      id: z.string().uuid(),
    }),
    async (input) => {
      const query = useQuery();

      // Create the event
      const createdEvents = await query
        .insert(s.pvbGebeurtenis)
        .values({
          pvbAanvraagId: input.pvbAanvraagId,
          pvbOnderdeelId: input.pvbOnderdeelId,
          gebeurtenisType: input.gebeurtenisType,
          data: input.data,
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden,
          opmerkingen: input.opmerkingen,
        })
        .returning({ id: s.pvbGebeurtenis.id });

      const event = singleRow(createdEvents);

      return {
        id: event.id,
      };
    },
  ),
);
