import { NavbarSection } from "~/app/(dashboard)/_components/navbar";
import { DashboardToggleWrapper } from "../../../profiel/[handle]/_components/dashboard-toggle-wrapper";

export default function Page(props: {
  params: Promise<{ handle: string }>;
}) {
  return (
    <NavbarSection>
      <DashboardToggleWrapper
        personHandlePromise={props.params.then((p) => p.handle)}
      />
    </NavbarSection>
  );
}
