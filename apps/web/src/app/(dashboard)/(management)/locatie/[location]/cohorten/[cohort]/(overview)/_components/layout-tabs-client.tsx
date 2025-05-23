"use client";

import type { enums } from "@nawadi/lib";
import { clsx } from "clsx";
import NextLink from "next/link";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import type { z } from "zod";
import type { ActorType } from "~/lib/nwd";

export function LayoutTabsClient({
  personRoles,
  personPrivileges,
}: {
  personRoles: ActorType[];
  personPrivileges: z.infer<typeof enums.Privilege>[];
}) {
  const params = useParams();
  const segments = useSelectedLayoutSegments();

  const hasRole = (role: ActorType[]) =>
    personRoles.some((r) => role.includes(r));

  const hasPrivilege = (privilege: z.infer<typeof enums.Privilege>[]) =>
    personPrivileges.some((p) => privilege.includes(p));

  return (
    <nav
      className="flex space-x-6 overflow-auto text-sm scrollbar-none"
      aria-label="Tabs"
    >
      {[
        {
          name: "Cursisten",
          href: `/locatie/${params.location}/cohorten/${params.cohort}`,
          enabled: hasRole(["instructor", "location_admin"]),
          current: segments.length < 1,
        },
        {
          name: "Diploma's",
          href: `/locatie/${params.location}/cohorten/${params.cohort}/diplomas`,
          enabled:
            hasRole(["location_admin"]) ||
            hasPrivilege(["manage_cohort_certificate"]),
          current: segments[0] === "diplomas",
        },
        {
          name: "Instructeurs",
          href: `/locatie/${params.location}/cohorten/${params.cohort}/instructeurs`,
          enabled:
            hasRole(["location_admin"]) ||
            hasPrivilege(["manage_cohort_students"]),
          current: segments[0] === "instructeurs",
        },
      ]
        .filter((tab) => !!tab.enabled)
        .map((tab) => (
          <NextLink
            key={tab.name}
            href={tab.href}
            className={clsx(
              tab.current
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500 hover:text-slate-700",
              "rounded-md px-3 py-2 text-sm font-medium",
            )}
            aria-current={tab.current ? "page" : undefined}
          >
            {tab.name}
          </NextLink>
        ))}
    </nav>
  );
}
