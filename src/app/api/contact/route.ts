import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || "";
const MAX_BODY_BYTES = 10_000;
const MAX_FIELD_LENGTHS = {
  name: 120,
  email: 254,
  company: 160,
  interest: 160,
  message: 2_000,
};

function normalizeField(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getBackendApiUrl() {
  const value = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return value.replace(/\/$/, "");
}

function getBackendHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (process.env.BACKEND_API_KEY) {
    headers["X-Backend-Api-Key"] = process.env.BACKEND_API_KEY;
  }

  return headers;
}

async function proxyContact(body: {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
}) {
  const backendApiUrl = getBackendApiUrl();
  if (!backendApiUrl) return null;

  if (!process.env.BACKEND_API_KEY) {
    console.error("BACKEND_API_URL is configured but BACKEND_API_KEY is missing");
    return NextResponse.json(
      { error: "Backend shared key is not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${backendApiUrl}/v1/contact`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => ({}));

    if (response.status < 500 || response.status === 503) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    console.error("Railway contact proxy error:", response.status, responseBody);
    return null;
  } catch (error) {
    console.error("Railway contact proxy failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`contact:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

    const body = await request.json();
    const name = normalizeField(body.name, MAX_FIELD_LENGTHS.name);
    const email = normalizeField(body.email, MAX_FIELD_LENGTHS.email).toLowerCase();
    const company = normalizeField(body.company, MAX_FIELD_LENGTHS.company);
    const interest = normalizeField(body.interest, MAX_FIELD_LENGTHS.interest);
    const message = normalizeField(body.message, MAX_FIELD_LENGTHS.message);

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!name) {
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

    const railwayResponse = await proxyContact({ name, email, company, interest, message });
    if (railwayResponse) {
      return railwayResponse;
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
