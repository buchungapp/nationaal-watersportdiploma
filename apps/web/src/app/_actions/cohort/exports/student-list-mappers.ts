import type { StudentsProgressData } from "~/app/(dashboard)/(management)/locatie/[location]/cohorten/[cohort]/(overview)/_student-progress";
import { type FieldMapper, exportFormatters } from "~/lib/export";
import type {
  listStudentsWithCurriculaByCohortId,
  retrieveCohortById,
} from "~/lib/nwd";

type Data = {
  student: Awaited<
    ReturnType<typeof listStudentsWithCurriculaByCohortId>
  >[number];
  cohort: NonNullable<Awaited<ReturnType<typeof retrieveCohortById>>>;
  studentProgress: StudentsProgressData[number]["curricula"] | null;
};

const personFieldMappers: Record<string, FieldMapper<Data>> = {
  personHandle: ({ student }) => student.person.handle ?? "",
  personFirstName: ({ student }) => student.person.firstName,
  personLastNamePrefix: ({ student }) => student.person.lastNamePrefix ?? "",
  personLastName: ({ student }) => student.person.lastName ?? "",
  personFullName: ({ student }) =>
    exportFormatters.fullName(
      student.person.firstName,
      student.person.lastNamePrefix,
      student.person.lastName,
    ),
  personAge: ({ student, cohort }) =>
    exportFormatters.age(student.person.dateOfBirth, cohort.accessStartTime),
  personBirthDate: ({ student }) =>
    exportFormatters.date(student.person.dateOfBirth) ?? "",
  // TODO: in the future maybe a seperate column per tag, with a boolean true/false?
  tags: ({ student }) => student.tags.join(", "),
};

const instructorFieldMappers: Record<string, FieldMapper<Data>> = {
  instructorFirstName: ({ student }) => student.instructor?.firstName ?? "",
  instructorLastNamePrefix: ({ student }) =>
    student.instructor?.lastNamePrefix ?? "",
  instructorLastName: ({ student }) => student.instructor?.lastName ?? "",
  instructorFullName: ({ student }) =>
    student.instructor
      ? exportFormatters.fullName(
          student.instructor.firstName,
          student.instructor.lastNamePrefix,
          student.instructor.lastName,
        )
      : "",
};

const studentCurriculumFieldMappers: Record<string, FieldMapper<Data>> = {
  program: ({ student }) =>
    student.studentCurriculum?.course?.title &&
    student.studentCurriculum?.degree?.title
      ? `${student.studentCurriculum.course.title} ${student.studentCurriculum.degree.title}`
      : "",
  course: ({ student }) => student.studentCurriculum?.course.title ?? "",
  degree: ({ student }) => student.studentCurriculum?.degree.title ?? "",
  gearType: ({ student }) => student.studentCurriculum?.gearType.title ?? "",
};

const progressFieldMappers: Record<string, FieldMapper<Data>> = {
  progress: ({ student, studentProgress }) => {
    if (!studentProgress) {
      return "";
    }

    return studentProgress
      .sort((a, b) => {
        // TODO: sort on category instead of course
        const course =
          b.curriculum.curriculum.program.course.handle.localeCompare(
            a.curriculum.curriculum.program.course.handle,
          );
        const disciplineWeight =
          b.curriculum.curriculum.program.course.discipline.weight -
          a.curriculum.curriculum.program.course.discipline.weight;
        const degreeRank =
          b.curriculum.curriculum.program.degree.rang -
          a.curriculum.curriculum.program.degree.rang;

        return course !== 0
          ? course
          : disciplineWeight !== 0
            ? disciplineWeight
            : degreeRank;
      })
      .map(
        (curriculum) =>
          `${curriculum.curriculum.curriculum.program.course.title} ${curriculum.curriculum.curriculum.program.degree.title} (${curriculum.progress?.modules.length ?? 0}/${curriculum.curriculum.curriculum.modules.length})`,
      )
      .join(", ");
  },
  highestDegreesByCourse: ({ student, studentProgress }) => {
    if (!studentProgress) {
      return "";
    }

    const highestDegreesByCourse = studentProgress.reduce(
      (acc, curriculum) => {
        const key = `${curriculum.curriculum.curriculum.program.course.id}`;
        const currentRank =
          curriculum.curriculum.curriculum.program.degree.rang;

        if (
          !acc[key] ||
          currentRank > acc[key].curriculum.curriculum.program.degree.rang
        ) {
          acc[key] = curriculum;
        }

        return acc;
      },
      {} as Record<string, (typeof studentProgress)[0]>,
    );
    return Object.values(highestDegreesByCourse)
      .sort((a, b) => {
        return (
          a.curriculum.curriculum.program.course.discipline.weight -
          b.curriculum.curriculum.program.course.discipline.weight
        );
      })
      .map(
        (curriculum) =>
          `${curriculum.curriculum.curriculum.program.course.title} ${curriculum.curriculum.curriculum.program.degree.title} (${curriculum.progress?.modules.length ?? 0}/${curriculum.curriculum.curriculum.modules.length})`,
      )
      .join(", ");
  },
};

export const studentListFieldMappers: Record<string, FieldMapper<Data>> = {
  ...personFieldMappers,
  ...instructorFieldMappers,
  ...studentCurriculumFieldMappers,
  ...progressFieldMappers,
};

export const studentListFieldCategories = {
  person: "Cursist",
  instructor: "Instructeur",
  studentCurriculum: "Opleiding",
  progress: "Voortgang",
} as const;

export const studentListFields: {
  id: string;
  label: string;
  category: keyof typeof studentListFieldCategories;
}[] = [
  {
    id: "personHandle",
    label: "NWD-ID",
    category: "person",
  },
  {
    id: "personFirstName",
    label: "Voornaam",
    category: "person",
  },
  {
    id: "personLastNamePrefix",
    label: "Tussenvoegsel",
    category: "person",
  },
  {
    id: "personLastName",
    label: "Achternaam",
    category: "person",
  },
  {
    id: "personFullName",
    label: "Volledige naam",
    category: "person",
  },
  {
    id: "personAge",
    label: "Leeftijd",
    category: "person",
  },
  {
    id: "personBirthDate",
    label: "Geboortedatum",
    category: "person",
  },
  {
    id: "tags",
    label: "Tags",
    category: "person",
  },
  {
    id: "instructorFirstName",
    label: "Instructeur voornaam",
    category: "instructor",
  },
  {
    id: "instructorLastNamePrefix",
    label: "Instructeur tussenvoegsel",
    category: "instructor",
  },
  {
    id: "instructorLastName",
    label: "Instructeur achternaam",
    category: "instructor",
  },
  {
    id: "instructorFullName",
    label: "Instructeur volledige naam",
    category: "instructor",
  },
  {
    id: "program",
    label: "Programma",
    category: "studentCurriculum",
  },
  {
    id: "course",
    label: "Cursus",
    category: "studentCurriculum",
  },
  {
    id: "degree",
    label: "Niveau",
    category: "studentCurriculum",
  },
  {
    id: "gearType",
    label: "Vaartuig",
    category: "studentCurriculum",
  },
  {
    id: "progress",
    label: "Historische opleidingen",
    category: "progress",
  },
  {
    id: "highestDegreesByCourse",
    label: "Hoogste niveau per opleiding",
    category: "progress",
  },
] as const;
