"use client";

import SideNav from "~/app/(public)/_components/style/side-nav";

const BASE = "/diplomalijn/instructeur";

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
              label: "Erkenningen",
              href: `${BASE}/erkenningen`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "erkenningen";
              },
            },
            {
              label: "Overgang CWO",
              href: `${BASE}/overgang-cwo`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "overgang-cwo";
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
              label: "Introductie",
              href: `${BASE}/didactiek`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "didactiek";
              },
            },
            {
              label: "Proeven van Bekwaamheid",
              href: `${BASE}/pvbs`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "pvbs";
              },
            },
            {
              label: "Instructiegroepen & vrijstellingen",
              href: `${BASE}/instructiegroepen`,
              isActive(ctx) {
                return ctx.selectedLayoutSegments[0] === "instructiegroepen";
              },
            },
            {
              label: "Kwalificatieprofielen",
              href: `${BASE}/kwalificatieprofielen`,
              isActive(ctx) {
                return (
                  ctx.selectedLayoutSegments[0] === "kwalificatieprofielen"
                );
              },
            },
          ],
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
