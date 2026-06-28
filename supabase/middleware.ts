import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { WORKSPACE_COOKIE } from "@/lib/workspace-cookie";

const PUBLIC_PATHS = ["/login", "/signup", "/auth"];
const WORKSPACE_PATHS = ["/dashboard", "/products", "/inventory", "/customers", "/suppliers", "/sales", "/purchases", "/expenses", "/reports", "/settings"];

function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in — send to login
  if (!user && !isPublic && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const isWorkspacePath = WORKSPACE_PATHS.some((p) => pathname.startsWith(p));
    const hasWorkspaceCookie = request.cookies.has(WORKSPACE_COOKIE);

    // Logged-in user on auth pages — send to dashboard or onboarding
    if (isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = hasWorkspaceCookie ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // Workspace path but no cookie — look up via admin client (bypasses RLS)
    if (isWorkspacePath && !hasWorkspaceCookie) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data?.workspace_id) {
        supabaseResponse.cookies.set(WORKSPACE_COOKIE, data.workspace_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    // Logged-in user on /onboarding — if they have a workspace, send to dashboard
    if (pathname === "/onboarding" && hasWorkspaceCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
