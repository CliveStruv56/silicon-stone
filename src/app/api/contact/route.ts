import { NextRequest, NextResponse } from "next/server";

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || "";

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, interest, message } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

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
        { error: "Contact service not configured" },
        { status: 503 }
      );
    }

    // Create subscriber in ConvertKit with custom fields for the inquiry
    const createResponse = await fetch(
      `https://api.kit.com/v4/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": KIT_API_KEY,
        },
        body: JSON.stringify({
          first_name: name,
          email_address: email,
          fields: {
            company: company || "",
            interest: interest || "",
            message: message || "",
            source: "services-contact-form",
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("ConvertKit create subscriber error:", createResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to send inquiry. Please try again." },
        { status: 502 }
      );
    }

    // Also add them to the form so they get the welcome sequence
    const subscriberData = await createResponse.json();
    const subscriberId = subscriberData.subscriber?.id;

    if (subscriberId) {
      await fetch(
        `https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers/${subscriberId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Kit-Api-Key": KIT_API_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      // Tag with contact-inquiry if tag ID is configured
      const tagId = process.env.CONVERTKIT_CONTACT_TAG_ID;
      if (tagId) {
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
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
