export function Weight({ weight }: { weight: number }) {
  if (
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "development" ||
    process.env.VERCEL_ENV !== "development"
  ) {
    return null;
  }

  return (
    <span className="tabular-nums text-base/6 text-zinc-400 sm:text-sm/6 dark:text-zinc-500">
      {`${weight}.`}
    </span>
  );
}
