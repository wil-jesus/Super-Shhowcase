export const HOME_BY_ROLE: Record<string, string> = {
  CLIENT: "/dashboard/client",
  MUSICIAN: "/dashboard/musician",
  ADMIN: "/admin",
};

export function homeForRole(role?: string | null): string {
  return (role && HOME_BY_ROLE[role]) || "/";
}

// Aceita só caminhos do mesmo site (o middleware envia a URL absoluta); evita open redirect e loop no /login.
export function safeCallbackUrl(raw: string | null | undefined, origin: string): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return null;
    if (url.pathname === "/login" || url.pathname === "/register") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
