"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

export default function ProfielErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <Heading className="mb-2">Er is iets misgegaan</Heading>

        <Text className="mb-6 text-gray-600 dark:text-gray-400">
          Er is een onverwachte fout opgetreden bij het laden van dit profiel.
          Probeer het opnieuw of neem contact op met het secretariaat als het
          probleem zich blijft voordoen.
        </Text>

        {error.digest ? (
          <Text className="mb-6 text-xs text-gray-500 dark:text-gray-500">
            Referentie: {error.digest}
          </Text>
        ) : null}

        <Button outline onClick={() => reset()}>
          Probeer opnieuw
        </Button>
      </div>
    </div>
  );
}
