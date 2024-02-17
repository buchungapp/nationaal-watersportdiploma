import { clsx } from "clsx";
import NextLink from "next/link";
import Wave from "~/app/_components/wave";

export default function Link({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof NextLink>) {
  return (
    <NextLink className={clsx(className, "group relative")} {...props}>
      {children}

      <Wave className="absolute -bottom-1 hidden h-1.5 text-brand-light-blue group-hover:block" />
    </NextLink>
  );
}
