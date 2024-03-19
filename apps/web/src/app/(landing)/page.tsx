import { HAVE_WE_LAUNCHED } from "../../../launch-control";
import PageHero from "../_components/style/page-hero";
import About from "./_components/about";
import Faq from "./_components/faq";
import Locations from "./_components/locations";
import News from "./_components/news";
import Photos from "./_components/photos";
import Seperator from "./_components/seperator";
import Welcome from "./_components/welcome";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <Welcome />
      </PageHero>
      <div className="mt-12 flex w-full flex-col gap-36">
        <Photos />
        <About />
        <Locations />
        {/* 🚀 launch control */}
        {HAVE_WE_LAUNCHED ? <Faq /> : null}
        <Seperator />
        {/* 🚀 launch control */}
        {HAVE_WE_LAUNCHED ? <News /> : null}
      </div>
    </main>
  );
}
