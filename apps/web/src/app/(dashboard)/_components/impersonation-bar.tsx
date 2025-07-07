"use client";

import { UserIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  startImpersonationAction,
  stopImpersonationAction,
} from "~/app/_actions/admin/impersonation-actions";
import { Button } from "./button";
import { Input } from "./input";

interface ImpersonationBarProps {
  isImpersonating: boolean;
  impersonatedUser?: {
    email: string;
    displayName?: string;
    id: string;
  };
}

export function ImpersonationBar({
  isImpersonating,
  impersonatedUser,
}: ImpersonationBarProps) {
  const [userId, setUserId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startAction = useAction(startImpersonationAction);
  const stopAction = useAction(stopImpersonationAction);

  const handleStartImpersonation = () => {
    if (!userId.trim()) {
      toast.error("Voer een gebruikers-ID in");
      return;
    }

    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId.trim())) {
      toast.error("Ongeldig gebruikers-ID formaat");
      return;
    }

    startTransition(() => {
      startAction.execute({ targetUserId: userId.trim() });
    });
  };

  const handleStopImpersonation = () => {
    startTransition(() => {
      stopAction.execute({});
    });
  };

  // Show orange floating bar when impersonating
  if (isImpersonating) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
          <div className="flex items-center gap-3 flex-1">
            <UserIcon className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                Impersonatie actief
              </p>
              <p className="text-xs text-orange-100 truncate">
                {impersonatedUser?.displayName ||
                  impersonatedUser?.email ||
                  "Onbekende gebruiker"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStopImpersonation}
            disabled={isPending}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20 px-3 py-1.5 text-sm shrink-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show floating admin button when not impersonating and not searching
  if (!isSearching) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <Button
          onClick={() => setIsSearching(true)}
          className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <UserIcon className="h-4 w-4" />
          <span className="text-sm">Impersoneren</span>
        </Button>
      </div>
    );
  }

  // Show floating search interface
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label
              htmlFor="user-id"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Gebruikers-ID
            </label>
            <Input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStartImpersonation();
                }
                if (e.key === "Escape") {
                  setIsSearching(false);
                  setUserId("");
                }
              }}
              autoFocus
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button
            onClick={handleStartImpersonation}
            disabled={isPending || !userId.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm flex-1"
          >
            Start impersonatie
          </Button>
          <Button
            onClick={() => {
              setIsSearching(false);
              setUserId("");
            }}
            disabled={isPending}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 text-sm"
          >
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
}
