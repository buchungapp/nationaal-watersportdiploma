import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { module, competency, gearType, program } from "./course.js";

export const curriculum = pgTable(
  "curriculum",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid("program_id").notNull(),
    revision: text("revision").notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "string",
    }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [program.id],
      name: "curriculum_program_id_fk",
    }),
    uniqueIndex().on(table.programId, table.revision),
  ],
);

export const curriculumModule = pgTable(
  "curriculum_module",
  {
    curriculumId: uuid("curriculum_id").notNull(),
    moduleId: uuid("module_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.curriculumId, table.moduleId] }),
    foreignKey({
      columns: [table.curriculumId],
      foreignColumns: [curriculum.id],
      name: "curriculum_module_curriculum_id_fk",
    }),
    foreignKey({
      columns: [table.moduleId],
      foreignColumns: [module.id],
      name: "curriculum_module_module_id_fk",
    }),
    uniqueIndex().on(table.curriculumId, table.moduleId),
  ],
);

export const curriculumCompetency = pgTable(
  "curriculum_competency",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    curriculumId: uuid("curriculum_id").notNull(),
    moduleId: uuid("module_id").notNull(),
    competencyId: uuid("competency_id").notNull(),
    isRequired: boolean("is_required").notNull(),
    requirement: text("requirement"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("curriculum_competency_unq_set").on(
      table.curriculumId,
      table.moduleId,
      table.competencyId,
    ),
    foreignKey({
      columns: [table.curriculumId, table.moduleId],
      foreignColumns: [
        curriculumModule.curriculumId,
        curriculumModule.moduleId,
      ],
      name: "curriculum_competency_curriculum_module_id_fk",
    }),
    foreignKey({
      columns: [table.competencyId],
      foreignColumns: [competency.id],
      name: "curriculum_competency_competency_id_fk",
    }),
  ],
);

export const curriculumGearLink = pgTable(
  "curriculum_gear_link",
  {
    curriculumId: uuid("curriculum_id").notNull(),
    gearTypeId: uuid("gear_type_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.curriculumId, table.gearTypeId] }),
    foreignKey({
      columns: [table.curriculumId],
      foreignColumns: [curriculum.id],
      name: "curriculum_gear_link_curriculum_id_fk",
    }),
    foreignKey({
      columns: [table.gearTypeId],
      foreignColumns: [gearType.id],
      name: "curriculum_gear_link_gear_type_id_fk",
    }),
  ],
);
