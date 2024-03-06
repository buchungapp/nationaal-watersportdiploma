import About from "./_components/About";
import Heading from "./_components/Heading";
import Locations from "./_components/Locations";
import Photos from "./_components/Photos";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full bg-branding-light h-24 -z-10"></div>
      <div className="flex flex-col gap-12 w-full">
        <Heading />
        <Photos />
        <About />
        <Locations />
      </div>
      <div className="min-h-screen"></div>
    </main>
  );
}
