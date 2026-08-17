import { NextResponse, type NextRequest } from "next/server";

// Gates /admin with HTTP Basic Auth. Deliberately not a login page/session/DB
// — this is a single-operator read-only orders view, and Basic Auth over TLS
// is the native platform mechanism for exactly that, at zero dependencies.
export function proxy(request: NextRequest) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Unset: fail closed, not open.
  if (!adminUser || !adminPassword) {
    return new NextResponse("Admin not configured.", { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [user, password] = atob(auth.slice(6)).split(":");
    if (user === adminUser && password === adminPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
