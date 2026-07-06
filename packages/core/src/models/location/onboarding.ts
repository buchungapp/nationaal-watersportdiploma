import { schema as s } from "@nawadi/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.ts";
import { uuidSchema, withZod, wrapCommand } from "../../utils/index.ts";
import { User } from "../index.ts";
import { create as createLocation } from "./location.ts";

export const createForOnboarding = wrapCommand(
  "location.onboarding.create",
  withZod(
    z.object({
      handle: z
        .string()
        .trim()
        .toLowerCase()
        .min(3)
        .regex(/^[a-z0-9-]+$/),
      name: z.string().trim().min(1),
      websiteUrl: z.string().url().optional(),
    }),
    z.object({ id: uuidSchema }),
    async (input) => {
      const query = useQuery();

      const existing = await query
        .select({ id: s.location.id })
        .from(s.location)
        .where(eq(s.location.handle, input.handle))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          "Deze handle is al in gebruik — kies een andere handle",
        );
      }

      return createLocation({
        handle: input.handle,
        name: input.name,
        websiteUrl: input.websiteUrl,
      });
    },
  ),
);

export const linkLocationAdmin = wrapCommand(
  "location.onboarding.linkLocationAdmin",
  withZod(
    z.object({ personId: uuidSchema, locationId: uuidSchema }),
    z.void(),
    async (input) => {
      await User.Person.ensureLocationLinkForAdmin({
        personId: input.personId,
        locationId: input.locationId,
      });

      await User.Actor.upsert({
        personId: input.personId,
        locationId: input.locationId,
        type: "location_admin",
      });
    },
  ),
);

export const linkInstructor = wrapCommand(
  "location.onboarding.linkInstructor",
  withZod(
    z.object({ personId: uuidSchema, locationId: uuidSchema }),
    z.void(),
    async (input) => {
      await User.Person.linkToLocation({
        personId: input.personId,
        locationId: input.locationId,
      });

      await User.Actor.upsert({
        personId: input.personId,
        locationId: input.locationId,
        type: "instructor",
      });
    },
  ),
);

export const createPersonAndLinkInstructor = wrapCommand(
  "location.onboarding.createPersonAndLinkInstructor",
  withZod(
    z.object({
      locationId: uuidSchema,
      email: z.string().trim().toLowerCase().email().optional(),
      firstName: z.string().trim().min(1),
      lastNamePrefix: z.string().trim().nullable(),
      lastName: z.string().trim().min(1),
      dateOfBirth: z.string(),
      birthCity: z.string().trim().min(1),
      birthCountry: z.string().trim().min(2),
    }),
    z.object({ personId: uuidSchema }),
    async (input) => {
      let userId: string | undefined;

      if (input.email) {
        const user = await User.getOrCreateFromEmail({
          email: input.email,
          displayName: input.firstName,
        });
        userId = user.id;
      }

      const person = await User.Person.getOrCreate({
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        lastNamePrefix: input.lastNamePrefix,
        dateOfBirth: input.dateOfBirth,
        birthCity: input.birthCity,
        birthCountry: input.birthCountry,
      });

      await User.Person.linkToLocation({
        personId: person.id,
        locationId: input.locationId,
      });

      await User.Actor.upsert({
        personId: person.id,
        locationId: input.locationId,
        type: "instructor",
      });

      return { personId: person.id };
    },
  ),
);
