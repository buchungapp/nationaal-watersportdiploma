import Search from "~/app/(dashboard)/(management)/_components/search";

export default function Loading() {
  return (
    <div className="mt-8">
      <div className="flex sm:flex-row flex-col sm:justify-between items-start sm:items-center gap-1">
        <div className="w-full max-w-xl">
          <Search placeholder="Zoek cursisten op naam, cursus, instructeur of tag" />
        </div>
        <div className="flex items-center gap-1 animate-pulse shrink-0">
          <div className="bg-slate-200 rounded-lg size-9" />
          <div className="bg-slate-200 rounded-lg size-9" />
        </div>
      </div>
      <div className="gap-2 grid mt-4 animate-pulse">
        <div className="bg-slate-200 rounded-sm w-full h-8" />
        <div className="bg-slate-100 rounded-sm w-full h-8" />
        <div className="bg-slate-200 rounded-sm w-full h-8" />
      </div>
    </div>
  );
}
