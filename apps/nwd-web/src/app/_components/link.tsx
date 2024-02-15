import { clsx } from "clsx"
import NextLink from "next/link"
import Wave from "~/app/_components/wave"

export default function Link({className, children, ...props}: React.ComponentPropsWithoutRef<typeof NextLink>) {

    return (
        <NextLink className={clsx(className, 'relative group')} {...props}>
            {children}

        <Wave className="h-1.5 hidden group-hover:block absolute -bottom-1 text-brand-light-blue" />
        </NextLink>
    )
}