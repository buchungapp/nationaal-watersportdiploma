import { BoxedBackButton, BoxedButton } from "./_components/style/buttons";
import PageHero from "./_components/style/page-hero";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="justify-center lg:justify-start gap-10 grid">
            <div className="gap-6 grid text-white">
              <h1 className="max-w-lg font-bold text-4xl lg:text-5xl xl:text-6xl">
                404
              </h1>
              <p className="text-xl">We konden de pagina niet vinden.</p>
            </div>
            <div className="flex sm:flex-row flex-col gap-x-6 gap-y-2">
              <BoxedButton href="/" className="bg-white text-branding-dark">
                Naar de homepage
              </BoxedButton>
              <BoxedBackButton className="text-white">Terug</BoxedBackButton>
            </div>
          </div>
        </div>
      </PageHero>
    </main>
  );
}
