import { Divider } from "~/app/(dashboard)/_components/divider";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import { CourseHeading } from "./_components/course-heading";
import { CourseInfo } from "./_components/course-info";
import { CourseModules } from "./_components/course-modules";

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default function Page({ params }: PageProps) {
  return (
    <>
      <BackButton href={"/secretariaat/diplomalijn/cursussen"}>
        Cursussen
      </BackButton>
      <CourseHeading params={params} />
      <CourseInfo params={params} />
      <Divider className="my-10" />
      <CourseModules params={params} />
    </>
  );
}
