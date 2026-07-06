"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { addLocationAdminAsSystemAdminAction } from "~/app/_actions/location/add-location-admin-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  PersonSearchCombobox,
  type SearchPerson,
} from "~/app/(dashboard)/_components/person-search-combobox";
import { usePersonSearch } from "~/app/(dashboard)/_hooks/swr/use-person-search";

export function AddLocationAdminDialog({
  locationId,
  locationName,
  isOpen,
  onClose,
}: {
  locationId: string;
  locationName: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: searchResults,
    debouncedQuery,
    isLoading: isSearching,
  } = usePersonSearch(searchQuery);

  const { execute, reset, isExecuting } = useAction(
    addLocationAdminAsSystemAdminAction,
    {
      onSuccess: () => {
        toast.success("Locatiebeheerder toegevoegd.");
        router.refresh();
        closeDialog();
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const closeDialog = () => {
    setSelectedPersonId(null);
    setSelectedPersonName(null);
    setSearchQuery("");
    reset();
    onClose();
  };

  const handleSelectPerson = (person: SearchPerson) => {
    setSelectedPersonId(person.id);
    const name = [person.firstName, person.lastNamePrefix, person.lastName]
      .filter(Boolean)
      .join(" ");
    setSelectedPersonName(name);
  };

  return (
    <Alert open={isOpen} onClose={closeDialog} size="md">
      <AlertTitle>Locatiebeheerder toevoegen</AlertTitle>
      <AlertDescription>
        Zoek en selecteer de persoon die je als locatiebeheerder wilt toevoegen
        voor {locationName ?? "deze locatie"}.
      </AlertDescription>
      <AlertBody>
        <Fieldset>
          <Field>
            <Label>Persoon</Label>
            <PersonSearchCombobox
              selectedPersonName={selectedPersonName}
              onSelect={handleSelectPerson}
              label="Zoek persoon"
              isSearching={isSearching}
              results={searchResults}
              query={searchQuery}
              debouncedQuery={debouncedQuery}
              onQueryChange={setSearchQuery}
            />
          </Field>
        </Fieldset>
      </AlertBody>
      <AlertActions>
        <Button plain onClick={closeDialog}>
          Annuleren
        </Button>
        <Button
          color="branding-dark"
          disabled={!selectedPersonId || isExecuting}
          onClick={() => {
            if (selectedPersonId) {
              execute({ locationId, personId: selectedPersonId });
            }
          }}
        >
          {isExecuting ? "Toevoegen..." : "Toevoegen"}
        </Button>
      </AlertActions>
    </Alert>
  );
}
