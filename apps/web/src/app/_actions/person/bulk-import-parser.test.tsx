import { describe, expect, it } from "vitest";
import { parseRowsTolerant } from "./bulk-import-parser";
import type { CSVData } from "./person-bulk-csv-mappings";

const countries = [
  { code: "nl", name: "Nederland" },
  { code: "at", name: "Oostenrijk" },
];

describe("parseRowsTolerant", () => {
  it("parses rows when tag columns are before and between mapped person fields", () => {
    const csvData: CSVData = {
      labels: null,
      rows: [
        [
          "Jeugd",
          "Renkema",
          "02-01-2014",
          "Wenen",
          "AT",
          "arne@example.com",
          "Arne",
          "Ochtend",
          "",
        ],
      ],
    };

    const result = parseRowsTolerant(
      csvData,
      {
        "include-column-0": "Tag",
        "include-column-1": "Achternaam",
        "include-column-2": "Geboortedatum",
        "include-column-3": "Geboorteplaats",
        "include-column-4": "Geboorteland",
        "include-column-5": "E-mailadres",
        "include-column-6": "Voornaam",
        "include-column-7": "Tag",
        "include-column-8": "Tussenvoegsels",
      },
      countries,
    );

    expect(result.parseErrors).toEqual([]);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      rowIndex: 0,
      email: "arne@example.com",
      firstName: "Arne",
      lastNamePrefix: null,
      lastName: "Renkema",
      birthCity: "Wenen",
      birthCountry: "at",
      tags: ["Jeugd", "Ochtend"],
    });
    expect(result.parsedRows[0]?.dateOfBirth.toISOString().slice(0, 10)).toBe(
      "2014-01-02",
    );
  });
});
