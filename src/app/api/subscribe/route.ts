import { NextRequest, NextResponse } from "next/server";

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || "";

export async function POST(request: NextRequest) {
  try {
    const { email, tag } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!KIT_API_KEY || !KIT_FORM_ID) {
      console.error("Missing CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID");
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 503 }
      );
    }

    // Add subscriber to ConvertKit form via Kit API v4
    const response = await fetch(
      `https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": KIT_API_KEY,
        },
        body: JSON.stringify({ email_address: email }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ConvertKit API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 502 }
      );
    }

    // If a tag name was provided and we have a tag ID mapping, apply it
    const tagIdMap: Record<string, string | undefined> = {
      Tool_Lead: process.env.CONVERTKIT_TOOL_LEAD_TAG_ID,
      WaymarkPath_Early_Access: process.env.CONVERTKIT_WAYMARKPATH_TAG_ID,
    };

    const tagId = tag ? tagIdMap[tag] : undefined;
    if (tagId) {
      const formData = await response.json();
      const subscriberId = formData.subscriber?.id;
      if (subscriberId) {
        await fetch(
          `https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Kit-Api-Key": KIT_API_KEY,
            },
            body: JSON.stringify({}),
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
