/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  NewspaperIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import FlexSearch from "flexsearch";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

export default function SearchClient({
  questions,
  articles,
}: {
  questions: {
    metadata: {
      question: string;
      lastUpdatedAt: string;
    };
    slug: string;
    content: string;
  }[];
  articles: {
    metadata: {
      lastUpdatedAt: string;
      title: string;
      publishedAt: string;
      summary: string;
    };
    slug: string;
    content: string;
    category: string;
  }[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();
  const posthog = usePostHog();

  const index = useMemo(() => {
    return new FlexSearch.Document({
      tokenize: "full",
      document: {
        id: "url",
        index: "content",
        store: ["title", "type"],
      },
      context: {
        resolution: 9,
        depth: 2,
        bidirectional: true,
      },
    });
  }, []);

  useEffect(() => {
    articles.forEach((article) => {
      index.add({
        url: article.slug,
        title: article.metadata.title,
        type: "article",
        content: [
          article.metadata.title,
          article.metadata.summary,
          article.content,
        ].join("\\n"),
      });
    });
  }, [articles]);

  useEffect(() => {
    questions.forEach((question) => {
      index.add({
        url: question.slug,
        title: question.metadata.question,
        type: "question",
        content: [question.metadata.question, question.content].join("\\n"),
      });
    });
  }, [questions]);

  useEffect(() => {
    posthog.capture("searched_faq", {
      query: deferredQuery,
    });
  }, [deferredQuery]);

  const filteredArticles = useMemo(() => {
    if (query === "") return [];

    const searchResult = index.search(query, { enrich: true });

    if (searchResult.length === 0) return [];

    return searchResult[0]!.result.map(
      // @ts-expect-error Type does not account for the enrich option
      (article: {
        id: string;
        doc: { type: "article" | "question"; title: string };
      }) => {
        return {
          url:
            article.doc.type === "article"
              ? `/help/artikel/${article.id}`
              : `/help/veelgestelde-vragen/${article.id}`,
          title: article.doc.title,
          type: article.doc.type,
        };
      },
    );
  }, [query, articles, index]);

  return (
    <div className="relative mx-auto w-full transform divide-y divide-gray-100 rounded bg-white ring-1 ring-branding-light ring-opacity-95 transition-all">
      <Combobox
        multiple={false}
        onChange={(value: { url: string }) => {
          if (!value) return;

          router.push(value.url);
        }}
      >
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-2.5 h-5 w-5 text-gray-500 md:top-3 md:h-6 md:w-6"
            aria-hidden="true"
          />
          <ComboboxInput
            //   We can't have a smaller font on mobile, because iOS Safari would zoom in on the input
            className="h-10 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-500 focus:ring-0 sm:text-sm md:h-12 md:pl-12 lg:pl-14 lg:text-lg"
            placeholder="Typ een vraag, onderwerp of trefwoord.."
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <ComboboxOptions
          as="div"
          anchor="bottom start"
          className={clsx(
            // Base styles
            "isolate w-[var(--input-width)] empty:invisible select-none scroll-py-1 rounded-xl p-1",

            // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
            "outline outline-1 outline-transparent focus:outline-none",

            // Handle scrolling when menu won't fit in viewport
            "overflow-y-scroll overscroll-contain",

            // Popover background
            "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

            // Shadows
            "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",

            // Transitions
            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0",
          )}
        >
          {filteredArticles.map((article) => {
            return (
              <ComboboxOption
                key={article.url}
                value={article}
                className="cursor-default select-none px-4 py-2 flex gap-1 data-[active]:bg-branding-light data-[active]:text-white"
              >
                {article.type === "article" ? (
                  <NewspaperIcon className="w-6 h-6 shrink-0" />
                ) : (
                  <QuestionMarkCircleIcon className="w-6 h-6 shrink-0" />
                )}
                {article.title}
              </ComboboxOption>
            );
          })}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
