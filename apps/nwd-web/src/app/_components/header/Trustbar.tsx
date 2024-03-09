import Link from "next/link";
import Facebook from "~/app/_assets/social/Facebook";
import Instagram from "~/app/_assets/social/Instagram";
import Linkedin from "~/app/_assets/social/Linkedin";
import Tiktok from "~/app/_assets/social/Tiktok";
import Youtube from "~/app/_assets/social/Youtube";

export default async function Trustbar() {
  return (
    <section className="text-white py-2 sm:px-28 flex items-center justify-center lg:justify-between gap-2">
      <div className="xl:block hidden flex-1"></div>
      <p className="xl:text-center lg:text-start text-center flex-1 text-sm font-semibold uppercase">
        veiligheid, kwaliteit & plezier op het water.
      </p>

      <ul className="items-center flex-1 gap-6 justify-end lg:flex hidden">
        <li>
          <Link
            href={`https://facebook.com/nationaalwatersportdiploma`}
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <Facebook className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href={`https://www.instagram.com/nationaalwatersportdiploma`}
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <Instagram className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href={`https://www.linkedin.com/company/nationaal-watersportdiploma/`}
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <Linkedin className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href={`https://www.tiktok.com/@nwdiploma`}
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <Tiktok className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href={`https://www.youtube.com/@nationaalwatersportdiploma`}
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <Youtube className="h-4 w-4" />
          </Link>
        </li>
      </ul>
    </section>
  );
}
