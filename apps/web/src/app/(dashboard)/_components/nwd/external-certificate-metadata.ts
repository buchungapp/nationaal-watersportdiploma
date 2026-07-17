const INTERNAL_METADATA_KEYS = new Set(["legacyCwo"]);

export function displayableExternalCertificateMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Array<[key: string, value: string]> {
  if (!metadata) return [];

  return Object.entries(metadata).flatMap(([key, value]) => {
    if (key.startsWith("__") || INTERNAL_METADATA_KEYS.has(key)) return [];
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      return [];
    }

    return [[key, String(value)]];
  });
}
