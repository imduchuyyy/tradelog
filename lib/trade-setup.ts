export function parseSetupTags(value: unknown): string[] {
  if (Array.isArray(value)) return normalizeSetupTags(value.map(String));

  if (typeof value !== "string") return [];

  const trimmedValue = value.trim();

  if (!trimmedValue) return [];

  try {
    const parsed = JSON.parse(trimmedValue);

    if (Array.isArray(parsed)) return normalizeSetupTags(parsed.map(String));
  } catch {
    return normalizeSetupTags(trimmedValue.split(","));
  }

  return [];
}

export function serializeSetupTags(tags: string[]) {
  const normalizedTags = normalizeSetupTags(tags);

  return normalizedTags.length ? JSON.stringify(normalizedTags) : null;
}

export function normalizeSetupTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

function normalizeSetupTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeSetupTag).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}
