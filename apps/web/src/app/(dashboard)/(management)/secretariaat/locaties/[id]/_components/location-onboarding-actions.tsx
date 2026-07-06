"use client";

import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { AddLocationAdminDialog } from "./add-location-admin-dialog";
import { ImportInstructorsDialog } from "./import-instructors-dialog";
import { ImportKwalificatiesDialog } from "./import-kwalificaties-dialog";

export function LocationOnboardingActions({
  locationId,
  locationName,
  countries,
}: {
  locationId: string;
  locationName: string | null;
  countries: { code: string; name: string }[];
}) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [instructorsOpen, setInstructorsOpen] = useState(false);
  const [kwalificatiesOpen, setKwalificatiesOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button outline onClick={() => setAdminOpen(true)}>
          Locatiebeheerder toevoegen
        </Button>
        <Button outline onClick={() => setInstructorsOpen(true)}>
          Instructeurs importeren
        </Button>
        <Button outline onClick={() => setKwalificatiesOpen(true)}>
          Kwalificaties importeren
        </Button>
      </div>

      <AddLocationAdminDialog
        locationId={locationId}
        locationName={locationName}
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
      <ImportInstructorsDialog
        locationId={locationId}
        countries={countries}
        isOpen={instructorsOpen}
        setIsOpen={setInstructorsOpen}
      />
      <ImportKwalificatiesDialog
        locationId={locationId}
        isOpen={kwalificatiesOpen}
        setIsOpen={setKwalificatiesOpen}
      />
    </>
  );
}
