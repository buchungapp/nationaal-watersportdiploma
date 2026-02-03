"use client";

import {
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { formatters } from "@nawadi/lib";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import fuzzysort from "fuzzysort";
import Link from "next/link";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import { ExportQualificationsDialog } from "./export-qualifications-dialog";

type Instructor = {
  id: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
  handle: string;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: {
    name: string;
    code: string;
  } | null;
  email: string | null;
};

type Course = {
  id: string;
  handle: string;
  title: string | null;
  abbreviation: string | null;
};

type Kwalificatie = {
  personId: string;
  courseId: string;
  richting: string;
  hoogsteNiveau: number;
};

interface KwalificatiesTableProps {
  instructors: Instructor[];
  courses: Course[];
  kwalificaties: Kwalificatie[];
  locationHandle: string;
}

const niveaus = [1, 2, 3, 4, 5];
const types = {
  instructeur: "Instructeur",
  leercoach: "Leercoach",
  pvb_beoordelaar: "PVB beoordelaar",
};

export function KwalificatiesTable({
  instructors,
  courses,
  kwalificaties,
  locationHandle,
}: KwalificatiesTableProps) {
  // Reference to the scrollable container
  const parentRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    niveaus: typeof niveaus;
    types: (keyof typeof types)[];
  }>({
    niveaus,
    types: Object.keys(types) as (keyof typeof types)[],
  });

  // Column visibility state - all courses visible by default
  const [visibleCourseIds, setVisibleCourseIds] = useState<Set<string>>(
    new Set(courses.map((c) => c.id)),
  );

  // Create a map for quick lookup of qualifications
  const kwalificatieMap = useMemo(() => {
    const map = new Map<string, Map<string, Kwalificatie[]>>();

    for (const kwal of kwalificaties) {
      if (!map.has(kwal.personId)) {
        map.set(kwal.personId, new Map());
      }
      const personMap = map.get(kwal.personId);
      if (!personMap) continue;

      if (!personMap.has(kwal.courseId)) {
        personMap.set(kwal.courseId, []);
      }
      const courseArray = personMap.get(kwal.courseId);
      if (courseArray) {
        courseArray.push(kwal);
      }
    }

    return map;
  }, [kwalificaties]);

  // Filter courses that have a title and are visible
  const displayCourses = useMemo(
    () =>
      courses.filter(
        (course) => course.title !== null && visibleCourseIds.has(course.id),
      ),
    [courses, visibleCourseIds],
  );

  // Prepare instructors for fuzzysort with multiple search keys
  const preparedInstructors = useMemo(() => {
    return instructors.map((instructor) => ({
      instructor,
      // Add formatted name for better search
      fullName: formatters.formatPersonName(instructor),
      // Add searchable fields
      searchableText: [
        instructor.firstName,
        instructor.lastName,
        instructor.lastNamePrefix,
        instructor.handle,
        formatters.formatPersonName(instructor),
      ]
        .filter(Boolean)
        .join(" "),
    }));
  }, [instructors]);

  // Filter and sort instructors using fuzzysort
  const filteredAndSortedInstructors = useMemo(() => {
    const isFiltered =
      filters.niveaus.length < niveaus.length ||
      filters.types.length < Object.keys(types).length;
    const showWithoutKwalificaties =
      filters.niveaus.length === 0 || filters.types.length === 0;

    const filtered = isFiltered
      ? preparedInstructors.filter((instructor) => {
          const kwalificaties = kwalificatieMap.get(instructor.instructor.id);
          if (!kwalificaties) return showWithoutKwalificaties;

          return kwalificaties.entries().some(([_courseId, kwalificaties]) => {
            return kwalificaties.some((kwal) => {
              return (
                filters.niveaus.includes(kwal.hoogsteNiveau) &&
                filters.types.includes(kwal.richting as keyof typeof types)
              );
            });
          });
        })
      : preparedInstructors;

    if (searchQuery.trim()) {
      // Use fuzzysort with multiple keys for better search results
      const results = fuzzysort.go(searchQuery.trim(), filtered, {
        keys: ["fullName", "searchableText"],
        threshold: -10000, // Lower threshold for more inclusive results
        limit: 1000, // High limit to get all relevant results
      });

      // Extract the original instructor objects from the results
      return results.map((result) => result.obj.instructor);
    }

    // Sort by name and handle
    return filtered
      .map((instructor) => instructor.instructor)
      .toSorted((a, b) => {
        const aName = formatters.formatPersonName(a);
        const bName = formatters.formatPersonName(b);

        if (aName < bName) return -1;
        if (aName > bName) return 1;

        if (a.handle < b.handle) return -1;
        if (a.handle > b.handle) return 1;

        return 0;
      });
  }, [preparedInstructors, searchQuery, kwalificatieMap, filters]);

  // Set up the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedInstructors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Increased estimated row height for longer names
    overscan: 5, // Render 5 items outside of the visible area
  });

  function toggleCourseVisibility(courseId: string) {
    setVisibleCourseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }

  function toggleAllCourses(visible: boolean) {
    if (visible) {
      setVisibleCourseIds(new Set(courses.map((c) => c.id)));
    } else {
      setVisibleCourseIds(new Set());
    }
  }

  function getKwalificatieDisplay(
    personId: string,
    courseId: string,
  ): React.ReactNode {
    const personMap = kwalificatieMap.get(personId);
    if (!personMap) return "";

    const courseKwalificaties = personMap.get(courseId);
    if (!courseKwalificaties || courseKwalificaties.length === 0) return "";

    // Group by richting and show highest level for each
    const byRichting = courseKwalificaties.reduce(
      (acc, kwal) => {
        const existing = acc[kwal.richting];
        if (!existing || kwal.hoogsteNiveau > existing) {
          acc[kwal.richting] = kwal.hoogsteNiveau;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Sort by priority: instructeur, leercoach, pvb_beoordelaar
    const sortedEntries = Object.entries(byRichting).sort(([a], [b]) => {
      const order = { instructeur: 0, leercoach: 1, pvb_beoordelaar: 2 };
      return (
        (order[a as keyof typeof order] || 3) -
        (order[b as keyof typeof order] || 3)
      );
    });

    // Format the display with visual separation
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {sortedEntries.map(([richting, niveau]) => {
          const richtingConfig = {
            instructeur: {
              abbr: "I",
              baseColor: "blue",
            },
            leercoach: {
              abbr: "L",
              baseColor: "green",
            },
            pvb_beoordelaar: {
              abbr: "B",
              baseColor: "purple",
            },
          };

          const config = richtingConfig[
            richting as keyof typeof richtingConfig
          ] || {
            abbr: richting.charAt(0).toUpperCase(),
            baseColor: "gray",
          };

          // Create different intensities based on niveau (1-5 scale)
          const getColorClasses = (baseColor: string, niveau: number) => {
            const colorMap = {
              blue: {
                1: "bg-blue-50 text-blue-600 border-blue-200",
                2: "bg-blue-100 text-blue-700 border-blue-300",
                3: "bg-blue-200 text-blue-800 border-blue-400",
                4: "bg-blue-300 text-blue-900 border-blue-500",
                5: "bg-blue-400 text-white border-blue-600",
              },
              green: {
                1: "bg-emerald-50 text-emerald-600 border-emerald-200",
                2: "bg-emerald-100 text-emerald-700 border-emerald-300",
                3: "bg-emerald-200 text-emerald-800 border-emerald-400",
                4: "bg-emerald-300 text-emerald-900 border-emerald-500",
                5: "bg-emerald-500 text-white border-emerald-700",
              },
              purple: {
                1: "bg-purple-50 text-purple-600 border-purple-200",
                2: "bg-purple-100 text-purple-700 border-purple-300",
                3: "bg-purple-200 text-purple-800 border-purple-400",
                4: "bg-purple-300 text-purple-900 border-purple-500",
                5: "bg-purple-500 text-white border-purple-700",
              },
              gray: {
                1: "bg-gray-100 text-gray-700 border-gray-300",
                2: "bg-gray-200 text-gray-800 border-gray-400",
                3: "bg-gray-300 text-gray-900 border-gray-500",
                4: "bg-gray-400 text-gray-950 border-gray-600",
                5: "bg-gray-500 text-white border-gray-700",
              },
            };

            const colors =
              colorMap[baseColor as keyof typeof colorMap] || colorMap.gray;
            return colors[niveau as keyof typeof colors] || colors[3];
          };

          const colorClasses = getColorClasses(config.baseColor, niveau);

          return (
            <span
              key={richting}
              className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${colorClasses}`}
            >
              {config.abbr}-{niveau}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Search and column controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="top-2.5 left-2.5 absolute w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Zoek instructeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="relative">
          <Popover className="relative">
            <PopoverButton outline>
              <AdjustmentsHorizontalIcon className="mr-2 w-4 h-4" />
              Kolommen ({visibleCourseIds.size}/{courses.length})
            </PopoverButton>
            <PopoverPanel
              anchor="bottom end"
              className="flex flex-col gap-1 p-2 min-w-[250px] max-h-96 overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => toggleAllCourses(true)}
                className="hover:bg-gray-50 px-3 py-2 rounded w-full font-medium text-sm text-left"
              >
                Alles selecteren
              </button>
              <button
                type="button"
                onClick={() => toggleAllCourses(false)}
                className="hover:bg-gray-50 px-3 py-2 rounded w-full font-medium text-sm text-left"
              >
                Alles deselecteren
              </button>
              <div className="my-1 border-gray-200 border-t" />
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded w-full cursor-pointer"
                  onClick={() => toggleCourseVisibility(course.id)}
                >
                  <Checkbox
                    checked={visibleCourseIds.has(course.id)}
                    onChange={() => {}}
                    className="pointer-events-none"
                  />
                  <span className="text-sm text-left">
                    {course.abbreviation || course.title}
                  </span>
                </button>
              ))}
            </PopoverPanel>
          </Popover>
        </div>

        <Popover>
          <PopoverButton outline className={clsx("border-branding-dark/10")}>
            <FunnelIcon /> Niveaus
          </PopoverButton>
          <PopoverPanel anchor="bottom end" modal className="min-w-64">
            <div className="py-2.5">
              <Subheading className="px-3">Niveaus</Subheading>
              {niveaus.map((niveau) => (
                <CheckboxField
                  key={niveau}
                  disabled={false}
                  className={clsx("flex-1 px-4 py-1.5 cursor-default")}
                >
                  <Checkbox
                    checked={filters.niveaus.includes(niveau)}
                    onChange={() => {
                      setFilters((prev) => ({
                        ...prev,
                        niveaus: prev.niveaus.includes(niveau)
                          ? prev.niveaus.filter((t) => t !== niveau)
                          : [...prev.niveaus, niveau],
                      }));
                    }}
                  />

                  <Label className="w-full">Niveau {niveau}</Label>
                </CheckboxField>
              ))}
            </div>
            <div className="pb-2.5">
              <Subheading className="px-3">Type</Subheading>
              {Object.entries(types).map(([key, value]) => (
                <CheckboxField
                  key={key}
                  disabled={false}
                  className={clsx("flex-1 px-4 py-1.5 cursor-default")}
                >
                  <Checkbox
                    checked={filters.types.includes(key as keyof typeof types)}
                    onChange={() => {
                      setFilters((prev) => ({
                        ...prev,
                        types: prev.types.includes(key as keyof typeof types)
                          ? prev.types.filter((t) => t !== key)
                          : [...prev.types, key as keyof typeof types],
                      }));
                    }}
                  />

                  <Label className="w-full">{value}</Label>
                </CheckboxField>
              ))}
            </div>
            <Divider />
            <Button
              plain
              className="rounded-none w-full"
              onClick={() => {
                setFilters({
                  niveaus,
                  types: Object.keys(types) as (keyof typeof types)[],
                });
              }}
            >
              Toon alles
            </Button>
          </PopoverPanel>
        </Popover>

        <ExportQualificationsDialog
          instructors={filteredAndSortedInstructors}
          courses={courses}
          kwalificaties={kwalificaties}
          locationHandle={locationHandle}
        />
      </div>

      {/* Table */}
      <div style={{ position: "relative" }}>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{
            maxHeight: "calc(100vh - 250px)",
            position: "relative",
          }}
        >
          <table className="min-w-full text-sm/6 text-left">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th
                  className="bg-white shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)] px-4 py-1.5 border-gray-200 border-r border-b border-b-zinc-950/10 min-w-[120px] sm:min-w-[200px] font-medium"
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 30,
                  }}
                >
                  Instructeur
                </th>
                {displayCourses.map((course) => (
                  <th
                    key={course.id}
                    className="bg-white px-2 sm:px-4 py-1.5 border-b border-b-zinc-950/10 min-w-[60px] sm:min-w-[100px] font-medium text-center"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                    }}
                  >
                    <span className="hidden sm:inline">
                      {course.abbreviation ?? course.title}
                    </span>
                    <span className="sm:hidden">
                      {course.abbreviation ?? course.title?.substring(0, 3)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInstructors.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayCourses.length + 1}
                    className="py-8 text-gray-500 text-center"
                  >
                    {searchQuery
                      ? "Geen instructeurs gevonden"
                      : "Geen instructeurs"}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Spacer for virtual scrolling */}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr>
                      <td
                        colSpan={displayCourses.length + 1}
                        style={{
                          height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`,
                        }}
                      />
                    </tr>
                  )}

                  {/* Virtual rows */}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const instructor =
                      filteredAndSortedInstructors[virtualRow.index];
                    if (!instructor) return null;

                    const isEven = virtualRow.index % 2 === 1;

                    return (
                      <tr
                        key={virtualRow.key}
                        className={isEven ? "bg-gray-50" : ""}
                      >
                        <td
                          className={`relative px-2 sm:px-4 py-3 font-medium border-r border-gray-200 min-w-[120px] sm:min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)] ${isEven ? "bg-gray-50" : "bg-white"}`}
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                          }}
                        >
                          <Link
                            href={`/locatie/${locationHandle}/personen/${instructor.id}`}
                            className="block hover:underline"
                          >
                            <div className="break-words leading-tight">
                              <div className="text-zinc-700 hover:text-zinc-900 sm:break-words truncate sm:whitespace-normal">
                                {formatters.formatPersonName(instructor)}
                              </div>
                              <div className="font-mono font-normal text-gray-500 text-xs truncate">
                                {instructor.handle}
                              </div>
                            </div>
                          </Link>
                        </td>
                        {displayCourses.map((course) => (
                          <td
                            key={course.id}
                            className="relative px-1 sm:px-4 py-3 min-w-[60px] sm:min-w-[100px] text-center align-middle"
                          >
                            {getKwalificatieDisplay(instructor.id, course.id)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Bottom spacer */}
                  {rowVirtualizer.getTotalSize() > 0 && (
                    <tr>
                      <td
                        colSpan={displayCourses.length + 1}
                        style={{
                          height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems().at(-1)?.end || 0)}px`,
                        }}
                      />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
