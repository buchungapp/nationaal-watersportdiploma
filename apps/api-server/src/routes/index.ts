import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types.js";
import { cohortsRouter } from "./cohorts.js";
import { personsRouter } from "./persons.js";
import { studentsRouter } from "./students.js";

// Mount each resource at its own prefix. Students live under `/v1/cohorts`
// because the path is `cohorts/{id}/students` — splitting that into a
// separate router keeps the OpenAPI tags clean (Cohorts vs. Students)
// without forcing a parent/child fork in the URL.
export function mountRouters(app: OpenAPIHono<Env>): void {
  app.route("/v1/cohorts", cohortsRouter);
  app.route("/v1/cohorts", studentsRouter);
  app.route("/v1/persons", personsRouter);
}
