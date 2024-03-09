import Heading from "../_components/style/Heading";
import About from "./_components/About";
import Faq from "./_components/Faq";
import Locations from "./_components/Locations";
import News from "./_components/News";
import Photos from "./_components/Photos";
import Seperator from "./_components/Seperator";
import Welcome from "./_components/Welcome";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <Heading className="bg-branding-light">
        <Welcome />
      </Heading>
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
