import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import { ProgramCurricula } from "./_components/program-curricula";
import { ProgramHeading } from "./_components/program-heading";
import { ProgramInfo } from "./_components/program-info";

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default function Page({ params }: PageProps) {
  return (
    <>
      <BackButton href={"/secretariaat/diplomalijn/cursussen"}>
        Cursus
      </BackButton>
      <ProgramHeading params={params} />
      <ProgramInfo params={params} />
      <Divider className="my-10" />

      <div className="flex flex-wrap justify-between items-end gap-4">
        <Heading level={2}>Curricula</Heading>
      </div>

      <ProgramCurricula params={params} />
    </>
  );
}
