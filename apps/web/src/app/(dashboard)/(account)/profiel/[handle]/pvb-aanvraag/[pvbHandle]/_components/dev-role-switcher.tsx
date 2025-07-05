"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "~/app/(dashboard)/_components/button";

type Role = "kandidaat" | "leercoach" | "beoordelaar" | null;

export function DevRoleSwitcher({ currentRole }: { currentRole: Role }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    startTransition(() => {
      // Set cookie and refresh
      document.cookie = `dev-pvb-role=${newRole || ""}; path=/; max-age=3600`;
      router.refresh();
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
          🛠️ DEV MODE
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
          Test Role:
        </p>
        <div className="flex flex-col gap-1">
          <Button
            color={selectedRole === "kandidaat" ? "yellow" : "zinc"}
            onClick={() => handleRoleChange("kandidaat")}
            disabled={isPending}
            className="text-xs"
          >
            Kandidaat
          </Button>
          <Button
            color={selectedRole === "leercoach" ? "yellow" : "zinc"}
            onClick={() => handleRoleChange("leercoach")}
            disabled={isPending}
            className="text-xs"
          >
            Leercoach
          </Button>
          <Button
            color={selectedRole === "beoordelaar" ? "yellow" : "zinc"}
            onClick={() => handleRoleChange("beoordelaar")}
            disabled={isPending}
            className="text-xs"
          >
            Beoordelaar
          </Button>
          <Button
            color={selectedRole === null ? "yellow" : "zinc"}
            onClick={() => handleRoleChange(null)}
            disabled={isPending}
            className="text-xs"
          >
            No Role (404)
          </Button>
        </div>
        {isPending && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Switching role...
          </p>
        )}
      </div>
    </div>
  );
}
