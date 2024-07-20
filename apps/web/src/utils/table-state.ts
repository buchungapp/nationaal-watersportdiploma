export function transformSelectionState(
  input: Record<string, unknown>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(input ?? {}).map(([key, value]) => [key, !!value]),
  );
}
