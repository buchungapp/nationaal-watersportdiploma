import { Subheading } from "../(dashboard)/_components/heading";
import { Code } from "../(dashboard)/_components/text";
import {
  BoxedBackButton,
  BoxedButton,
} from "../(public)/_components/style/buttons";
import PageHero from "../(public)/_components/style/page-hero";
import RootLayout from "../(public)/layout";

export async function ErrorPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const errorMessage = searchParams.errorMessage as string;

  <RootLayout>
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="justify-center lg:justify-start gap-10 grid">
            <div className="gap-6 grid text-white">
              <h1 className="max-w-lg font-bold text-4xl lg:text-5xl xl:text-6xl">
                Er is iets misgegaan!
              </h1>
              <p className="text-xl">
                Oeps.. Er is iets misgegaan. We zijn op de hoogte, maar je kunt
                ons helpen door via de feedbackknop te laten weten wat je aan
                het doen was. Bedankt!
              </p>
            </div>

            <Subheading className="mt-6">Debug informatie</Subheading>
            <Code className="mt-2">{errorMessage}</Code>
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
  </RootLayout>;
}
