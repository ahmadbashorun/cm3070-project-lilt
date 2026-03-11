import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEmailCookie } from "@/utils/cookies";

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");
    const email = await getEmailCookie();

    if (!authToken || !email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Derive name from email (part before @) or use default
    const name = email.split("@")[0] || "User";

    return NextResponse.json({
      id: authToken,
      email,
      name,
    });
  } catch (error) {
    console.error("Failed to get user:", error);
    return NextResponse.json(
      { error: "Failed to get user information" },
      { status: 500 }
    );
  }
}
