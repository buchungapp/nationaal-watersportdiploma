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
  duplicatesCount,
  duplicatesTabEnabled,
}: {
  personRoles: ActorType[];
  personPrivileges: z.infer<typeof enums.Privilege>[];
  // Number of strong+ duplicate-pair candidates among persons in this
  // cohort. Drives the orange dot on the Duplicaten tab. 0 means the
  // tab still renders (so location admins can navigate there), just
  // without the indicator.
  duplicatesCount: number;
  // Feature flag (operator-identity-workflow) routed via the parent.
  // When false, the Duplicaten tab is hidden entirely.
  duplicatesTabEnabled: boolean;
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
          showDot: false,
        },
        {
          name: "Diploma's",
          href: `/locatie/${params.location}/cohorten/${params.cohort}/diplomas`,
          enabled:
            hasRole(["location_admin"]) ||
            hasPrivilege(["manage_cohort_certificate"]),
          current: segments[0] === "diplomas",
          showDot: false,
        },
        {
          name: "Instructeurs",
          href: `/locatie/${params.location}/cohorten/${params.cohort}/instructeurs`,
          enabled:
            hasRole(["location_admin"]) ||
            hasPrivilege(["manage_cohort_students"]),
          current: segments[0] === "instructeurs",
          showDot: false,
        },
        {
          name: "Duplicaten",
          href: `/locatie/${params.location}/cohorten/${params.cohort}/duplicaten`,
          // Acting on a duplicate (merging persons) requires
          // location_admin server-side, so only show the tab to people
          // who can actually do something with what they find — and
          // only when the operator-identity-workflow flag is on.
          enabled: duplicatesTabEnabled && hasRole(["location_admin"]),
          current: segments[0] === "duplicaten",
          showDot: duplicatesCount > 0,
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
              "inline-flex items-center gap-1.5",
            )}
            aria-current={tab.current ? "page" : undefined}
          >
            <span>{tab.name}</span>
            {tab.showDot ? (
              <span
                aria-label="Vraagt aandacht"
                title="Mogelijk dubbele profielen in dit cohort"
                className="inline-block size-2 rounded-full bg-branding-orange"
              />
            ) : null}
          </NextLink>
        ))}
    </nav>
  );
}
