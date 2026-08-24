import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const maintenanceEnabled =
    process.env.MAINTENANCE_MODE === "true";

  if (!maintenanceEnabled) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(
    new URL("/maintenance", request.url),
    {
      status: 503,
      headers: {
        "Retry-After": "3600",
        "Cache-Control": "no-store",
      },
    },
  );
}

export const config = {
  matcher: [
    /*
     * Intercetta le pagine ma lascia passare:
     * - la pagina di manutenzione
     * - le risorse interne di Next.js
     * - favicon, manifest, robots e sitemap
     * - i file pubblici con estensione
     * - le API
     */
    "/((?!maintenance|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};