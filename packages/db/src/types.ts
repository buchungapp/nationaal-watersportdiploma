import type * as schema from "./schema/index.ts";
import type * as uncontrolledSchema from "./uncontrolled_schema/index.ts";

export type FullSchema = typeof schema & typeof uncontrolledSchema;
