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
        "grid grid-cols-1 gap-x-6 gap-y-1 text-base/6 sm:grid-cols-[min(30%,--spacing(80))_auto] sm:text-sm/6",
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
        "col-start-1 leading-snug text-zinc-500 sm:leading-loose dark:text-zinc-400",
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
        "pb-2 text-zinc-950 font-medium sm:pb-0 dark:text-white break-words",
      )}
    />
  );
}
