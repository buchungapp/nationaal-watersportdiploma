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
import { useDeferredValue, useEffect, useMemo, useState } from "react";

export default function FaqSearch({
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    for (const article of articles) {
      index.add({
        url: article.slug,
        title: article.metadata.title,
        type: "article",
        content: [
          article.metadata.title,
          article.metadata.summary,
          article.content,
        ].join("\n"),
      });
    }
  }, [articles]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    for (const question of questions) {
      index.add({
        url: question.slug,
        title: question.metadata.question,
        type: "question",
        content: [question.metadata.question, question.content].join("\n"),
      });
    }
  }, [questions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const filteredResults = useMemo(() => {
    if (deferredQuery === "") return [];

    const searchResult = index.search(deferredQuery, { enrich: true });

    if (searchResult.length === 0) return [];

    // biome-ignore lint/style/noNonNullAssertion: intentional
    return searchResult[0]!.result
      .slice(0, 5)
      .map(
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
  }, [deferredQuery, articles, index]);

  return (
    <div className="relative w-full">
      <Combobox
        multiple={false}
        onChange={(value: { url: string } | null) => {
          if (!value) return;
          router.push(value.url);
        }}
      >
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400"
            aria-hidden="true"
          />
          <ComboboxInput
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-branding-light focus:bg-white focus:ring-2 focus:ring-branding-light/20 focus:outline-none transition-all"
            placeholder="Stel je vraag of zoek een onderwerp..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <ComboboxOptions
          as="div"
          anchor="bottom start"
          className={clsx(
            "isolate w-[var(--input-width)] empty:invisible select-none scroll-py-1 rounded-xl p-1 mt-2",
            "outline outline-1 outline-transparent focus:outline-hidden",
            "overflow-y-scroll overscroll-contain",
            "bg-white backdrop-blur-xl",
            "shadow-lg ring-1 ring-slate-200",
            "transition duration-100 ease-in data-leave:data-closed:opacity-0",
          )}
        >
          {filteredResults.map(
            (result: {
              url: string;
              title: string;
              type: "article" | "question";
            }) => (
              <ComboboxOption
                key={result.url}
                value={result}
                className="cursor-default select-none rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-sm text-slate-700 data-active:bg-branding-light/10 data-active:text-branding-dark"
              >
                {result.type === "article" ? (
                  <NewspaperIcon className="size-4.5 shrink-0 text-slate-400 data-active:text-branding-light" />
                ) : (
                  <QuestionMarkCircleIcon className="size-4.5 shrink-0 text-slate-400 data-active:text-branding-light" />
                )}
                <span className="truncate">{result.title}</span>
              </ComboboxOption>
            ),
          )}
          {deferredQuery !== "" && filteredResults.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              Geen resultaten gevonden
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
