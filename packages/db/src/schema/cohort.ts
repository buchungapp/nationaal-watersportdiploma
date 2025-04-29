import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { studentCurriculum } from "./certificate.js";
import { location } from "./location.js";
import { actor } from "./user.js";

export const cohort = pgTable(
  "cohort",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    label: text("revision").notNull(),
    locationId: uuid("location_id").notNull(),
    accessStartTime: timestamp("access_start_time", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    accessEndTime: timestamp("access_end_time", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    certificatesVisibleFrom: timestamp("certificates_visible_from", {
      withTimezone: true,
      mode: "string",
    }),
    _metadata: jsonb("_metadata"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex()
      .on(table.handle, table.locationId)
      .where(sql`deleted_at IS NULL`),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "cohort_location_id_fk",
    }),
  ],
);

export const cohortAllocation = pgTable(
  "cohort_allocation",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    cohortId: uuid("cohort_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    studentCurriculumId: uuid("student_curriculum_id"),
    instructorId: uuid("instructor_id"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    progressVisibleUpUntil: timestamp("progress_visible_up_until", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.cohortId, table.actorId, table.studentCurriculumId),
    index().on(table.cohortId, table.tags),
    foreignKey({
      columns: [table.cohortId],
      foreignColumns: [cohort.id],
      name: "cohort_allocation_cohort_id_fk",
    }),
    foreignKey({
      columns: [table.actorId],
      foreignColumns: [actor.id],
      name: "cohort_allocation_actor_id_fk",
    }),
    foreignKey({
      columns: [table.studentCurriculumId],
      foreignColumns: [studentCurriculum.id],
      name: "cohort_allocation_student_curriculum_id_fk",
    }),
    foreignKey({
      columns: [table.instructorId],
      foreignColumns: [actor.id],
      name: "cohort_allocation_instructor_id_fk",
    }),
  ],
);
