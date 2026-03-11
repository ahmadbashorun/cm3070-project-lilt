import { NextResponse } from "next/server";
import { setPreferencesCookie, getPreferencesCookie } from "@/utils/cookies";
import type { DetectionPreferences } from "@/types";

const defaultPreferences: DetectionPreferences = {
  typingAndMouse: false,
  posture: false,
  facialExpression: false,
  emailContext: false,
};

export async function GET(): Promise<NextResponse> {
  try {
    const preferences = await getPreferencesCookie();
    return NextResponse.json(preferences ?? defaultPreferences);
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<DetectionPreferences>;

    // Validate preferences object
    const preferences: DetectionPreferences = {
      typingAndMouse:
        typeof body.typingAndMouse === "boolean"
          ? body.typingAndMouse
          : defaultPreferences.typingAndMouse,
      posture:
        typeof body.posture === "boolean"
          ? body.posture
          : defaultPreferences.posture,
      facialExpression:
        typeof body.facialExpression === "boolean"
          ? body.facialExpression
          : defaultPreferences.facialExpression,
      emailContext:
        typeof body.emailContext === "boolean"
          ? body.emailContext
          : defaultPreferences.emailContext,
    };

    await setPreferencesCookie(preferences);

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
