import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  foreignKey,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { cohortAllocation } from "./cohort.js";
import { gearType } from "./course.js";
import {
  curriculum,
  curriculumCompetency,
  curriculumGearLink,
} from "./curriculum.js";
import { location } from "./location.js";
import { media } from "./media.js";
import { person } from "./user.js";

export const studentCurriculum = pgTable(
  "student_curriculum",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    personId: uuid("person_id").notNull(),
    curriculumId: uuid("curriculum_id").notNull(),
    gearTypeId: uuid("gear_type_id").notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("student_curriculum_unq_identity_gear_curriculum").on(
      table.personId,
      table.curriculumId,
      table.gearTypeId,
    ),
    index("student_curriculum_idx_person").on(table.personId),
    foreignKey({
      columns: [table.curriculumId, table.gearTypeId],
      foreignColumns: [
        curriculumGearLink.curriculumId,
        curriculumGearLink.gearTypeId,
      ],
      name: "student_curriculum_link_curriculum_id_gear_type_id_fk",
    }),
    foreignKey({
      columns: [table.curriculumId],
      foreignColumns: [curriculum.id],
      name: "student_curriculum_link_curriculum_id_fk",
    }),
    foreignKey({
      columns: [table.gearTypeId],
      foreignColumns: [gearType.id],
      name: "student_curriculum_link_gear_type_id_fk",
    }),
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "student_curriculum_link_person_id_fk",
    }),
  ],
);

export const certificate = pgTable(
  "certificate",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    studentCurriculumId: uuid("student_curriculum_id").notNull(),
    cohortAllocationId: uuid("cohort_allocation_id"),
    locationId: uuid("location_id").notNull(),
    issuedAt: timestamp("issued_at", {
      withTimezone: true,
      mode: "string",
    }),
    visibleFrom: timestamp("visible_from", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("certificate_unq_handle").on(table.handle),
    index("certificate_idx_location").on(table.locationId),
    index("certificate_idx_issued_at").on(table.issuedAt),
    index("certificate_idx_visible_from").on(table.visibleFrom),
    index("certificate_idx_deleted_at").on(table.deletedAt),
    index("certificate_idx_location_issued_at").on(
      table.locationId,
      table.issuedAt,
    ),
    index("certificate_idx_handle_search").using(
      "gin",
      sql`to_tsvector('simple', ${table.handle})`,
    ),
    foreignKey({
      columns: [table.studentCurriculumId],
      foreignColumns: [studentCurriculum.id],
      name: "certificate_student_curriculum_link_id_fk",
    }),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "certificate_location_id_fk",
    }),
    foreignKey({
      columns: [table.cohortAllocationId],
      foreignColumns: [cohortAllocation.id],
      name: "certificate_cohort_allocation_id_fk",
    }),
  ],
);

export const studentCompletedCompetency = pgTable(
  "student_completed_competency",
  {
    studentCurriculumId: uuid("student_curriculum_id").notNull(),
    competencyId: uuid("curriculum_module_competency_id").notNull(),
    certificateId: uuid("certificate_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.studentCurriculumId, table.competencyId],
      name: "student_completed_competency_pk",
    }),
    foreignKey({
      columns: [table.studentCurriculumId],
      foreignColumns: [studentCurriculum.id],
      name: "student_completed_competency_student_curriculum_link_id_fk",
    }),
    foreignKey({
      columns: [table.competencyId],
      foreignColumns: [curriculumCompetency.id],
      name: "curriculum_competency_competency_id_fk",
    }),
    foreignKey({
      columns: [table.certificateId],
      foreignColumns: [certificate.id],
      name: "student_completed_competency_certificate_id_fk",
    }),
  ],
);

export const externalCertificate = pgTable(
  "external_certificate",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    personId: uuid("person_id").notNull(),

    identifier: text("identifier"),
    issuingAuthority: text("issuing_authority"),
    title: text("title").notNull(),
    issuingLocation: text("issuing_location"),
    awardedAt: timestamp("awarded_at", {
      withTimezone: true,
      mode: "string",
    }),
    additionalComments: text("additional_comments"),

    // To prevent a circular dependency, we use a function to reference the media table
    mediaId: uuid("media_id").references((): AnyPgColumn => media.id),
    locationId: uuid("location_id"),

    _metadata: jsonb("_metadata"),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "external_certificate_person_id_fk",
    }),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "external_certificate_location_id_fk",
    }),
  ],
);
