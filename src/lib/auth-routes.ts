const DEFAULT_NEXT_PATH = "/inicio";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Only allow local paths in auth redirects to prevent open redirects. */
export function getSafeNextPath(value: string | null | undefined, fallback = DEFAULT_NEXT_PATH) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "http://conexao-circular.local");
    if (parsed.origin !== "http://conexao-circular.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export function authRedirect(pathname: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}
