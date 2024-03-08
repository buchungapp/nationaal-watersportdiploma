import Link from "next/link";
import Hero from "~/app/_assets/Hero";
import { Line, LineWave } from "~/app/_assets/Wave";
import Facebook from "~/app/_assets/social/Facebook";
import Instagram from "~/app/_assets/social/Instagram";
import Linkedin from "~/app/_assets/social/Linkedin";
import Tiktok from "~/app/_assets/social/Tiktok";
import Youtube from "~/app/_assets/social/Youtube";

export default function Footer() {
  return (
    <footer className="mt-32 grid gap-14 rounded-t-[3rem] bg-branding-dark px-4 lg:px-16 pt-20 pb-12">
      <div className="grid items-start gap-12 grid-cols-1 lg:grid-cols-2">
        <div className="grid gap-6">
          <Hero className="w-48 h-12 text-white" />
          <p className="text-slate-200 text-sm">Veiligheid, kwaliteit en plezier op het water.</p>
        </div>
        <div className="grid gap-12 lg:gap-0 items-start grid-cols-1 lg:grid-cols-3 text-sm">
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Diplomalijn</h3>
            <ul className="grid gap-6 text-slate-200">
              <li>
                <Link href="/consumenten">Consumenten</Link>
              </li>
              <li>
                <Link href="/instructeurs">Instructeurs</Link>
              </li>
              <li>
                <Link href="/watersportverbond">Watersportverbond</Link>
              </li>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Locaties</h3>
            <ul className="grid gap-6 text-slate-200">
              <li>
                <Link href="/locaties">Aangesloten vaarlocaties</Link>
              </li>
              <li>
                <Link href="/kwaliteitseisen">Kwaliteitseisen</Link>
              </li>
              <li>
                <Link href="/procedures">Procedures</Link>
              </li>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Over NWD</h3>
            <ul className="grid gap-6 text-slate-200">
              <li>
                <Link href="/manifest">Manifest</Link>
              </li>
              <li>
                <Link href="/faq">Veelgestelde vragen</Link>
              </li>
              <li>
                <Link href="/organisatie">Organisatie</Link>
              </li>
              <li>
                <Link href="/perskit">Perskit</Link>
              </li>
              <li>
                <Link href="/vertrouwenspersoon">Vertrouwenspersoon</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Line className="w-full text-branding-light/20" />

      <div className="flex justify-between flex-col gap-4 lg:flex-row lg:items-center">
        <div className="grid gap-2 text-sm">
          <p className="text-white font-semibold">Schrijf je in voor de NWD-nieuwsbrief</p>
          <p className="text-slate-200">
            Ontvang nieuws, updates en leuk beeldmateriaal in je inbox.
          </p>
        </div>
        <form className="flex gap-2 text-sm">
          <input
            type="email"
            className="placeholder:text-slate-400 rounded py-1.5 px-3 bg-[#003580] border border-[#004099] text-white"
            placeholder="Je e-mailadres"
          />
          <button
            type="submit"
            className="text-white bg-branding-light group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Aanmelden
          </button>
        </form>
      </div>

      <LineWave progress="60%" />

      <div className="text-slate-200 flex flex-col lg:flex-row gap-4">
        <p className="lg:text-start text-center flex-1 text-sm">
          © 2024 Nationaal Watersportdiploma.
        </p>
        <ul className="items-center flex-1 gap-6 justify-center lg:justify-end flex">
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
      </div>
    </footer>
  );
}
