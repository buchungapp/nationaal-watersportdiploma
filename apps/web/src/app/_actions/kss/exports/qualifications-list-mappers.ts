import { exportFormatters, type FieldMapper } from "~/lib/export";

type Instructor = {
  id: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
  handle: string;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: {
    name: string;
    code: string;
  } | null;
  email: string | null;
};

type Course = {
  id: string;
  handle: string;
  title: string | null;
  abbreviation: string | null;
};

type Kwalificatie = {
  personId: string;
  courseId: string;
  richting: string;
  hoogsteNiveau: number;
};

type Data = {
  instructor: Instructor;
  kwalificaties: Kwalificatie[];
  courses: Course[];
};

const instructorFieldMappers: Record<string, FieldMapper<Data>> = {
  instructorHandle: ({ instructor }) => instructor.handle ?? "",
  instructorFirstName: ({ instructor }) => instructor.firstName,
  instructorLastNamePrefix: ({ instructor }) => instructor.lastNamePrefix ?? "",
  instructorLastName: ({ instructor }) => instructor.lastName ?? "",
  instructorFullName: ({ instructor }) =>
    exportFormatters.fullName(
      instructor.firstName,
      instructor.lastNamePrefix,
      instructor.lastName,
    ),
  instructorDateOfBirth: ({ instructor }) =>
    exportFormatters.date(instructor.dateOfBirth) ?? "",
  instructorBirthCity: ({ instructor }) => instructor.birthCity ?? "",
  instructorBirthCountry: ({ instructor }) =>
    instructor.birthCountry?.name ?? "",
  instructorEmail: ({ instructor }) => instructor.email ?? "",
  instructorBirthCountryCode: ({ instructor }) =>
    instructor.birthCountry?.code ?? "",
  instructorBirthCountryName: ({ instructor }) =>
    instructor.birthCountry?.name ?? "",
};

// Dynamic field mappers for each course
const createCourseFieldMappers = (
  courses: Course[],
): Record<string, FieldMapper<Data>> => {
  const courseMappers: Record<string, FieldMapper<Data>> = {};

  for (const course of courses) {
    const courseId = course.id;
    const fieldId = `course_${course.handle}`;

    courseMappers[fieldId] = ({ kwalificaties }) => {
      const courseKwalificaties = kwalificaties.filter(
        (k) => k.courseId === courseId,
      );

      if (courseKwalificaties.length === 0) return "";

      // Group by richting and get highest niveau
      const byRichting = courseKwalificaties.reduce(
        (acc, kwal) => {
          const existing = acc[kwal.richting];
          if (!existing || kwal.hoogsteNiveau > existing) {
            acc[kwal.richting] = kwal.hoogsteNiveau;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(byRichting)
        .map(([richting, niveau]) => {
          const richtingAbbr =
            {
              instructeur: "I",
              leercoach: "L",
              pvb_beoordelaar: "B",
            }[richting] ?? richting.charAt(0).toUpperCase();
          return `${richtingAbbr}-${niveau}`;
        })
        .join(", ");
    };
  }

  return courseMappers;
};

export const qualificationsListFieldMappers = (
  courses: Course[],
): Record<string, FieldMapper<Data>> => ({
  ...instructorFieldMappers,
  ...createCourseFieldMappers(courses),
});

export const qualificationsListFieldCategories = {
  instructor: "Instructeur",
  qualifications: "Kwalificaties",
  courses: "Cursussen",
} as const;

export const qualificationsListFields = (
  courses: Course[],
): {
  id: string;
  label: string;
  category: keyof typeof qualificationsListFieldCategories;
}[] => [
  {
    id: "instructorHandle",
    label: "NWD-ID",
    category: "instructor",
  },
  {
    id: "instructorFirstName",
    label: "Voornaam",
    category: "instructor",
  },
  {
    id: "instructorLastNamePrefix",
    label: "Tussenvoegsel",
    category: "instructor",
  },
  {
    id: "instructorLastName",
    label: "Achternaam",
    category: "instructor",
  },
  {
    id: "instructorFullName",
    label: "Volledige naam",
    category: "instructor",
  },
  {
    id: "instructorEmail",
    label: "E-mail",
    category: "instructor",
  },
  {
    id: "instructorDateOfBirth",
    label: "Geboortedatum",
    category: "instructor",
  },
  {
    id: "instructorBirthCity",
    label: "Geboorteplaats",
    category: "instructor",
  },
  {
    id: "instructorBirthCountryCode",
    label: "Geboorteland (code)",
    category: "instructor",
  },
  {
    id: "instructorBirthCountryName",
    label: "Geboorteland (naam)",
    category: "instructor",
  },
  // Dynamic course fields
  ...courses
    .filter((course) => course.title !== null)
    .map((course) => ({
      id: `course_${course.handle}`,
      label: course.abbreviation ?? course.title ?? course.handle,
      category: "courses" as const,
    })),
];
