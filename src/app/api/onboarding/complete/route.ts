import { NextResponse } from "next/server";
import { setOnboardingCookie } from "@/utils/cookies";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { complete?: boolean };
    const { complete } = body;

    if (typeof complete !== "boolean") {
      return NextResponse.json(
        { error: "Complete status is required" },
        { status: 400 }
      );
    }

    await setOnboardingCookie(complete);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to set onboarding status" },
      { status: 500 }
    );
  }
}
