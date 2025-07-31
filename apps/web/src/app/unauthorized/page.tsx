import {
  BoxedBackButton,
  BoxedButton,
} from "../(public)/_components/style/buttons";
import PageHero from "../(public)/_components/style/page-hero";
import RootLayout from "../(public)/layout";

export default function Unauthorized() {
  return (
    <RootLayout>
      <main className="flex flex-col items-center">
        <PageHero>
          <div className="px-4 lg:px-16">
            <div className="justify-center lg:justify-start gap-10 grid">
              <div className="gap-6 grid text-white">
                <h1 className="max-w-lg font-bold text-4xl lg:text-5xl xl:text-6xl">
                  401
                </h1>
                <p className="text-xl">Je hebt geen toegang tot deze pagina.</p>
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
    </RootLayout>
  );
}
