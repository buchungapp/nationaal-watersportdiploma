import PageHero from "../_components/style/page-hero";
import About from "./_components/About";
import Faq from "./_components/Faq";
import Locations from "./_components/Locations";
import News from "./_components/News";
import Photos from "./_components/Photos";
import Seperator from "./_components/Seperator";
import Welcome from "./_components/Welcome";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <Welcome />
      </PageHero>
      <div className="flex flex-col gap-36 w-full mt-12">
        <Photos />
        <About />
        <Locations />
        <Faq />
        <Seperator />
        <News />
      </div>
    </main>
  );
}
