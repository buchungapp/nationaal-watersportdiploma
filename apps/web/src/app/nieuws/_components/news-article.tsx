import { Prose } from '~/app/_components/prose'
import PageHero from '~/app/_components/style/page-hero'
import { ArticleWithSlug } from '~/lib/articles'
import { formatDate } from '../_utils/format-date'
import { Container } from './container'

export function ArticleLayout({
  article,
  children,
}: {
  article: ArticleWithSlug
  children: React.ReactNode
}) {
  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <time
              dateTime={article.date}
              className="order-first text-base text-gray-50"
            >
              {formatDate(article.date)}
            </time>
            <h1 className="text-4xl font-bold lg:text-5xl">{article.title}</h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <article>
            <Prose className="mt-8" data-mdx-content>
              {children}
            </Prose>
          </article>
        </div>
      </Container>
    </>
  )
}
