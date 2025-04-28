import Logo from "~/app/_components/brand/logo";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <Logo className="h-20 w-auto text-white" />
        <div className="mt-8 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200" />
      </div>

      <div className="mt-8">
        <div className="space-y-6">
          <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
