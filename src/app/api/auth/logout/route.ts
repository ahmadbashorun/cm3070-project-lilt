import { NextResponse } from "next/server";
import { removeAuthCookie, removeEmailCookie } from "@/utils/cookies";

export async function POST(): Promise<NextResponse> {
  try {
    await removeAuthCookie();
    await removeEmailCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
