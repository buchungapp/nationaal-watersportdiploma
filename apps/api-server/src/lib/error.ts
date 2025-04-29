import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { z } from "zod";
import { fromError as fromZodError } from "zod-validation-error";

export const ErrorCode = z.enum([
  "bad_request",
  "not_found",
  "internal_server_error",
  "unauthorized",
  "forbidden",
  "rate_limit_exceeded",
  "method_not_supported",
  "unsupported_media_type",
  "not_implemented",
  "unprocessable_entity",
]);

export const errorCodeToHttpStatus: Record<
  z.infer<typeof ErrorCode>,
  api.lib.StatusCode
> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limit_exceeded: 429,
  internal_server_error: 500,
  method_not_supported: 405,
  unsupported_media_type: 415,
  not_implemented: 501,
  unprocessable_entity: 422,
};

export const httpStatusToErrorCode = Object.fromEntries(
  Object.entries(errorCodeToHttpStatus).map(([code, status]) => [status, code]),
) as Record<api.lib.StatusCode, z.infer<typeof ErrorCode>>;

const ErrorSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type ErrorCodes = z.infer<typeof ErrorCode>;

export class NwdApiError extends Error {
  public readonly code: z.infer<typeof ErrorCode>;

  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>;
    message: string;
  }) {
    super(message);
    this.code = code;
  }

  public static fromUnknown(error: unknown) {
    if (error instanceof NwdApiError) {
      return error;
    }

    if (error instanceof core.CoreError) {
      return NwdApiError.fromCoreError(error);
    }

    if (error instanceof api.lib.ServerError) {
      return NwdApiError.fromSkiffaError(error);
    }

    return new NwdApiError({
      code: "internal_server_error",
      message:
        "An internal server error occurred. Please contact support if the problem persists.",
    });
  }

  public static fromZodError(error: z.ZodError) {
    return new NwdApiError({
      code: "unprocessable_entity",
      message: fromZodError(error).toString(),
    });
  }

  public static fromSkiffaError(error: api.lib.ServerError) {
    if (
      error instanceof api.lib.ServerRequestEntityValidationFailed ||
      error instanceof api.lib.ServerRequestParameterValidationFailed
    ) {
      return new NwdApiError({
        code: "unprocessable_entity",
        message: error.message,
      });
    }
    if (error instanceof api.lib.AuthenticationFailed) {
      return new NwdApiError({
        code: "unauthorized",
        message: error.message,
      });
    }
    if (error instanceof api.lib.NoRouteFound) {
      return new NwdApiError({
        code: "not_found",
        message: error.message,
      });
    }
    if (error instanceof api.lib.MethodNotSupported) {
      return new NwdApiError({
        code: "method_not_supported",
        message: error.message,
      });
    }
    if (
      error instanceof api.lib.ServerRequestMissingContentType ||
      error instanceof api.lib.ServerRequestUnexpectedContentType
    ) {
      return new NwdApiError({
        code: "unsupported_media_type",
        message: error.message,
      });
    }
    if (error instanceof api.lib.OperationNotImplemented) {
      return new NwdApiError({
        code: "not_implemented",
        message: error.message,
      });
    }

    return new NwdApiError({
      code: "internal_server_error",
      message: error.message,
    });
  }

  public static fromCoreError(error: core.CoreError) {
    switch (error.type) {
      case core.CoreErrorType.Unexpected:
        return new NwdApiError({
          code: "internal_server_error",
          message: `Unknown error: ${error.message}`,
        });

      case core.CoreErrorType.Other:
        return new NwdApiError({
          code: "internal_server_error",
          message: `Unknown error: ${error.message}`,
        });

      case core.CoreErrorType.ForeignKey:
        return new NwdApiError({
          code: "bad_request",
          message: `Foreign key constraint violated: ${error.message}`,
        });

      case core.CoreErrorType.UniqueKey:
        return new NwdApiError({
          code: "bad_request",
          message: `Unique key constraint violated: ${error.message}`,
        });

      case core.CoreErrorType.NotNull:
        return new NwdApiError({
          code: "bad_request",
          message: `Not null constraint violated: ${error.message}`,
        });

      case core.CoreErrorType.Check:
        return new NwdApiError({
          code: "bad_request",
          message: `Check constraint violated: ${error.message}`,
        });

      case core.CoreErrorType.Validation:
        return new NwdApiError({
          code: "unprocessable_entity",
          message: `Validation failed: ${error.message}`,
        });

      case core.CoreErrorType.MissingValue:
        return new NwdApiError({
          code: "bad_request",
          message: `Missing value: ${error.message}`,
        });

      default:
        return new NwdApiError({
          code: "internal_server_error",
          message: `Unknown error: ${error.message}`,
        });
    }
  }
}
