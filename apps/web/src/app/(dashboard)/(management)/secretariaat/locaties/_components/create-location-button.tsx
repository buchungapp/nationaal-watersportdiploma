"use client";

import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { CreateLocationDialog } from "./create-location-dialog";

export function CreateLocationButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button color="branding-dark" onClick={() => setIsOpen(true)}>
        <PlusIcon />
        Nieuwe vaarlocatie
      </Button>
      <CreateLocationDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
