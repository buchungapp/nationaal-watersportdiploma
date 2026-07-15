"use client";

import SideNav from "~/app/(public)/_components/style/side-nav";
import {
  isKwalificatieprofielActive,
  kwalificatieprofielHref,
  kwalificatieprofielenByGroup,
} from "../_data/kwalificatieprofielen";

const BASE = "/diplomalijn/instructeur";

function profielNavItems(group: "instructeur" | "leercoach" | "beoordelaar") {
  return kwalificatieprofielenByGroup(group).map((profiel) => ({
    label: profiel.navLabel,
    href: kwalificatieprofielHref(profiel),
    isActive(ctx: { selectedLayoutSegments: string[] }) {
      return isKwalificatieprofielActive(
        profiel,
        ctx.selectedLayoutSegments,
      );
    },
  }));
}

export default function SideNavDiplomalijn() {
  return (
    <SideNav
      sections={[
        {
          items: [
            {
              label: "Introductie",
              href: BASE,
              isActive(ctx) {
                return ctx.selectedLayoutSegments.length < 1;
              },
            },
            {
              label: "Veelgestelde vragen",
              href: `${BASE}/veelgestelde-vragen`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "veelgestelde-vragen";
              },
            },
          ],
        },
        {
          label: "Eigenvaardigheid",
          items: [
            {
              label: "Introductie",
              href: `${BASE}/eigenvaardigheid`,
              isActive(ctx) {
                return (
                  ctx.selectedLayoutSegments[0] === "eigenvaardigheid" &&
                  ctx.selectedLayoutSegments.length === 1
                );
              },
            },
            {
              label: "Examineren",
              href: `${BASE}/eigenvaardigheid/examineren`,
              isActive(ctx) {
                return (
                  ctx.selectedLayoutSegments[0] === "eigenvaardigheid" &&
                  ctx.selectedLayoutSegments[1] === "examineren"
                );
              },
            },
            {
              label: "Disciplines",
              href: `${BASE}/eigenvaardigheid/disciplines`,
              isActive(ctx) {
                if (ctx.selectedLayoutSegments[0] !== "eigenvaardigheid") {
                  return false;
                }
                const segment = ctx.selectedLayoutSegments[1];
                if (!segment || segment === "examineren") {
                  return false;
                }
                return true;
              },
            },
          ],
        },
        {
          label: "Didactiek",
          items: [
            {
              label: "KSS-structuur",
              href: `${BASE}/didactiek`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "didactiek";
              },
            },
            {
              label: "Proeve van Bekwaamheid",
              href: `${BASE}/pvbs`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "pvbs";
              },
            },
            {
              label: "Instructiegroepen",
              href: `${BASE}/instructiegroepen`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "instructiegroepen";
              },
            },
          ],
        },
        {
          label: "Instructeur",
          items: profielNavItems("instructeur"),
        },
        {
          label: "Leercoach",
          items: profielNavItems("leercoach"),
        },
        {
          label: "PvB-beoordelaar",
          items: profielNavItems("beoordelaar"),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
