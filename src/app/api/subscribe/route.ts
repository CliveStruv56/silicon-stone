import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || "";
const MAX_BODY_BYTES = 2_000;
const ALLOWED_TAGS = new Set(["Tool_Lead", "WaymarkPath_Early_Access"]);

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

async function proxySubscribe(body: { email: string; tag?: string }) {
  const backendApiUrl = getBackendApiUrl();
  if (!backendApiUrl) return null;

  try {
    const response = await fetch(`${backendApiUrl}/v1/subscribe`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => ({}));

    if (response.status < 500) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    console.error("Railway subscribe proxy error:", response.status, responseBody);
    return null;
  } catch (error) {
    console.error("Railway subscribe proxy failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`subscribe:${ip}`, {
      limit: 10,
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
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254).toLowerCase() : "";
    const tag = typeof body.tag === "string" && ALLOWED_TAGS.has(body.tag) ? body.tag : undefined;

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

    const railwayResponse = await proxySubscribe({ email, tag });
    if (railwayResponse) {
      return railwayResponse;
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
