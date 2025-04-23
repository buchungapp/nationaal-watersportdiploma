import postgres from "postgres";
import zod from "zod";

export enum CoreErrorType {
  /**
   * The error that has was not of the expected types! This could be because of a bug
   */
  Unexpected = 0,

  /**
   * The error was of a recognized type, but not categorized
   */
  Other = 1,

  /**
   * A foreign key constraint was violated
   */
  ForeignKey = 2,

  /**
   * A unique key constraint was violated
   */
  UniqueKey = 3,

  /**
   * A not null constraint was violated
   */
  NotNull = 4,

  /**
   * A database check constraint was violated
   */
  Check = 5,

  /**
   * Validation failed
   */
  Validation = 6,

  /**
   * The error is due to a missing value
   */
  MissingValue = 7,
}

/**
 * Error class for the core layer. All errors should be of this type. This type could be
 * extended to contain more information about validation or constraint validation.
 */
export class CoreError extends Error {
  constructor(
    public readonly type: CoreErrorType,
    options?: ErrorOptions & { cause?: unknown },
  ) {
    const message =
      options?.cause instanceof Error
        ? `${CoreErrorType[type]} / ${options.cause.message}`
        : CoreErrorType[type];

    super(message, { cause: options?.cause });

    this.name = "CoreError";
  }

  public static fromUnknown(error: unknown) {
    if (error instanceof CoreError) {
      return error; // Return the original CoreError to preserve its stack and cause
    }

    if (error instanceof postgres.PostgresError) {
      return CoreError.fromPostgresError(error);
    }

    if (error instanceof zod.ZodError) {
      return CoreError.fromZodError(error);
    }

    if (error instanceof Error) {
      return CoreError.fromError(error);
    }

    return new CoreError(CoreErrorType.Unexpected, { cause: error });
  }

  public static fromError(error: Error) {
    return new CoreError(CoreErrorType.Unexpected, { cause: error });
  }

  public static fromPostgresError(error: postgres.PostgresError) {
    // https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (error.code) {
      case "23000": // integrity_constraint_violation
        return new CoreError(CoreErrorType.Other, { cause: error });
      case "23001": // restrict_violation
        return new CoreError(CoreErrorType.Other, { cause: error });
      case "23502": // not_null_violation
        return new CoreError(CoreErrorType.NotNull, { cause: error });
      case "23503": // foreign_key_violation
        return new CoreError(CoreErrorType.ForeignKey, { cause: error });
      case "23505": // unique_violation
        return new CoreError(CoreErrorType.UniqueKey, { cause: error });
      case "23514": // check_violation
        return new CoreError(CoreErrorType.Check, { cause: error });
      case "23P01": // exclusion_violation
        return new CoreError(CoreErrorType.Other, { cause: error });

      default:
        return new CoreError(CoreErrorType.Unexpected, { cause: error });
    }
  }

  public static fromZodError(error: zod.ZodError) {
    return new CoreError(CoreErrorType.Validation, { cause: error });
  }
}
