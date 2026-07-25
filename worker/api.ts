import {
  GET as getAdminDashboard,
  POST as updateAdminDashboard,
} from "@/app/api/admin/dashboard/route";
import { GET as exportAdminData } from "@/app/api/admin/export/route";
import {
  GET as getMessages,
  OPTIONS as optionsMessages,
  POST as postMessage,
} from "@/app/api/messages/route";
import {
  OPTIONS as optionsRsvp,
  POST as postRsvp,
} from "@/app/api/rsvp/route";
import { adminPageResponse } from "./admin-page";

const ADMIN_UI_ORIGINS = new Set([
  "https://ngo-nam-nhat-mai-wedding.vercel.app",
  "https://ngo-nam-nhat-mai-wedding.vanhung71388.chatgpt.site",
]);

const SECURITY_HEADERS: Record<string, string> = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function appendVary(headers: Headers, value: string): void {
  const values = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  values.add(value);
  headers.set("Vary", Array.from(values).join(", "));
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function adminOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return (
    origin === new URL(request.url).origin || ADMIN_UI_ORIGINS.has(origin)
  );
}

function withAdminCors(request: Request, response: Response): Response {
  const origin = request.headers.get("Origin");
  const headers = new Headers(response.headers);
  appendVary(headers, "Origin");

  if (origin && adminOriginAllowed(request)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    headers.set("Access-Control-Max-Age", "600");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed(allow: string): Response {
  return new Response(
    JSON.stringify({ error: "Phương thức yêu cầu không được hỗ trợ." }),
    {
      status: 405,
      headers: {
        Allow: allow,
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "Không tìm thấy API." }), {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

const apiWorker = {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    let response: Response;

    if (pathname === "/" || pathname === "/api/health") {
      response =
        request.method === "GET"
          ? new Response(
              JSON.stringify({
                ok: true,
                service: "ngo-nam-nhat-mai-wedding-api",
              }),
              {
                headers: {
                  "Cache-Control": "no-store",
                  "Content-Type": "application/json; charset=utf-8",
                },
              },
            )
          : methodNotAllowed("GET");
      return withSecurityHeaders(response);
    }

    if (pathname === "/admin" || pathname === "/admin/") {
      response =
        request.method === "GET"
          ? adminPageResponse()
          : methodNotAllowed("GET");
      return withSecurityHeaders(response);
    }

    if (pathname === "/api/messages") {
      if (request.method === "OPTIONS") response = optionsMessages(request);
      else if (request.method === "GET") response = await getMessages(request);
      else if (request.method === "POST")
        response = await postMessage(request);
      else response = methodNotAllowed("GET, POST, OPTIONS");
      return withSecurityHeaders(response);
    }

    if (pathname === "/api/rsvp") {
      if (request.method === "OPTIONS") response = optionsRsvp(request);
      else if (request.method === "POST") response = await postRsvp(request);
      else response = methodNotAllowed("POST, OPTIONS");
      return withSecurityHeaders(response);
    }

    if (
      pathname === "/api/admin/dashboard" ||
      pathname === "/api/admin/export"
    ) {
      if (!adminOriginAllowed(request)) {
        return withSecurityHeaders(
          new Response(JSON.stringify({ error: "Nguồn yêu cầu không hợp lệ." }), {
            status: 403,
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "application/json; charset=utf-8",
              Vary: "Origin",
            },
          }),
        );
      }

      if (request.method === "OPTIONS") {
        response = new Response(null, {
          status: 204,
          headers: { "Cache-Control": "no-store" },
        });
      } else if (
        pathname === "/api/admin/dashboard" &&
        request.method === "GET"
      ) {
        response = await getAdminDashboard(request);
      } else if (
        pathname === "/api/admin/dashboard" &&
        request.method === "POST"
      ) {
        response = await updateAdminDashboard(request);
      } else if (
        pathname === "/api/admin/export" &&
        request.method === "GET"
      ) {
        response = await exportAdminData(request);
      } else {
        response = methodNotAllowed(
          pathname === "/api/admin/dashboard"
            ? "GET, POST, OPTIONS"
            : "GET, OPTIONS",
        );
      }

      return withSecurityHeaders(withAdminCors(request, response));
    }

    return withSecurityHeaders(notFound());
  },
};

export default apiWorker;
