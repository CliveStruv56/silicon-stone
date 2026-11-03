import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { upsertContact } from "@/lib/standfirst";
import { resolveSignup } from "@/lib/standfirst-signups";
import { notifyEnquiry } from "@/lib/email";
import { LEARN_FORM_SLUG, resolveLearnSignup, teamLeadSummary } from "@/lib/learn/signups";

/**
 * The Silicon & Stone Learning waitlist.
 *
 * Its own route rather than a `signup` kind on /api/subscribe, for two reasons:
 * the Learn tags are a different family (`learn-`) with their own allow-list,
 * and one submission here can mean two separate consents plus an owner alert.
 *
 * Order matters and each step's failure means something different:
 *
 *   1. The waitlist signup (form `learn-waitlist`, double opt-in). If this
 *      fails, the visitor is told so — never a success Standfirst does not hold.
 *   2. The Stone Briefing (form `briefing`), only if its unticked box was
 *      ticked. A failure here does not undo step 1; the response says so, and
 *      the form tells the visitor to subscribe separately.
 *   3. A team answer emails the owner. Advisory, like every notification on
 *      this site: it never fails the request.
 */

const MAX_BODY_BYTES = 2_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    let rateLimit;
    try {
      rateLimit = await checkDurableRateLimit("learnWaitlist", ip);
    } catch (error) {
      console.error("Learn waitlist rate limit unavailable:", error);
      return NextResponse.json({ error: "The waitlist is temporarily unavailable" }, { status: 503 });
    }
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return NextResponse.json({ error: "Request too large" }, { status: 413 });
      }
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254).toLowerCase() : "";
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!EMAIL.test(email)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 });

    const signup = resolveLearnSignup(body);
    const consent = {
      basis: "consent" as const,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    };

    // 1. The waitlist itself.
    const result = await upsertContact({
      email,
      formSlug: LEARN_FORM_SLUG,
      tags: signup.tags,
      source: "learn",
      consent,
    });
    if (!result.ok) {
      return result.reason === "not_configured"
        ? NextResponse.json({ error: "The waitlist is not configured yet" }, { status: 503 })
        : NextResponse.json({ error: "We couldn’t add you to the list. Please try again." }, { status: 502 });
    }

    // 2. The Stone Briefing: a separate consent, through its own form.
    let briefing: "not_requested" | "pending" | "failed" = "not_requested";
    if (signup.briefing) {
      const briefingSignup = resolveSignup({ signup: "briefing" });
      const briefingResult = await upsertContact({
        email,
        formSlug: briefingSignup.formSlug,
        tags: briefingSignup.tags,
        consent,
      });
      briefing = briefingResult.ok ? "pending" : "failed";
    }

    // 3. A team answer is a sales lead.
    if (signup.team) {
      const status = await notifyEnquiry(
        {
          name: "",
          email,
          company: "",
          interest: "Learn: team training lead",
          message: teamLeadSummary(signup),
        },
        "stored",
      );
      console.info("[learn-waitlist] team lead notification:", status);
    }

    return NextResponse.json({ success: true, briefing });
  } catch (error) {
    console.error("Learn waitlist error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
