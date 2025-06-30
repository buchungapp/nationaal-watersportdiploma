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
  kwalificatieprofielWithOnderdelenOutputSchema,
  listKwalificatieprofielenSchema,
  niveauOutputSchema,
} from "./kwalificatieprofiel.schema.js";

export const listNiveaus = wrapQuery(
  "kss.kwalificatieprofiel.listNiveaus",
  withZod(z.object({}).default({}), niveauOutputSchema.array(), async () => {
    const query = useQuery();

    const rows = await query
      .select({
        id: s.niveau.id,
        rang: s.niveau.rang,
      })
      .from(s.niveau)
      .orderBy(s.niveau.rang);

    return rows;
  }),
);

export const listWithOnderdelen = wrapQuery(
  "kss.kwalificatieprofiel.listWithOnderdelen",
  withZod(
    z.object({
      niveauId: uuidSchema,
      richting: z.enum(s.richting.enumValues).optional(),
    }),
    kwalificatieprofielWithOnderdelenOutputSchema.array(),
    async ({ niveauId, richting }) => {
      const query = useQuery();

      const whereClausules: SQLWrapper[] = [
        eq(s.kwalificatieprofiel.niveauId, niveauId),
      ];

      if (richting) {
        whereClausules.push(eq(s.kwalificatieprofiel.richting, richting));
      }

      // Query kwalificatieprofielen with their kerntaken and onderdelen
      const rows = await query
        .select({
          kwalificatieprofiel: {
            id: s.kwalificatieprofiel.id,
            titel: s.kwalificatieprofiel.titel,
            richting: s.kwalificatieprofiel.richting,
          },
          niveau: {
            id: s.niveau.id,
            rang: s.niveau.rang,
          },
          kerntaak: {
            id: s.kerntaak.id,
            titel: s.kerntaak.titel,
            type: s.kerntaak.type,
            rang: s.kerntaak.rang,
          },
          kerntaakOnderdeel: {
            id: s.kerntaakOnderdeel.id,
            type: s.kerntaakOnderdeel.type,
          },
        })
        .from(s.kwalificatieprofiel)
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
        .leftJoin(
          s.kerntaak,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .leftJoin(
          s.kerntaakOnderdeel,
          eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
        )
        .where(and(...whereClausules))
        .orderBy(s.kwalificatieprofiel.titel, s.kerntaak.rang);

      // Group the results by kwalificatieprofiel
      type GroupedResult = z.infer<
        typeof kwalificatieprofielWithOnderdelenOutputSchema
      >;

      const groupedResults = rows.reduce(
        (acc, row) => {
          const { kwalificatieprofiel, niveau, kerntaak, kerntaakOnderdeel } =
            row;

          if (!acc[kwalificatieprofiel.id]) {
            acc[kwalificatieprofiel.id] = {
              ...kwalificatieprofiel,
              niveau,
              kerntaken: [],
            };
          }

          const currentProfile = acc[kwalificatieprofiel.id];
          if (!currentProfile) return acc;

          if (
            kerntaak &&
            !currentProfile.kerntaken.find((k) => k.id === kerntaak.id)
          ) {
            currentProfile.kerntaken.push({
              ...kerntaak,
              onderdelen: [],
            });
          }

          if (kerntaakOnderdeel && kerntaak) {
            const kerntaakIndex = currentProfile.kerntaken.findIndex(
              (k) => k.id === kerntaak.id,
            );
            if (kerntaakIndex !== -1) {
              const currentKerntaak = currentProfile.kerntaken[kerntaakIndex];
              if (
                currentKerntaak &&
                !currentKerntaak.onderdelen.find(
                  (o) => o.id === kerntaakOnderdeel.id,
                )
              ) {
                currentKerntaak.onderdelen.push(kerntaakOnderdeel);
              }
            }
          }

          return acc;
        },
        {} as Record<string, GroupedResult>,
      );

      return Object.values(groupedResults);
    },
  ),
);

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
