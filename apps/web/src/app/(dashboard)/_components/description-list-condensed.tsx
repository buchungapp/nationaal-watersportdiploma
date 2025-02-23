import clsx from "clsx";

export function DescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dl">) {
  return (
    <dl
      {...props}
      className={clsx(
        className,
        "grid grid-cols-1 text-sm/6 sm:grid-cols-[min(40%,--spacing(60))_auto] sm:text-xs/6",
      )}
    />
  );
}

export function DescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dt">) {
  return (
    <dt
      {...props}
      className={clsx(
        className,
        "col-start-1 pt-3 text-zinc-500 sm:py-0 dark:text-zinc-400",
      )}
    />
  );
}

export function DescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dd">) {
  return (
    <dd
      {...props}
      className={clsx(
        className,
        "pb-3 pt-1 text-zinc-950 sm:py-0 dark:text-white break-words",
      )}
    />
  );
}
