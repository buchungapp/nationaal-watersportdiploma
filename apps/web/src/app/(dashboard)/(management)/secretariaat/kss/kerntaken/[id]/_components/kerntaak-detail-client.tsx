"use client";

import { PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { WerkprocesModal } from "./werkproces-modal";
import { WerkprocesOnderdeelModal } from "./werkproces-onderdeel-modal";
import WerkprocesSection from "./werkproces-section";

interface KerntaakDetailClientProps {
  kerntaakId: string;
  onderdelen: Array<{
    id: string;
    type: "portfolio" | "praktijk";
  }>;
  werkprocessen: Array<{
    id: string;
    titel: string;
    resultaat: string;
    rang: number;
    beoordelingscriteria: Array<{
      id: string;
      title: string;
      omschrijving: string;
      rang: number;
    }>;
  }>;
}

export default function KerntaakDetailClient({
  kerntaakId,
  onderdelen,
  werkprocessen,
}: KerntaakDetailClientProps) {
  const [werkprocesModalOpen, setWerkprocesModalOpen] = useState(false);
  const [werkprocesOnderdeelModalOpen, setWerkprocesOnderdeelModalOpen] =
    useState(false);

  return (
    <>
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <Heading level={2}>Werkprocessen</Heading>
          <div className="flex gap-2">
            <Button
              color="branding-orange"
              onClick={() => setWerkprocesModalOpen(true)}
            >
              <PlusIcon />
              Nieuw werkproces
            </Button>
            {onderdelen.length > 0 && werkprocessen.length > 0 && (
              <Button
                color="blue"
                onClick={() => setWerkprocesOnderdeelModalOpen(true)}
              >
                Werkprocessen toewijzen
              </Button>
            )}
          </div>
        </div>

        {onderdelen.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Let op:</strong> Deze kerntaak heeft {onderdelen.length}{" "}
              onderde{onderdelen.length === 1 ? "el" : "len"}:{" "}
              {onderdelen.map((o, idx) => (
                <span key={o.id}>
                  <Badge color="blue" className="text-xs">
                    {o.type === "portfolio" ? "Portfolio" : "Praktijk"}
                  </Badge>
                  {idx < onderdelen.length - 1 ? " en " : ""}
                </span>
              ))}
              . Je kunt werkprocessen toewijzen aan specifieke onderdelen.
            </p>
          </div>
        )}

        <WerkprocesSection
          kerntaakId={kerntaakId}
          werkprocessen={werkprocessen}
        />
      </div>

      <WerkprocesModal
        isOpen={werkprocesModalOpen}
        onClose={() => setWerkprocesModalOpen(false)}
        kerntaakId={kerntaakId}
      />

      {onderdelen.length > 0 && (
        <WerkprocesOnderdeelModal
          isOpen={werkprocesOnderdeelModalOpen}
          onClose={() => setWerkprocesOnderdeelModalOpen(false)}
          kerntaakId={kerntaakId}
          onderdelen={onderdelen}
          werkprocessen={werkprocessen}
        />
      )}
    </>
  );
}
