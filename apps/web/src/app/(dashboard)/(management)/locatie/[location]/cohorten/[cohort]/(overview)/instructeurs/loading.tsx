import { Subheading } from "~/app/(dashboard)/_components/heading";

export default function Loading() {
  return (
    <div className="max-w-4xl">
      <div className="max-w-lg">
        <Subheading>Snel toevoegen</Subheading>
        <span className="inline-block bg-gray-200 mt-3 rounded w-full h-9 animate-pulse" />
      </div>
      <div className="gap-2 grid mt-8 animate-pulse">
        <div className="bg-slate-200 rounded-sm w-full h-8" />
        <div className="bg-slate-100 rounded-sm w-full h-8" />
        <div className="bg-slate-200 rounded-sm w-full h-8" />
      </div>
    </div>
  );
}
