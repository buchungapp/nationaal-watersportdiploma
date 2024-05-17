"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

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
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

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

  const fuse = useMemo(
    () =>
      new Fuse(questions, {
        includeMatches: true,
        keys: ["metadata.question"],
        minMatchCharLength: 2,
        ignoreLocation: true,
      }),
    [questions],
  );

  const articlesFuse = useMemo(
    () =>
      new Fuse(articles, {
        includeMatches: true,
        keys: ["metadata.title"],
        minMatchCharLength: 2,
        ignoreLocation: true,
      }),
    [articles],
  );

  useEffect(() => {
    posthog.capture("searched_faq", {
      query: deferredQuery,
    });
  }, [deferredQuery]);

  const filteredQuestions = query === "" ? [] : fuse.search(deferredQuery);
  const filteredArticles =
    query === "" ? [] : articlesFuse.search(deferredQuery);

  return (
    <div className="relative mx-auto w-full transform divide-y divide-gray-100 rounded bg-white ring-1 ring-branding-light ring-opacity-95 transition-all">
      <Combobox
        onChange={(
          value:
            | ({ type: "question" } & (typeof questions)[number])
            | ({ type: "article" } & (typeof articles)[number])
            | undefined,
        ) => {
          if (!value) return;

          if (value.type === "article") {
            router.push(`/help/artikel/${value.slug}`);
            return;
          }

          router.push(`/help/veelgestelde-vragen/${value.slug}`);
        }}
      >
        {({ open }) => (
          <>
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

            {open && query !== "" ? (
              <div className="absolute inset-x-0 top-12 max-h-72 scroll-py-2 overflow-y-auto bg-white py-2 text-sm text-gray-800 shadow-sm ring-1 ring-black ring-opacity-5 lg:text-base">
                {filteredQuestions.length > 0 || filteredArticles.length > 0 ? (
                  <ComboboxOptions>
                    {filteredArticles.map((fuse) => {
                      return (
                        <ComboboxOption
                          key={fuse.item.slug}
                          value={{
                            type: "article",
                            ...fuse.item,
                          }}
                          className={({ active }) =>
                            clsx(
                              "cursor-default select-none px-4 py-2 flex gap-1",
                              active && "bg-branding-light text-white",
                            )
                          }
                        >
                          <NewspaperIcon className="w-6 h-6 shrink-0" />{" "}
                          {fuse.item.metadata.title}
                        </ComboboxOption>
                      );
                    })}
                    {filteredQuestions.map((fuse) => {
                      return (
                        <ComboboxOption
                          key={fuse.item.slug}
                          value={{
                            type: "question",
                            ...fuse.item,
                          }}
                          className={({ active }) =>
                            clsx(
                              "cursor-default select-none px-4 py-2 flex gap-1",
                              active && "bg-branding-light text-white",
                            )
                          }
                        >
                          <QuestionMarkCircleIcon className="w-6 h-6 shrink-0" />{" "}
                          {fuse.item.metadata.question}
                        </ComboboxOption>
                      );
                    })}
                  </ComboboxOptions>
                ) : null}

                {filteredQuestions.length === 0 &&
                filteredArticles.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-gray-500 lg:text-base">
                    Geen resultaten gevonden.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </Combobox>
    </div>
  );
}
