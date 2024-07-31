"use client";

import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import { Button } from "../_components/button";
import { Heading } from "../_components/heading";
import { Text } from "../_components/text";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto flex flex-col justify-center h-full">
      <Heading>404</Heading>
      <Text>
        Oeps.. We konden de pagina die je zocht niet vinden. Dit kan komen
        doordat de pagina niet bestaat, is verplaatst of je geen toegang hebt.
      </Text>

      <Button onClick={router.back} className="mt-4">
        <ArrowLeftIcon />
        Terug naar de vorige pagina
      </Button>
    </div>
  );
}
