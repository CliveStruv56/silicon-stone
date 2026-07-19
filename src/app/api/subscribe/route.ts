import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { redactForLog } from "@/lib/utils";
import { SUBSCRIBE_TAG_IDS } from "@/lib/kit";

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || "";
const MAX_BODY_BYTES = 2_000;
// One Kit list site-wide; every segment is a tag from this allow-list.
const ALLOWED_TAGS = new Set(Object.keys(SUBSCRIBE_TAG_IDS));
const MAX_TAGS = 4;

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

async function proxySubscribe(body: { email: string; tag?: string; tags?: string[] }) {
  // Subscribe goes DIRECT to Kit by default. The Railway proxy is opt-in via
  // SUBSCRIBE_VIA_BACKEND=true only — the backend's newsletter service was
  // found unconfigured in production (503 on every subscribe, 2026-07-19),
  // and BACKEND_API_URL itself must stay set for usage tracking, deep
  // research, and the contact proxy. Re-enable only once the backend has
  // ConvertKit configured AND applies the `tags` array.
  if (process.env.SUBSCRIBE_VIA_BACKEND !== "true") return null;

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
    const response = await fetch(`${backendApiUrl}/v1/subscribe`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => ({}));

    if (response.status < 500 || response.status === 503) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    console.error("Railway subscribe proxy error:", response.status, redactForLog(responseBody));
    return NextResponse.json(
      { error: "Backend subscribe proxy error", status: response.status },
      { status: 502 }
    );
  } catch (error) {
    console.error("Railway subscribe proxy failed:", error);
    return NextResponse.json(
      { error: "Backend subscribe proxy failed" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    let rateLimit;
    try {
      rateLimit = await checkDurableRateLimit("subscribe", ip);
    } catch (error) {
      console.error("Subscribe rate limit unavailable:", error);
      return NextResponse.json(
        { error: "Subscription service temporarily unavailable" },
        { status: 503 }
      );
    }

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

    let body: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return NextResponse.json(
          { error: "Request too large" },
          { status: 413 }
        );
      }
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254).toLowerCase() : "";
    const tag = typeof body.tag === "string" && ALLOWED_TAGS.has(body.tag) ? body.tag : undefined;
    // Multi-tag support (e.g. early-access + the tier requested). Allow-listed,
    // deduped, capped.
    const requestedTags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string" && ALLOWED_TAGS.has(t))
      : [];
    const tags = [...new Set(tag ? [tag, ...requestedTags] : requestedTags)].slice(0, MAX_TAGS);

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

    const railwayResponse = await proxySubscribe({ email, tag, tags });
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
      console.error("ConvertKit API error:", response.status, redactForLog(errorText));
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 502 }
      );
    }

    // Apply each allow-listed tag that has a Kit tag ID configured. A missing
    // ID skips that tag only — the subscribe itself has already succeeded.
    const tagIds = tags
      .map((name) => SUBSCRIBE_TAG_IDS[name])
      .filter((id): id is string => Boolean(id));
    if (tagIds.length > 0) {
      const formData = await response.json();
      const subscriberId = formData.subscriber?.id;
      if (subscriberId) {
        for (const tagId of tagIds) {
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
