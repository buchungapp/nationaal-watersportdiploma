"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Combobox } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  NewspaperIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { Faq } from "~/lib/faqs";
import type { HelpArticleWithSlug } from "~/lib/help-articles";

export default function Search({
  questions,
  articles,
}: {
  questions: (Faq & { slug: string })[];
  articles: HelpArticleWithSlug[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();
  const posthog = usePostHog();

  const questionsFuse = useMemo(
    () =>
      new Fuse(questions, {
        includeMatches: true,
        keys: ["question"],
        minMatchCharLength: 2,
        ignoreLocation: true,
      }),
    [questions],
  );

  const articlesFuse = useMemo(
    () =>
      new Fuse(articles, {
        includeMatches: true,
        keys: ["title"],
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

  const filteredQuestions =
    query === "" ? [] : questionsFuse.search(deferredQuery);

  const filteredArticles =
    query === "" ? [] : articlesFuse.search(deferredQuery);

  return (
    <div className="relative mx-auto w-full transform divide-y divide-gray-100 rounded bg-white ring-1 ring-branding-light ring-opacity-95 transition-all md:max-w-xl">
      <Combobox
        onChange={(
          value:
            | ({ type: "question" } & (typeof questions)[number])
            | ({ type: "article" } & (typeof articles)[number]),
        ) => {
          if (value.type === "article") {
            router.push(`/helpcentrum/artikels/${value.slug}`);
            return;
          }

          const question = value as Faq & { slug: string };
          router.push(
            `/helpcentrum/veelgestelde-vragen/${question.categories.join("/")}/${question.slug}`,
          );
        }}
      >
        {({ open }) => (
          <>
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-2.5 h-5 w-5 text-gray-500 md:top-3 md:h-6 md:w-6"
                aria-hidden="true"
              />
              <Combobox.Input
                //   We can't have a smaller font on mobile, because iOS Safari would zoom in on the input
                className="h-10 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-500 focus:ring-0 sm:text-sm md:h-12 md:pl-12 lg:pl-14 lg:text-lg"
                placeholder="Typ een vraag, onderwerp of trefwoord.."
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {open && query !== "" ? (
              <div className="absolute inset-x-0 top-12 max-h-72 scroll-py-2 overflow-y-auto bg-white py-2 text-sm text-gray-800 shadow-sm ring-1 ring-black ring-opacity-5 lg:text-base">
                {filteredQuestions.length > 0 || filteredArticles.length > 0 ? (
                  <Combobox.Options>
                    {filteredArticles.map((fuse) => {
                      return (
                        <Combobox.Option
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
                          {fuse.item.title}
                        </Combobox.Option>
                      );
                    })}
                    {filteredQuestions.map((fuse) => {
                      return (
                        <Combobox.Option
                          key={fuse.item.question}
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
                          {fuse.item.question}
                        </Combobox.Option>
                      );
                    })}
                  </Combobox.Options>
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
