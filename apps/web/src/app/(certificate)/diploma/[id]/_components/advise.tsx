import { CheckIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Strong, Text, TextLink } from "~/app/(dashboard)/_components/text";
import { retrieveCertificateById } from "~/lib/nwd";
import { generateAdvise } from "../../_utils/generate-advise";

export default async function CertificateAdvise({ id }: { id: string }) {
  const [certificate, advise] = await Promise.all([
    retrieveCertificateById(id).catch(() => notFound()),
    generateAdvise(id),
  ]);

  const {
    course: {
      title: courseTitle,
      handle: courseHandle,
      discipline: { handle: disciplineHandle },
    },
    degree: { title: degreeTitle },
  } = certificate.program;

  const uniqueCompletedModules = Array.from(
    new Set(
      certificate.completedCompetencies.map(
        (competency) => competency.curriculum_competency.moduleId,
      ),
    ),
  );

  return (
    <div className="mt-6 max-w-prose mx-auto">
      <Text className="">
        Je bent bezig met de cursus <Strong>{courseTitle}</Strong> op niveau{" "}
        <Strong>{degreeTitle}</Strong>. Hieronder vind je een overzicht van de
        modules die je tot nu toe hebt voltooid. {advise}
      </Text>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 p-2.5 sm:p-6 sm:-mx-6 border border-zinc-900/10 rounded-lg">
        <div>
          <Subheading>Kernmodules</Subheading>
          <ul className="space-y-2 mt-2.5">
            {certificate.curriculum.modules
              .filter((module) => module.isRequired)
              .sort((a, b) => a.weight - b.weight)
              .map((module, index, filteredArray) => {
                const isModuleCompleted = uniqueCompletedModules.includes(
                  module.id,
                );
                return (
                  <li key={module.id}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {isModuleCompleted ? (
                          <CheckIcon className="size-4 mr-2.5" />
                        ) : (
                          <span className="size-4 rounded-full border border-zinc-500 mr-2.5" />
                        )}
                        <Text>{module.title}</Text>
                      </div>
                      {isModuleCompleted ? (
                        <Badge color="green">Behaald</Badge>
                      ) : null}
                    </div>
                    {index < filteredArray.length - 1 && (
                      <Divider soft className="my-2.5" />
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <Subheading>Keuzemodules</Subheading>
          <ul className="space-y-2 mt-2.5">
            {certificate.curriculum.modules
              .filter((module) => !module.isRequired)
              .sort((a, b) => a.weight - b.weight)
              .map((module, index, filteredArray) => {
                const isModuleCompleted = uniqueCompletedModules.includes(
                  module.id,
                );
                return (
                  <li key={module.id}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {isModuleCompleted ? (
                          <CheckIcon className="size-4 mr-2.5" />
                        ) : (
                          <span className="size-4 rounded-full border border-zinc-500 mr-2.5" />
                        )}
                        <Text>{module.title}</Text>
                      </div>
                      {isModuleCompleted ? (
                        <Badge color="green">Behaald</Badge>
                      ) : null}
                    </div>
                    {index < filteredArray.length - 1 && (
                      <Divider soft className="my-2.5" />
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      <Text className="mt-8">
        Wil je meer weten over de opbouw van jouw cursus? <br /> Bezoek de
        cursuspagina{" "}
        <TextLink
          href={`/diplomalijn/consument/disciplines/${disciplineHandle}/${courseHandle}`}
          target="_blank"
        >
          {courseTitle}
        </TextLink>
        .
      </Text>
    </div>
  );
}
