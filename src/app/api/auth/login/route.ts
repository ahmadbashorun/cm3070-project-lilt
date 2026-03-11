import { NextResponse } from "next/server";
import { setAuthCookie, setEmailCookie } from "@/utils/cookies";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { email?: string };
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const token = `auth_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    await setAuthCookie(token);
    await setEmailCookie(email);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to set authentication" },
      { status: 500 }
    );
  }
}
