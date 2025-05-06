import { createParser, parseAsString } from "nuqs/server";

export const parseAsSearchQuery = createParser({
  parse: (v) => {
    const string = parseAsString.parse(v);
    if (!string) return null;
    return decodeURIComponent(string);
  },
  serialize: (v) => parseAsString.serialize(v),
});
