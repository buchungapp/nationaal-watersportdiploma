import About from "./_components/About";
import Faq from "./_components/Faq";
import Heading from "./_components/Heading";
import Locations from "./_components/Locations";
import News from "./_components/News";
import Photos from "./_components/Photos";
import Seperator from "./_components/Seperator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full bg-branding-light h-24 -z-10"></div>
      <div className="flex flex-col gap-36 w-full">
        <Heading />
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
