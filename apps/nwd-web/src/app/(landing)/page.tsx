import Heading from "./_components/Heading";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full bg-branding-light h-24 -z-10"></div>
      <Heading />
      <div className="min-h-screen"></div>
    </main>
  );
}
