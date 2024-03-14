import PageHero from '../_components/style/page-hero'
import SideNav from '../_components/style/side-nav'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Verenigingszaken
            </h1>
            <p className="text-xl">
              Waar we in geloven bij het Nationaal Watersportdiploma.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="mt-12 grid grid-cols-1 gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end">
          <SideNav
            label="Verenigingszaken"
            items={[
              {
                label: 'Manifest',
                href: '/vereniging/manifest',
              },
              {
                label: 'Vertrouwenspersoon',
                href: '/vereniging/vertrouwenspersoon',
              },
              {
                label: 'Gedragscode',
                href: '/vereniging/gedragscode',
              },
              {
                label: 'Bestuur',
                href: '/vereniging/bestuur',
              },
              {
                label: 'Secretariaat',
                href: '/vereniging/secretariaat',
              },
              {
                label: 'Kwaliteitscommissie',
                href: '/vereniging/kwaliteitscommissie',
              },
              {
                label: 'Statuten en reglementen',
                href: '/vereniging/statuten-en-reglementen',
              },
            ]}
            className="w-full sm:w-[18rem]"
          />
        </div>
        <div className="flex flex-col justify-center">{children}</div>
      </div>
    </main>
  )
}
