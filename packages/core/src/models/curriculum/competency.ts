import { schema as s } from "@nawadi/db";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { singleRow } from "../../utils/data-helpers.js";
import { successfulCreateResponse, withZod } from "../../utils/zod.js";
import { insertSchema, selectSchema } from "./competency.schema.js";

export const create = withZod(
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
);

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery();

  return await query.select().from(s.curriculumCompetency);
});
