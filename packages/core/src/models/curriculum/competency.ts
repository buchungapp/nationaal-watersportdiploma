import { schema as s } from "@nawadi/db";
import { and, type SQL } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { singleRow } from "../../utils/data-helpers.js";
import {
  applyArrayOrEqual,
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./competency.schema.js";

export const create = wrapCommand(
  "curriculum.competency.create",
  withZod(
    insertSchema.pick({
      curriculumId: true,
      moduleId: true,
      competencyId: true,
      isRequired: true,
      requirement: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const result = await query
        .insert(s.curriculumCompetency)
        .values({
          competencyId: input.competencyId,
          curriculumId: input.curriculumId,
          moduleId: input.moduleId,
          isRequired: input.isRequired,
          requirement: input.requirement,
        })
        .returning({ id: s.curriculumCompetency.id });

      const insert = singleRow(result);

      return insert;
    },
  ),
);

export const list = wrapQuery(
  "curriculum.competency.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            curriculumId: singleOrArray(uuidSchema).optional(),
            moduleId: singleOrArray(uuidSchema).optional(),
            competencyId: singleOrArray(uuidSchema).optional(),
          })
          .default({}),
      })
      .default({}),
    selectSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        filter.curriculumId
          ? applyArrayOrEqual(
              s.curriculumCompetency.curriculumId,
              filter.curriculumId,
            )
          : undefined,
        filter.moduleId
          ? applyArrayOrEqual(s.curriculumCompetency.moduleId, filter.moduleId)
          : undefined,
        filter.competencyId
          ? applyArrayOrEqual(
              s.curriculumCompetency.competencyId,
              filter.competencyId,
            )
          : undefined,
      ];

      return await query
        .select()
        .from(s.curriculumCompetency)
        .where(and(...whereClausules));
    },
  ),
);
