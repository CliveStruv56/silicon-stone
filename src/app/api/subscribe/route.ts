import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { upsertContact } from "@/lib/standfirst";
import { resolveSignup } from "@/lib/standfirst-signups";

const MAX_BODY_BYTES = 2_000;

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

    if (!email) {
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

    const { formSlug, tags } = resolveSignup(body);
    const result = await upsertContact({
      email,
      formSlug,
      tags,
      consent: {
        basis: "consent",
        ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    // A signup is never reported as a success unless Standfirst holds it: the
    // visitor sees an error and can try again.
    if (!result.ok) {
      return result.reason === "not_configured"
        ? NextResponse.json({ error: "Newsletter service not configured" }, { status: 503 })
        : NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 502 });
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
