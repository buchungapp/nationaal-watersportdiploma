import Article from "../../_components/style/article";

export default function ArticlesLoading() {
  return (
    <div className="flex flex-col justify-center gap-16">
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr]">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="-m-4 rounded-3xl p-4">
            <Article>
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-8 w-24 animate-pulse rounded bg-slate-200" />
            </Article>
          </div>
        </div>
      ))}
    </div>
  );
}
