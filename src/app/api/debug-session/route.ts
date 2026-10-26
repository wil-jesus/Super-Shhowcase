import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  return NextResponse.json(
    {
      hasSession: Boolean(session?.user),
      user: session?.user ?? null,
      expires: session?.expires ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
