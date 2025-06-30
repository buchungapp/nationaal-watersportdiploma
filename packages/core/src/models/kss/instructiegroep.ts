import { schema as s } from "@nawadi/db";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  handleSchema,
  jsonAggBuildObject,
  singleRow,
  uuidSchema,
  withZod,
  wrapQuery,
} from "../../utils/index.js";

export const findByCourseId = wrapQuery(
  "kss.instructiegroep.findByCourseIdAndRichting",
  withZod(
    z.object({
      courseId: uuidSchema,
      richting: z.enum(s.richting.enumValues),
    }),
    z.object({
      id: uuidSchema,
      title: z.string(),
      richting: z.string(),
      courses: z.array(
        z.object({
          id: uuidSchema,
          handle: handleSchema,
          title: z.string().nullable(),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select({
          id: s.instructieGroep.id,
          title: s.instructieGroep.title,
          richting: s.instructieGroep.richting,
          courses: jsonAggBuildObject({
            id: s.course.id,
            handle: s.course.handle,
            title: s.course.title,
          }),
        })
        .from(s.instructieGroep)
        .innerJoin(
          s.instructieGroepCursus,
          eq(s.instructieGroep.id, s.instructieGroepCursus.instructieGroepId),
        )
        .innerJoin(
          s.course,
          and(
            eq(s.instructieGroepCursus.courseId, s.course.id),
            isNull(s.course.deletedAt),
          ),
        )
        .where(
          and(
            eq(s.instructieGroep.richting, input.richting),
            eq(s.instructieGroepCursus.courseId, input.courseId),
          ),
        )
        .groupBy(s.instructieGroep.id)
        .then(singleRow);

      return result;
    },
  ),
);
