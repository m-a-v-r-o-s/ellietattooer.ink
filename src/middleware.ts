import { defineMiddleware } from "astro:middleware";
import { checkAdminAuth } from "@/lib/admin-auth";

// Gates /admin with HTTP Basic Auth. Deliberately not a login page/session/DB
// — this is a single-operator read-only orders view, and Basic Auth over TLS
// is the native platform mechanism for exactly that, at zero dependencies.
// The admin page re-checks with the same helper; this is only the first gate.
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  // Prerendered pages run this at build time with no request to check.
  if (context.isPrerendered || (pathname !== "/admin" && !pathname.startsWith("/admin/"))) {
    return next();
  }

  const result = checkAdminAuth(context.request.headers);
  if (result.ok) return next();

  if (result.status === 503) return new Response("Admin not configured.", { status: 503 });
  if (result.status === 429) {
    return new Response("Too many attempts.", {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    });
  }
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
});
