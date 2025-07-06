import { schema as s } from "@nawadi/db";
import {
  type SQL,
  and,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  possibleSingleRow,
  singleOrArray,
  uuidSchema,
  withZod,
  wrapQuery,
} from "../../utils/index.js";

export const list = wrapQuery(
  "location.person.list",
  withZod(
    z.object({
      locationId: uuidSchema,
      filter: z
        .object({
          type: singleOrArray(
            z.enum([
              "student",
              "instructor",
              "location_admin",
              "pvb_beoordelaar",
            ]),
          ).optional(),
        })
        .default({}),
    }),
    async (input) => {
      const query = useQuery();

      const conditions: SQL[] = [];

      const existsQuery = query
        .select({ personId: s.personLocationLink.personId })
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.locationId, input.locationId),
            eq(s.personLocationLink.status, "linked"),
            eq(s.personLocationLink.personId, s.person.id),
          ),
        );
      conditions.push(exists(existsQuery));

      return await query
        .select({
          ...getTableColumns(s.person),
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
          actor: s.actor,
        })
        .from(s.person)
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            eq(s.actor.locationId, input.locationId),
            input.filter.type
              ? Array.isArray(input.filter.type)
                ? inArray(s.actor.type, input.filter.type)
                : eq(s.actor.type, input.filter.type)
              : undefined,
          ),
        )
        .where(and(...conditions))
        .then(aggregate({ pkey: "id", fields: { actors: "actor.id" } }));
    },
  ),
);

export const getActorByPersonIdAndType = wrapQuery(
  "location.person.getActorByPersonIdAndType",
  withZod(
    z.object({
      locationId: uuidSchema,
      personId: uuidSchema,
      actorType: z.enum([
        "student",
        "instructor",
        "location_admin",
        "pvb_beoordelaar",
      ]),
    }),
    async (input) => {
      const query = useQuery();

      const actor = await query
        .select({ id: s.actor.id })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.locationId, input.locationId),
            eq(s.actor.personId, input.personId),
            eq(s.actor.type, input.actorType),
            isNull(s.actor.deletedAt),
          ),
        )
        .then(possibleSingleRow);

      return actor;
    },
  ),
);
