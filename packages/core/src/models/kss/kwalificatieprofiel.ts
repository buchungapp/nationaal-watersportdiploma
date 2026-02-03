import { schema as s } from "@nawadi/db";
import { and, eq, inArray, type SQLWrapper } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import {
  createBeoordelingscriteriumOutputSchema,
  createBeoordelingscriteriumSchema,
  createKerntaakOnderdeelOutputSchema,
  createKerntaakOnderdeelSchema,
  createKerntaakOutputSchema,
  createKerntaakSchema,
  createKwalificatieprofielOutputSchema,
  createKwalificatieprofielSchema,
  createWerkprocesOutputSchema,
  createWerkprocesSchema,
  deleteBeoordelingscriteriumOutputSchema,
  deleteBeoordelingscriteriumSchema,
  deleteKerntaakOnderdeelOutputSchema,
  deleteKerntaakOnderdeelSchema,
  deleteKerntaakOutputSchema,
  deleteKerntaakSchema,
  deleteKwalificatieprofielOutputSchema,
  deleteKwalificatieprofielSchema,
  deleteWerkprocesOutputSchema,
  deleteWerkprocesSchema,
  kwalificatieprofielOutputSchema,
  kwalificatieprofielWithOnderdelenOutputSchema,
  listKwalificatieprofielenSchema,
  niveauOutputSchema,
  updateBeoordelingscriteriumOutputSchema,
  updateBeoordelingscriteriumSchema,
  updateKerntaakOutputSchema,
  updateKerntaakSchema,
  updateKwalificatieprofielOutputSchema,
  updateKwalificatieprofielSchema,
  updateWerkprocesOutputSchema,
  updateWerkprocesSchema,
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
        .orderBy(s.kerntaak.rang);

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

      // Sort kwalificatieprofielen by niveau rang, and kerntaken within each by their rang
      return Object.values(groupedResults)
        .map((profile) => ({
          ...profile,
          kerntaken: profile.kerntaken.sort((a, b) => {
            // Sort by rang first (nulls last)
            if (a.rang === null && b.rang === null) return 0;
            if (a.rang === null) return 1;
            if (b.rang === null) return -1;
            return a.rang - b.rang;
          }),
        }))
        .sort((a, b) => a.niveau.rang - b.niveau.rang);
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

export const getKerntaakById = wrapQuery(
  "kss.kerntaak.byId",
  withZod(
    z.object({
      kerntaakId: uuidSchema,
    }),
    z
      .object({
        id: uuidSchema,
        titel: z.string(),
        type: z.enum(s.kerntaak.type.enumValues),
        rang: z.number().nullable(),
        kwalificatieprofielId: uuidSchema,
      })
      .nullable(),
    async ({ kerntaakId }) => {
      const query = useQuery();

      const row = await query
        .select({
          id: s.kerntaak.id,
          titel: s.kerntaak.titel,
          type: s.kerntaak.type,
          rang: s.kerntaak.rang,
          kwalificatieprofielId: s.kerntaak.kwalificatieprofielId,
        })
        .from(s.kerntaak)
        .where(eq(s.kerntaak.id, kerntaakId))
        .then((res) => possibleSingleRow(res) ?? null);

      return row;
    },
  ),
);

export const listWerkprocessen = wrapQuery(
  "kss.werkproces.list",
  withZod(
    z.object({
      kerntaakId: uuidSchema,
    }),
    z.array(
      z.object({
        id: uuidSchema,
        titel: z.string(),
        resultaat: z.string(),
        rang: z.number(),
        kerntaakId: uuidSchema,
      }),
    ),
    async ({ kerntaakId }) => {
      const query = useQuery();

      const rows = await query
        .select({
          id: s.werkproces.id,
          titel: s.werkproces.titel,
          resultaat: s.werkproces.resultaat,
          rang: s.werkproces.rang,
          kerntaakId: s.werkproces.kerntaakId,
        })
        .from(s.werkproces)
        .where(eq(s.werkproces.kerntaakId, kerntaakId))
        .orderBy(s.werkproces.rang);

      return rows;
    },
  ),
);

export const listBeoordelingscriteria = wrapQuery(
  "kss.beoordelingscriterium.list",
  withZod(
    z.object({
      werkprocesId: uuidSchema,
    }),
    z.array(
      z.object({
        id: uuidSchema,
        title: z.string(),
        omschrijving: z.string(),
        rang: z.number(),
        werkprocesId: uuidSchema,
        kerntaakId: uuidSchema,
      }),
    ),
    async ({ werkprocesId }) => {
      const query = useQuery();

      const rows = await query
        .select({
          id: s.beoordelingscriterium.id,
          title: s.beoordelingscriterium.title,
          omschrijving: s.beoordelingscriterium.omschrijving,
          rang: s.beoordelingscriterium.rang,
          werkprocesId: s.beoordelingscriterium.werkprocesId,
          kerntaakId: s.beoordelingscriterium.kerntaakId,
        })
        .from(s.beoordelingscriterium)
        .where(eq(s.beoordelingscriterium.werkprocesId, werkprocesId))
        .orderBy(s.beoordelingscriterium.rang);

      return rows;
    },
  ),
);

// Mutation handlers

export const create = wrapCommand(
  "kss.kwalificatieprofiel.create",
  withZod(
    createKwalificatieprofielSchema,
    createKwalificatieprofielOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate niveau exists
        const niveauResult = await tx
          .select({ id: s.niveau.id })
          .from(s.niveau)
          .where(eq(s.niveau.id, input.niveauId));

        if (niveauResult.length === 0) {
          throw new Error("Opgegeven niveau bestaat niet");
        }

        // Create kwalificatieprofiel
        const result = await tx
          .insert(s.kwalificatieprofiel)
          .values({
            titel: input.titel,
            richting: input.richting,
            niveauId: input.niveauId,
          })
          .returning({ id: s.kwalificatieprofiel.id });

        return singleRow(result);
      });
    },
  ),
);

export const update = wrapCommand(
  "kss.kwalificatieprofiel.update",
  withZod(
    updateKwalificatieprofielSchema,
    updateKwalificatieprofielOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate kwalificatieprofiel exists
        const existing = await tx
          .select({ id: s.kwalificatieprofiel.id })
          .from(s.kwalificatieprofiel)
          .where(eq(s.kwalificatieprofiel.id, input.id));

        if (existing.length === 0) {
          throw new Error("Kwalificatieprofiel niet gevonden");
        }

        // If updating niveau, validate it exists
        if (input.niveauId) {
          const niveauResult = await tx
            .select({ id: s.niveau.id })
            .from(s.niveau)
            .where(eq(s.niveau.id, input.niveauId));

          if (niveauResult.length === 0) {
            throw new Error("Opgegeven niveau bestaat niet");
          }
        }

        // Update kwalificatieprofiel
        const updateData: Partial<{
          titel: string;
          richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
          niveauId: string;
        }> = {};

        if (input.titel !== undefined) updateData.titel = input.titel;
        if (input.richting !== undefined) updateData.richting = input.richting;
        if (input.niveauId !== undefined) updateData.niveauId = input.niveauId;

        await tx
          .update(s.kwalificatieprofiel)
          .set(updateData)
          .where(eq(s.kwalificatieprofiel.id, input.id));

        return { success: true };
      });
    },
  ),
);

export const remove = wrapCommand(
  "kss.kwalificatieprofiel.delete",
  withZod(
    deleteKwalificatieprofielSchema,
    deleteKwalificatieprofielOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Check if kwalificatieprofiel has kerntaken
        const kerntaken = await tx
          .select({ id: s.kerntaak.id })
          .from(s.kerntaak)
          .where(eq(s.kerntaak.kwalificatieprofielId, input.id))
          .limit(1);

        if (kerntaken.length > 0) {
          throw new Error(
            "Kwalificatieprofiel kan niet verwijderd worden omdat er kerntaken aan gekoppeld zijn",
          );
        }

        // Delete kwalificatieprofiel
        await tx
          .delete(s.kwalificatieprofiel)
          .where(eq(s.kwalificatieprofiel.id, input.id));

        return { success: true };
      });
    },
  ),
);

// Kerntaak mutations

export const createKerntaak = wrapCommand(
  "kss.kerntaak.create",
  withZod(createKerntaakSchema, createKerntaakOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // Validate kwalificatieprofiel exists
      const kwalificatieprofielResult = await tx
        .select({ id: s.kwalificatieprofiel.id })
        .from(s.kwalificatieprofiel)
        .where(eq(s.kwalificatieprofiel.id, input.kwalificatieprofielId));

      if (kwalificatieprofielResult.length === 0) {
        throw new Error("Opgegeven kwalificatieprofiel bestaat niet");
      }

      // Create kerntaak
      const result = await tx
        .insert(s.kerntaak)
        .values({
          kwalificatieprofielId: input.kwalificatieprofielId,
          titel: input.titel,
          type: input.type,
          rang: input.rang ?? null,
        })
        .returning({ id: s.kerntaak.id });

      return singleRow(result);
    });
  }),
);

export const updateKerntaak = wrapCommand(
  "kss.kerntaak.update",
  withZod(updateKerntaakSchema, updateKerntaakOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // Validate kerntaak exists
      const existing = await tx
        .select({ id: s.kerntaak.id })
        .from(s.kerntaak)
        .where(eq(s.kerntaak.id, input.id));

      if (existing.length === 0) {
        throw new Error("Kerntaak niet gevonden");
      }

      // Update kerntaak
      const updateData: Partial<{
        titel: string;
        type: "verplicht" | "facultatief";
        rang: number | null;
      }> = {};

      if (input.titel !== undefined) updateData.titel = input.titel;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.rang !== undefined) updateData.rang = input.rang;

      await tx
        .update(s.kerntaak)
        .set(updateData)
        .where(eq(s.kerntaak.id, input.id));

      return { success: true };
    });
  }),
);

export const deleteKerntaak = wrapCommand(
  "kss.kerntaak.delete",
  withZod(deleteKerntaakSchema, deleteKerntaakOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // Check if kerntaak has onderdelen or werkprocessen
      const [onderdelen, werkprocessen] = await Promise.all([
        tx
          .select({ id: s.kerntaakOnderdeel.id })
          .from(s.kerntaakOnderdeel)
          .where(eq(s.kerntaakOnderdeel.kerntaakId, input.id))
          .limit(1),
        tx
          .select({ id: s.werkproces.id })
          .from(s.werkproces)
          .where(eq(s.werkproces.kerntaakId, input.id))
          .limit(1),
      ]);

      if (onderdelen.length > 0) {
        throw new Error(
          "Kerntaak kan niet verwijderd worden omdat er onderdelen aan gekoppeld zijn",
        );
      }

      if (werkprocessen.length > 0) {
        throw new Error(
          "Kerntaak kan niet verwijderd worden omdat er werkprocessen aan gekoppeld zijn",
        );
      }

      // Delete kerntaak
      await tx.delete(s.kerntaak).where(eq(s.kerntaak.id, input.id));

      return { success: true };
    });
  }),
);

// Kerntaak onderdeel mutations

export const createKerntaakOnderdeel = wrapCommand(
  "kss.kerntaakOnderdeel.create",
  withZod(
    createKerntaakOnderdeelSchema,
    createKerntaakOnderdeelOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate kerntaak exists
        const kerntaakResult = await tx
          .select({ id: s.kerntaak.id })
          .from(s.kerntaak)
          .where(eq(s.kerntaak.id, input.kerntaakId));

        if (kerntaakResult.length === 0) {
          throw new Error("Opgegeven kerntaak bestaat niet");
        }

        // Create kerntaak onderdeel
        const result = await tx
          .insert(s.kerntaakOnderdeel)
          .values({
            kerntaakId: input.kerntaakId,
            type: input.type,
          })
          .returning({ id: s.kerntaakOnderdeel.id });

        return singleRow(result);
      });
    },
  ),
);

export const deleteKerntaakOnderdeel = wrapCommand(
  "kss.kerntaakOnderdeel.delete",
  withZod(
    deleteKerntaakOnderdeelSchema,
    deleteKerntaakOnderdeelOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Check if onderdeel is used in any PVB
        const pvbOnderdelen = await tx
          .select({ id: s.pvbOnderdeel.id })
          .from(s.pvbOnderdeel)
          .where(eq(s.pvbOnderdeel.kerntaakOnderdeelId, input.id))
          .limit(1);

        if (pvbOnderdelen.length > 0) {
          throw new Error(
            "Kerntaak onderdeel kan niet verwijderd worden omdat het gebruikt wordt in PVB aanvragen",
          );
        }

        // Delete kerntaak onderdeel
        await tx
          .delete(s.kerntaakOnderdeel)
          .where(eq(s.kerntaakOnderdeel.id, input.id));

        return { success: true };
      });
    },
  ),
);

// Werkproces mutations

export const createWerkproces = wrapCommand(
  "kss.werkproces.create",
  withZod(
    createWerkprocesSchema,
    createWerkprocesOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate kerntaak exists
        const kerntaakResult = await tx
          .select({ id: s.kerntaak.id })
          .from(s.kerntaak)
          .where(eq(s.kerntaak.id, input.kerntaakId));

        if (kerntaakResult.length === 0) {
          throw new Error("Opgegeven kerntaak bestaat niet");
        }

        // Create werkproces
        const result = await tx
          .insert(s.werkproces)
          .values({
            kerntaakId: input.kerntaakId,
            titel: input.titel,
            resultaat: input.resultaat,
            rang: input.rang,
          })
          .returning({ id: s.werkproces.id });

        return singleRow(result);
      });
    },
  ),
);

export const updateWerkproces = wrapCommand(
  "kss.werkproces.update",
  withZod(
    updateWerkprocesSchema,
    updateWerkprocesOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate werkproces exists
        const existing = await tx
          .select({ id: s.werkproces.id })
          .from(s.werkproces)
          .where(eq(s.werkproces.id, input.id));

        if (existing.length === 0) {
          throw new Error("Werkproces niet gevonden");
        }

        // Update werkproces
        const updateData: Partial<{
          titel: string;
          resultaat: string;
          rang: number;
        }> = {};

        if (input.titel !== undefined) updateData.titel = input.titel;
        if (input.resultaat !== undefined)
          updateData.resultaat = input.resultaat;
        if (input.rang !== undefined) updateData.rang = input.rang;

        await tx
          .update(s.werkproces)
          .set(updateData)
          .where(eq(s.werkproces.id, input.id));

        return { success: true };
      });
    },
  ),
);

export const deleteWerkproces = wrapCommand(
  "kss.werkproces.delete",
  withZod(
    deleteWerkprocesSchema,
    deleteWerkprocesOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Check if werkproces has beoordelingscriteria
        const criteria = await tx
          .select({ id: s.beoordelingscriterium.id })
          .from(s.beoordelingscriterium)
          .where(eq(s.beoordelingscriterium.werkprocesId, input.id))
          .limit(1);

        if (criteria.length > 0) {
          throw new Error(
            "Werkproces kan niet verwijderd worden omdat er beoordelingscriteria aan gekoppeld zijn",
          );
        }

        // Delete werkproces
        await tx.delete(s.werkproces).where(eq(s.werkproces.id, input.id));

        return { success: true };
      });
    },
  ),
);

// Beoordelingscriterium mutations

export const createBeoordelingscriterium = wrapCommand(
  "kss.beoordelingscriterium.create",
  withZod(
    createBeoordelingscriteriumSchema,
    createBeoordelingscriteriumOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate werkproces exists and get kerntaakId
        const werkprocesResult = await tx
          .select({
            id: s.werkproces.id,
            kerntaakId: s.werkproces.kerntaakId,
          })
          .from(s.werkproces)
          .where(eq(s.werkproces.id, input.werkprocesId));

        if (werkprocesResult.length === 0) {
          throw new Error("Opgegeven werkproces bestaat niet");
        }

        const werkproces = singleRow(werkprocesResult);

        // Create beoordelingscriterium
        const result = await tx
          .insert(s.beoordelingscriterium)
          .values({
            werkprocesId: input.werkprocesId,
            kerntaakId: werkproces.kerntaakId,
            title: input.title,
            omschrijving: input.omschrijving,
            rang: input.rang ?? 1, // Default to 1 if not provided, since it's required
          })
          .returning({ id: s.beoordelingscriterium.id });

        return singleRow(result);
      });
    },
  ),
);

export const updateBeoordelingscriterium = wrapCommand(
  "kss.beoordelingscriterium.update",
  withZod(
    updateBeoordelingscriteriumSchema,
    updateBeoordelingscriteriumOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate beoordelingscriterium exists
        const existing = await tx
          .select({ id: s.beoordelingscriterium.id })
          .from(s.beoordelingscriterium)
          .where(eq(s.beoordelingscriterium.id, input.id));

        if (existing.length === 0) {
          throw new Error("Beoordelingscriterium niet gevonden");
        }

        // Update beoordelingscriterium
        const updateData: Partial<{
          title: string;
          omschrijving: string;
          rang: number;
        }> = {};

        if (input.title !== undefined) updateData.title = input.title;
        if (input.omschrijving !== undefined)
          updateData.omschrijving = input.omschrijving;
        if (input.rang !== undefined && input.rang !== null)
          updateData.rang = input.rang;

        await tx
          .update(s.beoordelingscriterium)
          .set(updateData)
          .where(eq(s.beoordelingscriterium.id, input.id));

        return { success: true };
      });
    },
  ),
);

export const deleteBeoordelingscriterium = wrapCommand(
  "kss.beoordelingscriterium.delete",
  withZod(
    deleteBeoordelingscriteriumSchema,
    deleteBeoordelingscriteriumOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Delete beoordelingscriterium
        await tx
          .delete(s.beoordelingscriterium)
          .where(eq(s.beoordelingscriterium.id, input.id));

        return { success: true };
      });
    },
  ),
);

// Werkproces-Onderdeel relationship handlers

export const assignWerkprocesToOnderdeel = wrapCommand(
  "kss.werkproces.assignToOnderdeel",
  withZod(
    z.object({
      kerntaakOnderdeelId: uuidSchema,
      werkprocesIds: z.array(uuidSchema),
    }),
    z.object({ success: z.boolean() }),
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate kerntaakOnderdeel exists and get kerntaakId
        const onderdeelResult = await tx
          .select({
            id: s.kerntaakOnderdeel.id,
            kerntaakId: s.kerntaakOnderdeel.kerntaakId,
          })
          .from(s.kerntaakOnderdeel)
          .where(eq(s.kerntaakOnderdeel.id, input.kerntaakOnderdeelId));

        if (onderdeelResult.length === 0) {
          throw new Error("Opgegeven kerntaak onderdeel bestaat niet");
        }

        const onderdeel = singleRow(onderdeelResult);

        // Validate all werkprocessen exist and belong to the same kerntaak
        if (input.werkprocesIds.length > 0) {
          const werkprocessenResult = await tx
            .select({
              id: s.werkproces.id,
              kerntaakId: s.werkproces.kerntaakId,
            })
            .from(s.werkproces)
            .where(
              and(
                inArray(s.werkproces.id, input.werkprocesIds),
                eq(s.werkproces.kerntaakId, onderdeel.kerntaakId),
              ),
            );

          if (werkprocessenResult.length !== input.werkprocesIds.length) {
            throw new Error(
              "Een of meer werkprocessen bestaan niet of behoren niet tot dezelfde kerntaak als het onderdeel",
            );
          }
        }

        // Remove existing assignments for this onderdeel
        await tx
          .delete(s.werkprocesKerntaakOnderdeel)
          .where(
            eq(
              s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
              input.kerntaakOnderdeelId,
            ),
          );

        // Insert new assignments
        if (input.werkprocesIds.length > 0) {
          await tx.insert(s.werkprocesKerntaakOnderdeel).values(
            input.werkprocesIds.map((werkprocesId) => ({
              werkprocesId,
              kerntaakOnderdeelId: input.kerntaakOnderdeelId,
              kerntaakId: onderdeel.kerntaakId,
            })),
          );
        }

        return { success: true };
      });
    },
  ),
);

export const removeWerkprocesFromOnderdeel = wrapCommand(
  "kss.werkproces.removeFromOnderdeel",
  withZod(
    z.object({
      kerntaakOnderdeelId: uuidSchema,
      werkprocesId: uuidSchema,
    }),
    z.object({ success: z.boolean() }),
    async (input) => {
      const query = useQuery();

      await query
        .delete(s.werkprocesKerntaakOnderdeel)
        .where(
          and(
            eq(
              s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
              input.kerntaakOnderdeelId,
            ),
            eq(s.werkprocesKerntaakOnderdeel.werkprocesId, input.werkprocesId),
          ),
        );

      return { success: true };
    },
  ),
);

export const listWerkprocessenByOnderdeel = wrapQuery(
  "kss.werkproces.listByOnderdeel",
  withZod(
    z.object({
      kerntaakOnderdeelId: uuidSchema,
    }),
    z.array(
      z.object({
        id: uuidSchema,
        titel: z.string(),
        resultaat: z.string(),
        rang: z.number(),
        kerntaakId: uuidSchema,
      }),
    ),
    async ({ kerntaakOnderdeelId }) => {
      const query = useQuery();

      const rows = await query
        .select({
          id: s.werkproces.id,
          titel: s.werkproces.titel,
          resultaat: s.werkproces.resultaat,
          rang: s.werkproces.rang,
          kerntaakId: s.werkproces.kerntaakId,
        })
        .from(s.werkproces)
        .innerJoin(
          s.werkprocesKerntaakOnderdeel,
          and(
            eq(s.werkprocesKerntaakOnderdeel.werkprocesId, s.werkproces.id),
            eq(
              s.werkprocesKerntaakOnderdeel.kerntaakId,
              s.werkproces.kerntaakId,
            ),
          ),
        )
        .where(
          eq(
            s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
            kerntaakOnderdeelId,
          ),
        )
        .orderBy(s.werkproces.rang);

      return rows;
    },
  ),
);
