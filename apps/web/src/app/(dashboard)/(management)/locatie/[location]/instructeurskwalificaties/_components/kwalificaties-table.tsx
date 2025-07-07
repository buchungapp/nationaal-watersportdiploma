"use client";

import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import Link from "next/link";
import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";

type Instructor = {
  id: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
  handle: string;
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

  // Helper function to normalize strings for search
  const normalizeString = useCallback((str: string) => {
    return str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "") // Remove diacritics
      .toLowerCase();
  }, []);

  // Set up Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(instructors, {
        keys: ["firstName", "lastNamePrefix", "lastName", "handle"],
        threshold: 0.3,
        // Make search less strict for special characters
        shouldSort: true,
        includeScore: false,
        useExtendedSearch: false,
        // Handle diacritics and special characters
        getFn: (obj, path) => {
          const value = Fuse.config.getFn(obj, path);
          if (typeof value === "string") {
            return normalizeString(value);
          }
          return value;
        },
      }),
    [instructors, normalizeString],
  );

  // Filter and sort instructors
  const filteredAndSortedInstructors = useMemo(() => {
    let filtered = instructors;

    if (searchQuery) {
      // Don't normalize the search query - Fuse.js handles normalization via getFn
      filtered = fuse.search(searchQuery).map((result) => result.item);
    }

    return filtered.sort((a, b) => {
      const nameA = formatName(a);
      const nameB = formatName(b);
      return nameA.localeCompare(nameB);
    });
  }, [instructors, searchQuery, fuse]);

  // Set up the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedInstructors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Increased estimated row height for longer names
    overscan: 5, // Render 5 items outside of the visible area
  });

  function formatName(person: Instructor): string {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  }

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
      <div className="flex flex-wrap gap-0.5 justify-center">
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
                1: "bg-blue-100 text-blue-700 border-blue-200",
                2: "bg-blue-100 text-blue-800 border-blue-300",
                3: "bg-blue-200 text-blue-900 border-blue-400",
                4: "bg-blue-500 text-white border-blue-600",
                5: "bg-blue-600 text-white border-blue-700",
              },
              green: {
                1: "bg-lime-100 text-lime-700 border-lime-200",
                2: "bg-lime-100 text-lime-800 border-lime-300",
                3: "bg-lime-200 text-lime-900 border-lime-400",
                4: "bg-lime-500 text-white border-lime-600",
                5: "bg-lime-600 text-white border-lime-700",
              },
              purple: {
                1: "bg-violet-100 text-violet-700 border-violet-200",
                2: "bg-violet-100 text-violet-800 border-violet-300",
                3: "bg-violet-200 text-violet-900 border-violet-400",
                4: "bg-violet-500 text-white border-violet-600",
                5: "bg-violet-600 text-white border-violet-700",
              },
              gray: {
                1: "bg-gray-100 text-gray-700 border-gray-200",
                2: "bg-gray-100 text-gray-800 border-gray-300",
                3: "bg-gray-200 text-gray-900 border-gray-400",
                4: "bg-gray-500 text-white border-gray-600",
                5: "bg-gray-600 text-white border-gray-700",
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
              className={`inline-flex items-center px-0.5 sm:px-1 py-0 rounded text-[10px] sm:text-xs font-medium border ${colorClasses}`}
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
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
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
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Kolommen ({visibleCourseIds.size}/{courses.length})
            </PopoverButton>
            <PopoverPanel
              anchor="bottom end"
              className="flex flex-col gap-1 max-h-96 overflow-y-auto min-w-[250px] p-2"
            >
              <button
                type="button"
                onClick={() => toggleAllCourses(true)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded font-medium"
              >
                Alles selecteren
              </button>
              <button
                type="button"
                onClick={() => toggleAllCourses(false)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded font-medium"
              >
                Alles deselecteren
              </button>
              <div className="border-t border-gray-200 my-1" />
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer w-full"
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
                  className="border-b border-b-zinc-950/10 px-4 py-2 font-medium bg-white border-r border-gray-200 min-w-[120px] sm:min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]"
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
                    className="border-b border-b-zinc-950/10 px-2 sm:px-4 py-2 font-medium text-center min-w-[60px] sm:min-w-[100px] bg-white"
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
                    className="text-center py-8 text-gray-500"
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
                          className={`relative px-2 sm:px-4 py-2 font-medium border-r border-gray-200 min-w-[120px] sm:min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)] ${isEven ? "bg-gray-50" : "bg-white"}`}
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                          }}
                        >
                          <Link
                            href={`/locatie/${locationHandle}/personen/${instructor.id}`}
                            className="hover:underline block"
                          >
                            <div className="break-words leading-tight">
                              <div className="truncate sm:whitespace-normal sm:break-words text-zinc-700 hover:text-zinc-900">
                                {formatName(instructor)}
                              </div>
                              <div className="text-xs text-gray-500 font-normal truncate">
                                {instructor.handle}
                              </div>
                            </div>
                          </Link>
                        </td>
                        {displayCourses.map((course) => (
                          <td
                            key={course.id}
                            className="relative px-1 sm:px-4 py-2 text-center min-w-[60px] sm:min-w-[100px] align-middle"
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
