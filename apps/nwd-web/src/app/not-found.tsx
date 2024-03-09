import { BoxedBackButton, BoxedButton } from "./_components/style/Buttons";
import Heading from "./_components/style/Heading";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center">
      <Heading className="bg-branding-light">
        <div className="px-4 lg:px-16">
          <div className="grid gap-10 justify-center lg:justify-start">
            <div className="text-white grid gap-6">
              <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">404</h1>
              <p className="text-xl">We konden de pagina niet vinden.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
              <BoxedButton href="/" className="bg-white text-branding-dark">
                Naar NWD
              </BoxedButton>
              <BoxedBackButton className="text-white">Terug</BoxedBackButton>
            </div>
          </div>
        </div>
      </Heading>
    </main>
  );
}
