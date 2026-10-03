import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const HOME_BY_ROLE: Record<string, string> = {
  CLIENT: "/dashboard/client",
  MUSICIAN: "/dashboard/musician",
  ADMIN: "/admin",
};

// ADMIN pode acessar os dashboards de cliente e músico (as APIs já permitem).
function allowedRoles(pathname: string): string[] | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return ["ADMIN"];
  if (pathname.startsWith("/dashboard/musician")) return ["MUSICIAN", "ADMIN"];
  if (pathname.startsWith("/dashboard/client")) return ["CLIENT", "ADMIN"];
  return null;
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const allowed = allowedRoles(req.nextUrl.pathname);

    if (allowed && (!role || !allowed.includes(role))) {
      const home = (role && HOME_BY_ROLE[role]) || "/";
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};