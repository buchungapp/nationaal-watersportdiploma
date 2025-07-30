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
      <div className="right-4 bottom-4 slide-in-from-bottom-5 z-50 fixed animate-in duration-300 fade-in">
        <div className="flex items-center gap-3 bg-orange-500 shadow-lg px-4 py-3 rounded-lg max-w-md text-white">
          <div className="flex flex-1 items-center gap-3">
            <UserIcon className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                Impersonatie actief
              </p>
              <p className="text-orange-100 text-xs truncate">
                {impersonatedUser?.displayName ||
                  impersonatedUser?.email ||
                  "Onbekende gebruiker"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStopImpersonation}
            disabled={isPending}
            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 border-white/20 text-white text-sm shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show floating admin button when not impersonating and not searching
  if (!isSearching) {
    return (
      <div className="right-4 bottom-4 slide-in-from-bottom-5 z-50 fixed animate-in duration-300 fade-in">
        <Button
          onClick={() => setIsSearching(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-lg px-4 py-2 rounded-lg text-white"
        >
          <UserIcon className="w-4 h-4" />
          <span className="max-sm:hidden text-sm">Impersoneren</span>
        </Button>
      </div>
    );
  }

  // Show floating search interface
  return (
    <div className="right-4 bottom-4 slide-in-from-bottom-5 z-50 fixed animate-in duration-300 fade-in">
      <div className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg max-w-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label
              htmlFor="user-id"
              className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm"
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-white text-sm"
          >
            Start impersonatie
          </Button>
          <Button
            onClick={() => {
              setIsSearching(false);
              setUserId("");
            }}
            disabled={isPending}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-300 text-sm"
          >
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
}
