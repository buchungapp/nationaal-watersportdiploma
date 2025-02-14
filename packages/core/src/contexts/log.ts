import { AsyncLocalStorage } from "node:async_hooks";

export interface LogConfiguration {
  error?: (message: unknown) => void;
  warn?: (message: unknown) => void;
  info?: (message: unknown) => void;
}

export function consoleLogConfiguration(): LogConfiguration {
  return {
    error(message) {
      console.error(message);
    },
    warn(message) {
      console.warn(message);
    },
    info(message) {
      console.info(message);
    },
  };
}

const storage = new AsyncLocalStorage<LogConfiguration>();

export async function withLog<T>(
  configuration: LogConfiguration,
  job: () => Promise<T>,
): Promise<T> {
  const result = await storage.run(configuration, job);
  return result;
}

export function error(message: unknown) {
  const configuration = storage.getStore();
  configuration?.error?.(message);
}

export function warn(message: unknown) {
  const configuration = storage.getStore();
  configuration?.warn?.(message);
}

export function info(message: unknown) {
  const configuration = storage.getStore();
  configuration?.info?.(message);
}
