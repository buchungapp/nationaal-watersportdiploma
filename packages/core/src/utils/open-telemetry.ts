import * as opentelemetry from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";
import { flatten } from "flat";
import { CoreError } from "./error.js";

// Lazy initialization of tracers
const getCommandTracer = () => opentelemetry.trace.getTracer("core/command");
const getQueryTracer = () => opentelemetry.trace.getTracer("core/query");

type TracerFunction = <R, A extends unknown[]>(
  name: string,
  task: (...args: A) => Promise<R>,
) => (...args: A) => Promise<R>;

const createWrapper = (
  getTracer: () => opentelemetry.Tracer,
  kind: "query" | "command",
): TracerFunction => {
  return (name, task) => {
    return async (...args) => {
      const tracer = getTracer();

      return tracer.startActiveSpan(
        name,
        {
          attributes: {
            operation: name,
            ...(args
              ? Object.fromEntries(
                  Object.entries(
                    flatten(args, {
                      delimiter: ".",
                    }) as Record<string, unknown>,
                  ).map(([key, value]) => [`input.${key}`, value]),
                )
              : {}),
          },
        },
        async (span) => {
          try {
            const result = await task(...args);

            span.setStatus({ code: SpanStatusCode.OK });

            return result;
          } catch (error) {
            const coreError = CoreError.fromUnknown(error);
            // Tag the deepest (innermost) operation that failed. If an outer
            // wrapper re-catches, we keep the inner name so reporters surface
            // the actual culprit, not the top-level handler.
            coreError.failingQuery ??= name;
            coreError.failingQueryKind ??= kind;
            span.recordException(coreError);

            throw coreError;
          } finally {
            span.end();
          }
        },
      );
    };
  };
};

export const wrapCommand: TracerFunction = createWrapper(
  getCommandTracer,
  "command",
);
export const wrapQuery: TracerFunction = createWrapper(getQueryTracer, "query");
