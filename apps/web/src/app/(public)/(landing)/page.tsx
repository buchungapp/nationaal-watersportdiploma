import PageHero from "../_components/style/page-hero";
import Comparison from "./_components/comparison";
import Faq from "./_components/faq";
import Locations from "./_components/locations";
import News from "./_components/news";
import Photos from "./_components/photos";
import Seperator from "./_components/seperator";
import Stats from "./_components/stats";
import Welcome from "./_components/welcome";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <Welcome />
      </PageHero>
      <div className="mt-8 flex w-full max-w-(--breakpoint-2xl) mx-auto flex-col gap-16 px-4 pb-16 lg:mt-12 lg:gap-24 lg:px-8">
        <Photos />
        <Comparison />
        <Stats />
        <Locations />
        <Faq />
        <Seperator />
        <News />
      </div>
    </main>
  );
}
