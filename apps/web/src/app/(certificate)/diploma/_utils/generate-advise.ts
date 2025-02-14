import { retrieveCertificateById } from "~/lib/nwd";

export async function generateAdvise(
  input: string | Awaited<ReturnType<typeof retrieveCertificateById>>,
) {
  let certificate = input;

  if (typeof certificate === "string") {
    certificate = await retrieveCertificateById(certificate);
  }

  const uniqueCompletedModules = Array.from(
    new Set(
      certificate.completedCompetencies.map(
        (competency) => competency.curriculum_competency.moduleId,
      ),
    ),
  );

  const allUniqueModules = Array.from(
    new Set(certificate.curriculum.modules.map((module) => module.id)),
  );

  const hasMoreModules =
    uniqueCompletedModules.length < allUniqueModules.length;

  const nextRang = certificate.program.degree.rang + 1;

  const baseModules = certificate.curriculum.modules.filter((module) =>
    ["basis", "handeling"].includes(module.handle),
  );

  const areAllBaseModulesCompleted = baseModules.every((module) =>
    uniqueCompletedModules.includes(module.id),
  );

  const adviceStrings = [];

  if (hasMoreModules) {
    adviceStrings.push(
      "verbreed jezelf binnen je huidige niveau door extra modules te volgen",
    );
  }

  if (nextRang <= 4 && areAllBaseModulesCompleted) {
    adviceStrings.push(
      `ga de uitdaging aan met het volgende niveau ${nextRang}`,
    );
  }

  adviceStrings.push("duik in een nieuwe discipline");

  // Function to format and combine advice strings
  const formatAdvice = (advice: string[]) => {
    if (advice.length === 0) {
      return ""; // No advice to give
    }

    const firstAdvice = advice[0];
    if (typeof firstAdvice === "undefined") {
      return ""; // No advice to give
    }

    // Capitalize the first letter of the first advice
    advice[0] = firstAdvice.charAt(0).toUpperCase() + firstAdvice.slice(1);

    if (advice.length > 1) {
      const lastAdvice = advice.pop();
      return `${advice.join(", ")} of ${lastAdvice}!`;
    }

    return `${advice[0]}.`;
  };

  return formatAdvice(adviceStrings);
}
