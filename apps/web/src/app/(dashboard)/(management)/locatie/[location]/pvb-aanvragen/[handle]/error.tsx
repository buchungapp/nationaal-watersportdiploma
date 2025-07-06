"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isHoofdcursusError = error.message.includes("hoofdcursus");

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <Heading className="mb-2">
          {isHoofdcursusError
            ? "Ongeldige PvB aanvraag"
            : "Er is iets misgegaan"}
        </Heading>

        <Text className="mb-6 text-gray-600 dark:text-gray-400">
          {isHoofdcursusError ? (
            <>
              Deze PvB aanvraag heeft geen hoofdcursus ingesteld en is daarom
              ongeldig. Neem contact op met het secretariaat voor assistentie.
            </>
          ) : (
            <>
              Er is een onverwachte fout opgetreden bij het laden van deze
              pagina.
            </>
          )}
        </Text>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button color="dark/zinc" onClick={() => router.back()}>
            Terug naar overzicht
          </Button>
          {!isHoofdcursusError && (
            <Button outline onClick={() => reset()}>
              Probeer opnieuw
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
