import { uuidSchema } from "../../utils/index.js";

import { z } from "zod";

export const logbookSchema = z.object({
  id: uuidSchema,
  personId: uuidSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  departurePort: z.string().nullable(),
  arrivalPort: z.string().nullable(),
  windPower: z.number().nullable(),
  windDirection: z.string().nullable(),
  boatType: z.string().nullable(),
  boatLength: z.number().nullable(),
  location: z.string().nullable(),
  sailedNauticalMiles: z.number().nullable(),
  sailedHoursInDark: z.number().nullable(),
  primaryRole: z.string().nullable(),
  crewNames: z.string().nullable(),
  conditions: z.string().nullable(),
  additionalComments: z.string().nullable(),
});
