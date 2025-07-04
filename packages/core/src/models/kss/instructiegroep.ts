import { schema as s } from "@nawadi/db";
import { type SQLWrapper, and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  handleSchema,
  jsonAggBuildObject,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import {
  addCourseToInstructiegroepOutputSchema,
  addCourseToInstructiegroepSchema,
  createInstructiegroepOutputSchema,
  createInstructiegroepSchema,
  deleteInstructiegroepOutputSchema,
  deleteInstructiegroepSchema,
  instructiegroepOutputSchema,
  instructiegroepWithCoursesOutputSchema,
  listInstructiegroepSchema,
  removeCourseFromInstructiegroepOutputSchema,
  removeCourseFromInstructiegroepSchema,
  updateInstructiegroepOutputSchema,
  updateInstructiegroepSchema,
} from "./instructiegroep.schema.js";

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

      // Single query using a subquery to find the instructiegroep that contains
      // the given courseId and richting, then return all courses in that instructiegroep
      const instructiegroepSubquery = query
        .select({ id: s.instructieGroep.id })
        .from(s.instructieGroep)
        .innerJoin(
          s.instructieGroepCursus,
          eq(s.instructieGroep.id, s.instructieGroepCursus.instructieGroepId),
        )
        .where(
          and(
            eq(s.instructieGroep.richting, input.richting),
            eq(s.instructieGroepCursus.courseId, input.courseId),
          ),
        );

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
        .where(eq(s.instructieGroep.id, instructiegroepSubquery))
        .groupBy(s.instructieGroep.id)
        .then(singleRow);

      return result;
    },
  ),
);

// Query handlers

export const list = wrapQuery(
  "kss.instructiegroep.list",
  withZod(
    listInstructiegroepSchema,
    instructiegroepOutputSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClausules: SQLWrapper[] = [];

      if (filter.id) {
        whereClausules.push(eq(s.instructieGroep.id, filter.id));
      }

      if (filter.richting) {
        whereClausules.push(eq(s.instructieGroep.richting, filter.richting));
      }

      const rows = await query
        .select({
          id: s.instructieGroep.id,
          title: s.instructieGroep.title,
          richting: s.instructieGroep.richting,
        })
        .from(s.instructieGroep)
        .where(and(...whereClausules))
        .orderBy(s.instructieGroep.title);

      return rows;
    },
  ),
);

export const listWithCourses = wrapQuery(
  "kss.instructiegroep.listWithCourses",
  withZod(
    listInstructiegroepSchema,
    instructiegroepWithCoursesOutputSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClausules: SQLWrapper[] = [];

      if (filter.id) {
        whereClausules.push(eq(s.instructieGroep.id, filter.id));
      }

      if (filter.richting) {
        whereClausules.push(eq(s.instructieGroep.richting, filter.richting));
      }

      // Query instructiegroepen with their courses
      const rows = await query
        .select({
          instructieGroep: {
            id: s.instructieGroep.id,
            title: s.instructieGroep.title,
            richting: s.instructieGroep.richting,
          },
          course: {
            id: s.course.id,
            handle: s.course.handle,
            title: s.course.title,
          },
        })
        .from(s.instructieGroep)
        .leftJoin(
          s.instructieGroepCursus,
          eq(s.instructieGroepCursus.instructieGroepId, s.instructieGroep.id),
        )
        .leftJoin(s.course, eq(s.instructieGroepCursus.courseId, s.course.id))
        .where(and(...whereClausules))
        .orderBy(s.instructieGroep.title, s.course.title);

      // Group the results by instructiegroep
      type GroupedResult = z.infer<
        typeof instructiegroepWithCoursesOutputSchema
      >;

      const groupedResults = rows.reduce(
        (acc, row) => {
          const { instructieGroep, course } = row;

          if (!acc[instructieGroep.id]) {
            acc[instructieGroep.id] = {
              ...instructieGroep,
              courses: [],
            };
          }

          const currentGroup = acc[instructieGroep.id];
          if (!currentGroup) return acc;

          if (
            course?.id &&
            !currentGroup.courses.find((c) => c.id === course.id)
          ) {
            currentGroup.courses.push({
              id: course.id,
              handle: course.handle,
              title: course.title,
            });
          }

          return acc;
        },
        {} as Record<string, GroupedResult>,
      );

      return Object.values(groupedResults);
    },
  ),
);

// Mutation handlers

export const create = wrapCommand(
  "kss.instructiegroep.create",
  withZod(
    createInstructiegroepSchema,
    createInstructiegroepOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Create instructiegroep
        const result = await tx
          .insert(s.instructieGroep)
          .values({
            title: input.title,
            richting: input.richting,
          })
          .returning({ id: s.instructieGroep.id });

        return singleRow(result);
      });
    },
  ),
);

export const update = wrapCommand(
  "kss.instructiegroep.update",
  withZod(
    updateInstructiegroepSchema,
    updateInstructiegroepOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate instructiegroep exists
        const existing = await tx
          .select({ id: s.instructieGroep.id })
          .from(s.instructieGroep)
          .where(eq(s.instructieGroep.id, input.id));

        if (existing.length === 0) {
          throw new Error("Instructiegroep niet gevonden");
        }

        // Update instructiegroep
        const updateData: Partial<{
          title: string;
          richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
        }> = {};

        if (input.title !== undefined) updateData.title = input.title;
        if (input.richting !== undefined) updateData.richting = input.richting;

        await tx
          .update(s.instructieGroep)
          .set(updateData)
          .where(eq(s.instructieGroep.id, input.id));

        return { success: true };
      });
    },
  ),
);

export const remove = wrapCommand(
  "kss.instructiegroep.delete",
  withZod(
    deleteInstructiegroepSchema,
    deleteInstructiegroepOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Check if instructiegroep has courses
        const courses = await tx
          .select({ id: s.instructieGroepCursus.courseId })
          .from(s.instructieGroepCursus)
          .where(eq(s.instructieGroepCursus.instructieGroepId, input.id))
          .limit(1);

        if (courses.length > 0) {
          throw new Error(
            "Instructiegroep kan niet verwijderd worden omdat er cursussen aan gekoppeld zijn",
          );
        }

        // Delete instructiegroep
        await tx
          .delete(s.instructieGroep)
          .where(eq(s.instructieGroep.id, input.id));

        return { success: true };
      });
    },
  ),
);

// Course assignment mutations

export const addCourse = wrapCommand(
  "kss.instructiegroep.addCourse",
  withZod(
    addCourseToInstructiegroepSchema,
    addCourseToInstructiegroepOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Validate instructiegroep exists
        const instructiegroepResult = await tx
          .select({ id: s.instructieGroep.id })
          .from(s.instructieGroep)
          .where(eq(s.instructieGroep.id, input.instructieGroepId));

        if (instructiegroepResult.length === 0) {
          throw new Error("Opgegeven instructiegroep bestaat niet");
        }

        // Validate course exists
        const courseResult = await tx
          .select({ id: s.course.id })
          .from(s.course)
          .where(eq(s.course.id, input.courseId));

        if (courseResult.length === 0) {
          throw new Error("Opgegeven cursus bestaat niet");
        }

        // Check if assignment already exists
        const existingAssignment = await tx
          .select({ id: s.instructieGroepCursus.instructieGroepId })
          .from(s.instructieGroepCursus)
          .where(
            and(
              eq(
                s.instructieGroepCursus.instructieGroepId,
                input.instructieGroepId,
              ),
              eq(s.instructieGroepCursus.courseId, input.courseId),
            ),
          );

        if (existingAssignment.length > 0) {
          throw new Error(
            "Deze cursus is al toegevoegd aan de instructiegroep",
          );
        }

        // Create assignment
        await tx.insert(s.instructieGroepCursus).values({
          instructieGroepId: input.instructieGroepId,
          courseId: input.courseId,
        });

        return { success: true };
      });
    },
  ),
);

export const removeCourse = wrapCommand(
  "kss.instructiegroep.removeCourse",
  withZod(
    removeCourseFromInstructiegroepSchema,
    removeCourseFromInstructiegroepOutputSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        // Check if assignment exists
        const existingAssignment = await tx
          .select({ id: s.instructieGroepCursus.instructieGroepId })
          .from(s.instructieGroepCursus)
          .where(
            and(
              eq(
                s.instructieGroepCursus.instructieGroepId,
                input.instructieGroepId,
              ),
              eq(s.instructieGroepCursus.courseId, input.courseId),
            ),
          );

        if (existingAssignment.length === 0) {
          throw new Error(
            "Deze cursus is niet gekoppeld aan de instructiegroep",
          );
        }

        // Delete assignment
        await tx
          .delete(s.instructieGroepCursus)
          .where(
            and(
              eq(
                s.instructieGroepCursus.instructieGroepId,
                input.instructieGroepId,
              ),
              eq(s.instructieGroepCursus.courseId, input.courseId),
            ),
          );

        return { success: true };
      });
    },
  ),
);
