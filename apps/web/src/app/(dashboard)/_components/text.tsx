import { clsx } from "clsx";
import { Link } from "./link";

export function Text({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(
        className,
        "text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400",
      )}
    />
  );
}

export function TextLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        "text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white",
      )}
    />
  );
}

export function Strong({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"strong">) {
  return (
    <strong
      {...props}
      className={clsx(className, "font-medium text-zinc-950 dark:text-white")}
    />
  );
}

export function Code({
  className,
  linkable = false,
  ...props
}: React.ComponentPropsWithoutRef<"code"> & { linkable?: boolean }) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        linkable
          ? "text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 dark:text-blue-400"
          : "text-zinc-950 dark:text-white",
        "rounded-sm border tabular-nums border-zinc-950/10 bg-zinc-950/[2.5%] px-0.5 text-sm font-medium sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5",
      )}
    />
  );
}
