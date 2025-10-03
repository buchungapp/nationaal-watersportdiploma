import assert from "node:assert";
import { schema as s } from "@nawadi/db";
import {
  type SQL,
  type SQLWrapper,
  and,
  eq,
  exists,
  getTableColumns,
  inArray,
  like,
  not,
  notInArray,
  sql,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  findItem,
  handleSchema,
  possibleSingleRow,
  singleOrArray,
  singleOrNonEmptyArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, outputSchema } from "./course.schema.js";
import { Category, Discipline } from "./index.js";

export const create = wrapCommand(
  "course.create",
  withZod(
    insertSchema.extend({
      categories: uuidSchema.array().optional(),
    }),
    successfulCreateResponse,
    async (item) =>
      withTransaction(async (tx) => {
        const row = await tx
          .insert(s.course)
          .values({
            ...item,
            title: item.title,
            handle: item.handle,
            disciplineId: item.disciplineId,
          })
          .returning({ id: s.course.id })
          .then(singleRow);

        if (!!item.categories && item.categories.length > 0) {
          await tx.insert(s.courseCategory).values(
            item.categories.map((categoryId) => ({
              courseId: row.id,
              categoryId,
            })),
          );
        }

        return row;
      }),
  ),
);

export const list = wrapQuery(
  "course.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            id: singleOrArray(uuidSchema).optional(),
            type: singleOrNonEmptyArray(
              z.enum(["consument", "instructeur"]),
            ).optional(),
            locationId: uuidSchema.optional(),
          })
          .default({}),
      })
      .default({}),
    outputSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClausules: SQLWrapper[] = [];

      if (filter.id) {
        if (Array.isArray(filter.id)) {
          whereClausules.push(inArray(s.course.id, filter.id));
        } else {
          whereClausules.push(eq(s.course.id, filter.id));
        }
      }

      if (filter.type) {
        // If both types are selected, no additional filtering needed
        if (Array.isArray(filter.type) && filter.type.length === 2) {
          // Both 'consument' and 'instructeur' selected - include all courses
        } else {
          const types = Array.isArray(filter.type)
            ? filter.type
            : [filter.type];

          if (types.includes("consument") && !types.includes("instructeur")) {
            // Only 'consument' selected - exclude courses ending with '-instructeurs'
            whereClausules.push(not(like(s.course.handle, "%-instructeurs")));
          } else if (
            types.includes("instructeur") &&
            !types.includes("consument")
          ) {
            // Only 'instructeur' selected - include only courses ending with '-instructeurs'
            whereClausules.push(like(s.course.handle, "%-instructeurs"));
          }
        }
      }

      if (filter.locationId) {
        whereClausules.push(
          exists(
            query
              .select({ id: sql`1` })
              .from(s.locationResourceLink)
              .innerJoin(
                s.discipline,
                eq(s.discipline.id, s.locationResourceLink.disciplineId),
              )
              .where(
                and(
                  eq(s.locationResourceLink.locationId, filter.locationId),
                  eq(s.discipline.id, s.course.disciplineId),
                ),
              ),
          ),
        );
      }

      // Prepare a database query to fetch programs and their categories using joins.
      const coursesPromise = query
        .select()
        .from(s.course)
        .leftJoin(s.courseCategory, eq(s.courseCategory.courseId, s.course.id))
        .where(and(...whereClausules))
        .then((rows) => {
          return Object.values(
            rows.reduce(
              (acc, { course, course_category }) => {
                if (!acc[course.id]) {
                  acc[course.id] = {
                    ...course,
                    categories: [],
                  };
                }

                if (course_category) {
                  acc[course.id]?.categories.push(course_category);
                }

                return acc;
              },
              {} as Record<
                string,
                (typeof rows)[number]["course"] & {
                  categories: NonNullable<
                    (typeof rows)[number]["course_category"]
                  >[];
                }
              >,
            ),
          );
        }); // Transform joined rows into a structured format with programs and their categories.

      // Fetch additional lists of categories, degrees, and disciplines in parallel to optimize loading times.
      const [courses, categories, disciplines] = await Promise.all([
        coursesPromise,
        Category.list(),
        Discipline.list(),
      ]);

      // Map over the programs to enrich them with additional data like degree, discipline, and categories.
      return courses
        .map((course) => {
          // Find the corresponding discipline for each program enforcing that it must exist.
          const discipline = findItem({
            items: disciplines,
            predicate(item) {
              return item.id === course.disciplineId;
            },
            enforce: true, // Enforce finding the discipline, throw error if not found.
          });

          const {
            categories: courseCategories,
            disciplineId,
            ...courseProperties
          } = course;

          // Construct the final program object with additional details.
          return {
            ...courseProperties,
            discipline,
            categories: categories.filter(
              (
                category, // Filter categories relevant to the current program.
              ) => courseCategories.some((pc) => pc.categoryId === category.id),
            ),
          };
        })
        .sort((a, b) => {
          return a.discipline.weight - b.discipline.weight;
        });
    },
  ),
);

export const findOne = wrapQuery(
  "course.findOne",
  withZod(
    z.object({
      id: uuidSchema.optional(),
      handle: handleSchema.optional(),
      title: z.string().optional(),
      disciplineId: uuidSchema.optional(),
      categoryId: singleOrArray(uuidSchema).optional(),
    }),
    outputSchema.nullable(),
    async (input) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [];

      if (input.id) {
        whereClausules.push(eq(s.course.id, input.id));
      }

      if (input.handle) {
        whereClausules.push(eq(s.course.handle, input.handle));
      }

      if (input.disciplineId) {
        whereClausules.push(eq(s.course.disciplineId, input.disciplineId));
      }

      if (input.title) {
        whereClausules.push(eq(s.course.title, input.title));
      }

      const _query = query
        .select({
          ...getTableColumns(s.course),
          category: s.courseCategory,
        })
        .from(s.course)
        .leftJoin(s.courseCategory, eq(s.courseCategory.courseId, s.course.id))
        .where(and(...whereClausules));

      if (input.categoryId) {
        if (Array.isArray(input.categoryId)) {
          whereClausules.push(
            and(
              inArray(s.courseCategory.categoryId, input.categoryId),
              eq(s.courseCategory.courseId, s.course.id),
            ),
          );
        } else {
          whereClausules.push(
            and(
              eq(s.courseCategory.categoryId, input.categoryId),
              eq(s.courseCategory.courseId, s.course.id),
            ),
          );
        }
      }

      const course = await _query
        .then(
          aggregate({
            pkey: "id",
            fields: { categories: "category.id" },
          }),
        )
        .then(possibleSingleRow);

      if (!course) {
        return null;
      }

      const [allCategories, discipline] = await Promise.all([
        Category.list(),
        Discipline.fromId(course.disciplineId),
      ]);

      assert(discipline, "Discipline not found");

      const { categories, disciplineId, ...courseProperties } = course;

      return {
        ...courseProperties,
        discipline,
        categories: allCategories.filter((category) =>
          categories.some((pc) => pc.categoryId === category.id),
        ),
      };
    },
  ),
);

export const update = wrapCommand(
  "course.update",
  withZod(
    z.object({
      id: z.string().uuid(),
      title: insertSchema.shape.title.optional(),
      description: insertSchema.shape.description.optional(),
      disciplineId: insertSchema.shape.disciplineId.optional(),
      abbreviation: insertSchema.shape.abbreviation.optional(),
      categories: uuidSchema.array().optional(),
    }),
    z.void(),
    async (input) =>
      withTransaction(async (tx) => {
        const row = await tx
          .update(s.course)
          .set({
            title: input.title,
            description: input.description,
            disciplineId: input.disciplineId,
            abbreviation: input.abbreviation,
          })
          .where(eq(s.course.id, input.id))
          .returning({ id: s.course.id })
          .then(singleRow);

        if (!!input.categories && input.categories.length > 0) {
          await Promise.all([
            tx
              .delete(s.courseCategory)
              .where(
                and(
                  eq(s.courseCategory.courseId, input.id),
                  notInArray(s.courseCategory.categoryId, input.categories),
                ),
              ),
            tx
              .insert(s.courseCategory)
              .values(
                input.categories.map((categoryId) => ({
                  courseId: row.id,
                  categoryId,
                })),
              )
              .onConflictDoNothing({
                target: [
                  s.courseCategory.courseId,
                  s.courseCategory.categoryId,
                ],
              }),
          ]);
        }
      }),
  ),
);
