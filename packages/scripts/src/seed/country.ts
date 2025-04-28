import { useQuery } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { countries } from "./countries.js";

export async function addCountries() {
  const query = useQuery();
  await query.insert(s.country).values(countries);
}
