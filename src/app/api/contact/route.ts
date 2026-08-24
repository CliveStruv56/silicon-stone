import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { redactForLog } from "@/lib/utils";
import { BACKEND_TIMEOUT_MS, KIT_TIMEOUT_MS } from "@/lib/timeouts";
import { notifyEnquiry } from "@/lib/email";
import type { Enquiry } from "@/lib/enquiry-notification";

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
  // Contact goes DIRECT to Kit by default. The Railway proxy is opt-in via
  // CONTACT_VIA_BACKEND=true only, exactly as subscribe has been since
  // 2026-07-19 — and for exactly the same reason, found the hard way.
  //
  // Subscribe got this escape hatch when the backend's newsletter service was
  // discovered unconfigured in production. Contact did not, so it kept
  // proxying unconditionally to a `/v1/contact` that answers
  // 503 "Newsletter service not configured" on every request: `_kit_env()` in
  // `backend/main.py` raises when its CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID
  // is empty, and Railway's copies are separate from Vercel's. Newsletter
  // signups worked throughout; every advisory and EU-exposure enquiry failed
  // and was stored nowhere. Found 2026-08-24 by the enquiry notification, on
  // its first live run.
  //
  // BACKEND_API_URL itself must stay set — it also powers usage tracking, deep
  // research and briefings. Re-enable this only once the backend has Kit
  // configured and a live enquiry has been proven end to end.
  if (process.env.CONTACT_VIA_BACKEND !== "true") return null;

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
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });

    const responseBody = await response.json().catch(() => ({}));

    if (response.status < 500 || response.status === 503) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    console.error("Railway contact proxy error:", response.status, redactForLog(responseBody));
    return NextResponse.json(
      { error: "Backend contact proxy error", status: response.status },
      { status: 502 }
    );
  } catch (error) {
    console.error("Railway contact proxy failed:", error);
    return NextResponse.json(
      { error: "Backend contact proxy failed" },
      { status: 502 }
    );
  }
}

/**
 * Email the owner, then return the response the visitor was always going to
 * get. Every exit *after* validation goes through here, both the Railway proxy
 * path and the direct-to-Kit one.
 *
 * That "both" is the whole point, and it is easy to get wrong: production has
 * `BACKEND_API_URL` set, so `proxyContact()` handles the enquiry and returns
 * before the Kit code below ever runs. A notification wired into the Kit path
 * alone would be dead code in the only environment that matters.
 *
 * The response is passed through untouched. `notifyEnquiry` never throws, so a
 * mail outage cannot turn a saved enquiry into an error page — but the outcome
 * is logged, because a notification that silently stops arriving is the failure
 * this whole change exists to end.
 */
async function withNotification(
  enquiry: Enquiry,
  response: NextResponse,
): Promise<NextResponse> {
  const status = await notifyEnquiry(
    enquiry,
    response.status < 400 ? "stored" : "failed",
  );
  if (status === "failed") {
    console.error("[contact] enquiry saved but the notification did not send");
  }
  return response;
}

export async function POST(request: NextRequest) {
  // Hoisted so the catch-all below can still notify: an enquiry that got as far
  // as being valid is never dropped without someone being told.
  let enquiry: Enquiry | null = null;

  try {
    const ip = getClientIp(request);
    let rateLimit;
    try {
      rateLimit = await checkDurableRateLimit("contact", ip);
    } catch (error) {
      console.error("Contact rate limit unavailable:", error);
      return NextResponse.json(
        { error: "Contact service temporarily unavailable" },
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

    enquiry = { name, email, company, interest, message };

    const railwayResponse = await proxyContact(enquiry);
    if (railwayResponse) {
      return await withNotification(enquiry, railwayResponse);
    }

    if (!KIT_API_KEY || !KIT_FORM_ID) {
      console.error("Missing CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID");
      return await withNotification(
        enquiry,
        NextResponse.json(
          { error: "Contact service not configured" },
          { status: 503 }
        )
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
        signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
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
      console.error("ConvertKit create subscriber error:", createResponse.status, redactForLog(errorText));
      return await withNotification(
        enquiry,
        NextResponse.json(
          { error: "Failed to send inquiry. Please try again." },
          { status: 502 }
        )
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
          signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
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
            signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
            body: JSON.stringify({}),
          }
        );
      }
    }

    return await withNotification(enquiry, NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Contact form error:", error);
    const response = NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
    // A valid enquiry that died on an unexpected throw is the case most likely
    // to be lost entirely, so it is the one least worth staying quiet about.
    return enquiry ? await withNotification(enquiry, response) : response;
  }
}
