import "server-only";

export interface SiteSuggestions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogSiteName?: string;
  h1?: string;
  h2: string[];
  hostname: string;
  brandSuggestions: string[];
  querySuggestions: string[];
}

const TIMEOUT_MS = 15_000;

function metaContent(html: string, name: string): string | undefined {
  const re1 = new RegExp(
    `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  return html.match(re1)?.[1] ?? html.match(re2)?.[1];
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function clean(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const out = decodeEntities(stripTags(s));
  return out.length > 0 ? out : undefined;
}

export async function fetchSuggestions(baseUrl: string, productName: string): Promise<SiteSuggestions> {
  const url = new URL(baseUrl);
  const hostname = url.hostname.replace(/^www\./, "");

  let html = "";
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ConnectorBot/1.0)" },
    });
    if (res.ok) html = await res.text();
  } catch {
    // best-effort: return suggestions even if homepage fetch fails
  }

  const title = clean(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
  const description = clean(metaContent(html, "description") ?? metaContent(html, "og:description"));
  const ogTitle = clean(metaContent(html, "og:title"));
  const ogSiteName = clean(metaContent(html, "og:site_name"));
  const h1 = clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => clean(m[1]))
    .filter((x): x is string => Boolean(x))
    .slice(0, 5);

  // Brand suggestions: product name, hostname (sans tld), og:site_name
  const brandSuggestions = Array.from(
    new Set(
      [productName, ogSiteName, hostname.split(".")[0]].filter((x): x is string => Boolean(x && x.trim())),
    ),
  );

  // Build query suggestions from the most descriptive snippets
  const candidates: string[] = [];
  const pushIfGood = (s: string | undefined) => {
    if (!s) return;
    const t = s.split(/[.•|—–]/)[0].trim();
    if (t.length >= 12 && t.length <= 140 && !candidates.includes(t)) candidates.push(t);
  };

  pushIfGood(description);
  pushIfGood(ogTitle);
  pushIfGood(title);
  pushIfGood(h1);
  for (const h of h2) pushIfGood(h);

  // Add a fallback "alternatives to {brand}" query for GEO competitive coverage
  const brand = brandSuggestions[0] ?? hostname;
  if (brand) {
    candidates.push(`alternatives to ${brand}`);
    candidates.push(`best ${hostname.split(".")[0]} alternative`);
  }

  const querySuggestions = candidates.slice(0, 6);

  return {
    title,
    description,
    ogTitle,
    ogSiteName,
    h1,
    h2,
    hostname,
    brandSuggestions,
    querySuggestions,
  };
}

export function deriveSecretEnvVar(productName: string): string {
  return (
    productName
      .normalize("NFKD")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase() + "_AGENT_SECRET"
  );
}
