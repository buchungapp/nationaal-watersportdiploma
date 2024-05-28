import { Heading } from "~/app/(dashboard)/_components/heading";

export default function Page() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Inzichten</Heading>
        </div>
      </div>
    </>
  );
}
