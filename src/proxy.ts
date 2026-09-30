import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Public opening can be previewed without credentials; internal routes keep their checks.
  if ((request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/api/public/map") &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === "/api/public/map") return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!abertura/|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|offline.html|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
