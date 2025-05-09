import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { CourseCard } from "./_components/course-card";
import { ProfileLink } from "./_components/profile-link";
import { SummaryList } from "./_components/summary-list";

export default async function Page({
  params,
}: {
  params: Promise<{ handle: string; "allocation-id": string }>;
}) {
  return (
    <>
      <div className="max-lg:hidden">
        <ProfileLink params={params} />
      </div>

      <div className="items-start gap-x-8 gap-y-8 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-8 lg:max-w-none max-w-2xl">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex justify-between items-center">
            <Subheading>Samenvatting</Subheading>
          </div>
          <Divider className="mt-4" />
          <SummaryList params={params} />
        </div>

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex justify-between items-center">
            <Subheading>Cursuskaart</Subheading>
          </div>
          <Divider className="mt-4" />
          <CourseCard params={params} />
        </div>

        {/* <div className="lg:col-start-3">
          <Subheading>Tijdlijn</Subheading>
          <Divider className="mt-4" />
        </div> */}
      </div>
    </>
  );
}
