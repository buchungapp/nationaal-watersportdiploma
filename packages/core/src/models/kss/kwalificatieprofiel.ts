import { schema as s } from "@nawadi/db";
import { type SQLWrapper, and, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  possibleSingleRow,
  uuidSchema,
  withZod,
  wrapQuery,
} from "../../utils/index.js";
import {
  kwalificatieprofielOutputSchema,
  listKwalificatieprofielenSchema,
} from "./kwalificatieprofiel.schema.js";

export const list = wrapQuery(
  "kss.kwalificatieprofiel.list",
  withZod(
    listKwalificatieprofielenSchema,
    kwalificatieprofielOutputSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClausules: SQLWrapper[] = [];

      if (filter.id) {
        whereClausules.push(eq(s.kwalificatieprofiel.id, filter.id));
      }

      if (filter.richting) {
        whereClausules.push(
          eq(s.kwalificatieprofiel.richting, filter.richting),
        );
      }

      if (filter.niveauId) {
        whereClausules.push(
          eq(s.kwalificatieprofiel.niveauId, filter.niveauId),
        );
      }

      // Query kwalificatieprofielen with their niveau information
      const rows = await query
        .select({
          id: s.kwalificatieprofiel.id,
          titel: s.kwalificatieprofiel.titel,
          richting: s.kwalificatieprofiel.richting,
          niveau: {
            id: s.niveau.id,
            rang: s.niveau.rang,
          },
        })
        .from(s.kwalificatieprofiel)
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
        .where(and(...whereClausules))
        .orderBy(s.niveau.rang, s.kwalificatieprofiel.titel);

      return rows;
    },
  ),
);

export const byId = wrapQuery(
  "kss.kwalificatieprofiel.byId",
  withZod(
    z.object({
      id: uuidSchema,
    }),
    kwalificatieprofielOutputSchema.nullable(),
    async ({ id }) => {
      const query = useQuery();

      const row = await query
        .select({
          id: s.kwalificatieprofiel.id,
          titel: s.kwalificatieprofiel.titel,
          richting: s.kwalificatieprofiel.richting,
          niveau: {
            id: s.niveau.id,
            rang: s.niveau.rang,
          },
        })
        .from(s.kwalificatieprofiel)
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
        .where(eq(s.kwalificatieprofiel.id, id))
        .then((res) => possibleSingleRow(res) ?? null);

      return row;
    },
  ),
);
