import {
  GET as getAdminDashboard,
  POST as updateAdminDashboard,
} from "@/app/api/admin/dashboard/route";
import { GET as exportAdminData } from "@/app/api/admin/export/route";
import {
  GET as getMessages,
  POST as postMessage,
} from "@/app/api/messages/route";
import { POST as postRsvp } from "@/app/api/rsvp/route";

const apiWorker = {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/messages" && request.method === "GET") {
      return getMessages();
    }
    if (pathname === "/api/messages" && request.method === "POST") {
      return postMessage(request);
    }
    if (pathname === "/api/rsvp" && request.method === "POST") {
      return postRsvp(request);
    }
    if (pathname === "/api/admin/dashboard" && request.method === "GET") {
      return getAdminDashboard(request);
    }
    if (pathname === "/api/admin/dashboard" && request.method === "POST") {
      return updateAdminDashboard(request);
    }
    if (pathname === "/api/admin/export" && request.method === "GET") {
      return exportAdminData(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

export default apiWorker;
