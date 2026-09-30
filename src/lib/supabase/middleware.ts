import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Keep public pages and local visual previews usable before the project
  // credentials are configured. Protected server routes still fail closed.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/cadastro") ||
    request.nextUrl.pathname.startsWith("/recuperar-senha") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isPasswordUpdateRoute = request.nextUrl.pathname.startsWith("/atualizar-senha");

  // Legal pages must be readable by anyone, including logged-out visitors
  // deciding whether to accept them before signing up.
  const isLegalRoute =
    request.nextUrl.pathname.startsWith("/termos") ||
    request.nextUrl.pathname.startsWith("/privacidade");

  // The Agent Circular landing page is intentionally public. Its protected
  // child pages and API handlers still validate the authenticated user.
  const isAgentLanding =
    request.nextUrl.pathname === "/agente" || request.nextUrl.pathname === "/agente/";

  // Server-to-server webhooks authenticate themselves (no user session).
  const isWebhook = request.nextUrl.pathname.startsWith("/api/webhooks");
  const isAgentApi = request.nextUrl.pathname.startsWith("/api/agent");

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    isAuthRoute ||
    isLegalRoute ||
    isWebhook ||
    isAgentLanding ||
    isAgentApi;

  if (user?.app_metadata?.must_change_password === true && !isPasswordUpdateRoute && !isWebhook) {
    const url = new URL("/atualizar-senha?primeiro-acesso=1", request.url);
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  if (!user && !isPublicRoute) {
    const url = new URL("/login", request.url);
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (returnTo !== "/") url.searchParams.set("next", returnTo);
    // Preserve any refreshed auth cookies on the redirect response.
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return supabaseResponse;
}
