import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { notifyEnquiry } from "@/lib/email";
import type { Enquiry } from "@/lib/enquiry-notification";
import { upsertContact } from "@/lib/standfirst";
import { ENQUIRY_TAG } from "@/lib/standfirst-signups";

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

/**
 * Email the owner, then return the response the visitor was always going to
 * get. Every exit *after* validation goes through here.
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

    // An enquiry is not newsletter consent: `subscribe: false` records the
    // person without adding them to any list, and they get no marketing mail.
    const result = await upsertContact({
      email,
      firstName: name,
      subscribe: false,
      tags: [ENQUIRY_TAG],
      source: "services-contact-form",
      fields: { company, interest, message },
      consent: {
        basis: "legitimate_interest",
        wording: "Sent an enquiry through the website contact form.",
        ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    if (!result.ok) {
      return await withNotification(
        enquiry,
        result.reason === "not_configured"
          ? NextResponse.json({ error: "Contact service not configured" }, { status: 503 })
          : NextResponse.json({ error: "Failed to send inquiry. Please try again." }, { status: 502 })
      );
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
