"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import dayjs from "dayjs";
import type { listPersonsForLocation } from "~/lib/nwd";

export default function PersonsTable({
  persons,
}: {
  persons: Awaited<ReturnType<typeof listPersonsForLocation>>;
}) {
  return (
    <>
      <Table className="mt-8">
        <TableHead>
          <TableRow className="border-b border-tremor-border dark:border-dark-tremor-border">
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Naam
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Geboortedatum
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Geboorteplaats
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Rollen
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {persons.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {[person.firstName, person.lastNamePrefix, person.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </TableCell>
              <TableCell>
                {person.dateOfBirth
                  ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
                  : null}
              </TableCell>
              <TableCell>{person.birthCity}</TableCell>
              <TableCell>
                {person.actors.map((actor) => {
                  return (
                    <span key={actor.id} className="block">
                      {actor.type}
                    </span>
                  );
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
