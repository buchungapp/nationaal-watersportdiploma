import type * as schema from "./schema/index.js";
import type * as uncontrolledSchema from "./uncontrolled_schema/index.js";

export type FullSchema = typeof schema & typeof uncontrolledSchema;
