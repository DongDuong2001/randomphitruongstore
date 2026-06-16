import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refresh the Supabase auth session on every request.
 *
 * This is required by @supabase/ssr: the access token is short-lived and the
 * only place we can reliably write the refreshed token back into cookies
 * (before any Server Component or Route Handler reads it) is middleware.
 *
 * We do NOT protect any routes here — auth guards live in the individual
 * pages/routes so the logic stays co-located with the feature.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request so downstream code can read them.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // Re-create the response so the updated cookies are sent to the browser.
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  // Calling getUser() triggers a token refresh when needed.
  // The result is intentionally unused here — guards happen per route.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Only run the session-refresh proxy on page routes.
     * Exclude:
     * - api/*          (route handlers manage their own auth)
     * - _next/static   (static files)
     * - _next/image    (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public/uploads (uploaded product images)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads/).*)"
  ]
};
