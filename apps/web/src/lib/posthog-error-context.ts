export type ErrorChainEntry = {
  name: string;
  message: string;
  stack?: string;
};

const MAX_CHAIN_DEPTH = 10;

export function collectCauseChain(error: unknown): ErrorChainEntry[] {
  const chain: ErrorChainEntry[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (
    current instanceof Error &&
    !seen.has(current) &&
    chain.length < MAX_CHAIN_DEPTH
  ) {
    seen.add(current);
    chain.push({
      name: current.name,
      message: current.message,
      stack: current.stack,
    });
    current = (current as Error & { cause?: unknown }).cause;
  }

  return chain;
}

export function buildErrorContextProps(error: unknown): Record<string, unknown> {
  const chain = collectCauseChain(error);
  if (chain.length === 0) return {};

  const outer = chain[0];
  const root = chain[chain.length - 1];

  const props: Record<string, unknown> = {
    error_chain_length: chain.length,
    error_outer_name: outer?.name,
    error_outer_message: outer?.message,
    error_root_name: root?.name,
    error_root_message: root?.message,
    error_root_stack: root?.stack,
    error_chain: chain.map((e) => `${e.name}: ${e.message}`).join(" ← "),
  };

  const failingQuery = (error as { failingQuery?: unknown })?.failingQuery;
  if (typeof failingQuery === "string") {
    props.failing_query = failingQuery;
  }

  const digest = (error as { digest?: unknown })?.digest;
  if (typeof digest === "string") {
    props.error_digest = digest;
  }

  return props;
}

const HANDLE_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: "person_handle", re: /\/profiel\/([^/?#]+)/ },
  { key: "location_handle", re: /\/locatie\/([^/?#]+)/ },
  { key: "cohort_handle", re: /\/cohorten\/([^/?#]+)/ },
  { key: "pvb_handle", re: /\/pvb-aanvragen\/([^/?#]+)/ },
];

export function extractRouteProps(
  path: string | undefined,
): Record<string, string> {
  if (!path) return {};
  const props: Record<string, string> = {};
  for (const { key, re } of HANDLE_PATTERNS) {
    const match = path.match(re);
    if (match?.[1]) props[key] = match[1];
  }
  return props;
}
