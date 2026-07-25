import { noStoreJson } from "@/lib/security";

const PUBLIC_API_ORIGINS = new Set([
  "https://ngo-nam-nhat-mai-wedding.vercel.app",
  "https://ngo-nam-nhat-mai-wedding.vanhung71388.chatgpt.site",
]);

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("Vary");
  const values = new Set(
    (current ? current.split(",") : [])
      .map((item) => item.trim())
      .filter(Boolean),
  );
  values.add(value);
  headers.set("Vary", Array.from(values).join(", "));
}

function addCorsHeaders(
  request: Request,
  headers: Headers,
  methods: string,
): boolean {
  const origin = request.headers.get("Origin");
  appendVary(headers, "Origin");

  if (!origin) return true;
  if (!PUBLIC_API_ORIGINS.has(origin)) return false;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  return true;
}

export function publicApiJson(
  request: Request,
  payload: unknown,
  status = 200,
  methods = "GET, POST, OPTIONS",
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  addCorsHeaders(request, headers, methods);
  return noStoreJson(payload, status, headers);
}

export function publicApiOptions(
  request: Request,
  methods: string,
): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const allowed = addCorsHeaders(request, headers, methods);

  if (!allowed) {
    return new Response(null, { status: 403, headers });
  }

  return new Response(null, { status: 204, headers });
}
