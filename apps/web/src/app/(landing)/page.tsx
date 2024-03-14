import PageHero from '../_components/style/page-hero'
import About from './_components/about'
import Faq from './_components/faq'
import Locations from './_components/locations'
import News from './_components/news'
import Photos from './_components/photos'
import Seperator from './_components/seperator'
import Welcome from './_components/welcome'

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <Welcome />
      </PageHero>
      <div className="mt-12 flex w-full flex-col gap-36">
        <Photos />
        <About />
        <Locations />
        <Faq />
        <Seperator />
        <News />
      </div>
    </main>
  )
}
