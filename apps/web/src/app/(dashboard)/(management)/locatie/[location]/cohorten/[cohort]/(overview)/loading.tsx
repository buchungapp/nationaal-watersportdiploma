import Search from "~/app/(dashboard)/(management)/_components/search";

export default function Loading() {
  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between sm:items-center gap-1">
        <div className="w-full max-w-xl">
          <Search placeholder="Zoek cursisten op naam, cursus, instructeur of tag" />
        </div>
        <div className="flex items-center gap-1 shrink-0 animate-pulse">
          <div className="rounded-sm bg-slate-200 size-9" />
        </div>
      </div>
      <div className="grid gap-2 mt-4 animate-pulse">
        <div className="w-full rounded-sm bg-slate-200 h-8" />
        <div className="w-full rounded-sm bg-slate-100 h-8" />
        <div className="w-full rounded-sm bg-slate-200 h-8" />
      </div>
    </div>
  );
}
