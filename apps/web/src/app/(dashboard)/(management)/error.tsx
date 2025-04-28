"use client"; // Error components must be Client Components

import { ArrowPathIcon } from "@heroicons/react/16/solid";
import { useEffect } from "react";
import { Button } from "../_components/button";
import { Heading, Subheading } from "../_components/heading";
import { Code, Text } from "../_components/text";

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto flex flex-col justify-center h-full">
      <Heading>Er is iets misgegaan!</Heading>
      <Text>
        Oeps.. Er is iets misgegaan. We zijn op de hoogte, maar je kunt ons
        helpen door via de feedbackknop te laten weten wat je aan het doen was.
        Bedankt!
      </Text>

      <Button
        className="mt-4"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        <ArrowPathIcon />
        Probeer de pagina te herladen
      </Button>

      <Subheading className="mt-6">Debug informatie</Subheading>
      <Code className="mt-2">{error.message}</Code>
    </div>
  );
}
