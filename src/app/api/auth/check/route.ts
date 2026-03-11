import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEmailCookie } from "@/utils/cookies";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  const email = await getEmailCookie();

  return NextResponse.json({
    isAuthenticated: authToken !== undefined,
    email: email ?? null,
  });
}
