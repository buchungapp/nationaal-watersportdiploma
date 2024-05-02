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
import type { listCertificates } from "~/lib/nwd";

export default function CertificateTable({
  certificates,
}: {
  certificates: Awaited<ReturnType<typeof listCertificates>>;
}) {
  return (
    <>
      <Table className="mt-8">
        <TableHead>
          <TableRow className="border-b border-tremor-border dark:border-dark-tremor-border">
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Nummer
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Cursist
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Programma
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Boottype
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Behaald op
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {certificates.map((certificate) => (
            <TableRow key={certificate.id}>
              <TableCell>{`${certificate.handle}`}</TableCell>
              <TableCell className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {[
                  certificate.student.firstName,
                  certificate.student.lastNamePrefix,
                  certificate.student.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </TableCell>
              <TableCell>{certificate.program.title}</TableCell>
              <TableCell>{certificate.gearType.title}</TableCell>
              <TableCell>
                {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
