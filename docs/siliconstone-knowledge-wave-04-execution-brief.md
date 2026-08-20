# SiliconStone Knowledge System — Wave 4a: external capture

**Project:** `silicon-and-stone-web`
**Built:** 2026-08-20 · **Baseline:** `c3b135f1`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md`
**Status:** **live on production since 2026-08-20.** Claude Code connects and
the tools work end to end. Gated by `KNOWLEDGE_EXTERNAL_WRITES_ENABLED`, which
defaults to off — with it unset, every route and every method answers 404 and
the feature is indistinguishable from one that was never deployed.

## What this is

Wave 0–1 built the knowledge domain and gave it no way in from outside: the
existing `/api/knowledge/*` routes authenticate with a browser cookie, and a
machine has no cookie. This wave adds the two doors.

- **`POST /api/knowledge/capture`** — plain HTTP. The universal adapter:
  anything that can send a header can use it (curl, Shortcuts, Zapier, n8n).
- **`GET /api/knowledge/inbox`**, **`GET /api/knowledge/record/[id]`** — reads.
- **`/api/mcp`** — a Streamable HTTP MCP server (protocol revision 2026-07-28)
  exposing six tools: `capture_source`, `capture_knowledge_item`,
  `link_sources_to_item`, `list_knowledge_inbox`, `get_knowledge_record`,
  `search_knowledge`.

Everything captured lands in `inbox`. Nothing is indexed. No URL is fetched.

## Scope, and why it was cut this way

The master spec's Wave 4 bundles three deliverables: the ingestion endpoint,
queued URL/PDF extraction, and a redesigned `/knowledge` cockpit. Only the first
was built, plus the thin adapter pulled forward from Wave 5 — because the
endpoint alone does not meet the goal (without the adapter the "integration" is
a `curl` command), and because extraction means server-side fetching of
attacker-supplied URLs, which is the largest security surface in the programme
and deserves its own brief.

## Three external facts that shaped it

Researched 2026-08-20; re-check before relying on them.

1. **ChatGPT cannot present a static API key.** Its custom MCP connectors accept
   OAuth, No Authentication, or Mixed only — and Mixed is per-tool
   OAuth-or-none, with no static-token branch. Reaching ChatGPT requires OAuth
   2.1 with RFC 9728 discovery, which this repo has no machinery for. **That is
   Stage 2 and is not built.**
2. **Claude connects from Anthropic's cloud, not the local machine** — even in
   Claude Desktop. A hosted server was always required; a local stdio adapter
   would only ever have served Claude Code.
3. **ChatGPT gates write tools by plan, and the gate is real.** Settled
   empirically on 2026-08-20 against the owner's own account; the tier table is
   under "Stage 2" below. Stage 2 is parked as a result.

## How to connect

Set `KNOWLEDGE_INGEST_TOKEN` (min 32 chars; `openssl rand -base64 48`) and
`KNOWLEDGE_EXTERNAL_WRITES_ENABLED=true`.

```bash
# Claude Code, from any machine. USER scope — a project-scoped .mcp.json is
# committable, and a token in git is a token to rotate.
claude mcp add --transport http --scope user silicon-stone \
  https://siliconandstone.com/api/mcp \
  --header "Authorization: Bearer $KNOWLEDGE_INGEST_TOKEN"

# Anything else
curl -X POST https://siliconandstone.com/api/knowledge/capture \
  -H "Authorization: Bearer $KNOWLEDGE_INGEST_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"kind":"knowledge_item","payload":{
        "title":"...","kind":"observation","body":"..."}}'
```

claude.ai and Claude Desktop need the **Request headers** feature on custom
connectors, which is a gated beta — without it, Stage 1 reaches Claude Code and
curl but not the Claude apps.

## Decisions worth not undoing

**The MCP route calls the domain in-process.** It must never `fetch`
`/api/knowledge/capture`. A loopback to our own domain meets Vercel's deployment
protection on any protected deployment — failing only at runtime, only on
preview — needs a second credential authorising the server to itself, keys the
rate limiter on Vercel's shared egress IP so every user shares one bucket, and
flattens a six-code typed union into a status integer the MCP layer would then
have to reverse-engineer. A check asserts the route contains no `fetch(`.

**`destructiveHint: false` is written explicitly on both capture tools.** It
defaults to *true* whenever `readOnlyHint` is false, which would put a
destructive-action confirmation in front of the one action performed
constantly. Capture never overwrites: a duplicate returns the record that
already existed. The three read tools state `readOnlyHint: true` because ChatGPT
treats a *missing* hint as a write.

**No tool offers `sourceSystem`.** It is half of the external-reference
duplicate probe, so a model that could set it could split or merge deduplication
buckets. The server derives it from the transport. Nor does any tool offer
`extractionExpected` — a field in a schema is an invitation, and the honest
answer is currently no.

**No tool can move a record out of the inbox.** `apply_review_transition` is
deliberately not exposed; handing a model that power defeats the invariant the
whole domain layer exists to hold. Checks assert this.

**`link_sources_to_item` is the only tool that writes to an existing record,
and four constraints keep it that way.** Every other tool creates something new
or reads. This one exists because the candidate migration left a real item
pointing at two legacy source IDs it could not resolve, and nothing could repair
that from a conversation.

- *Additive only.* Existing references are preserved and new ones merged in;
  there is no path that removes one. The worst a confused caller can do is add a
  wrong reference, which a human can see and undo.
- *Inbox records only.* A `ready` item has been reviewed, and quietly changing
  what it rests on would mean the thing approved is no longer the thing stored.
  Editing an approved record stays a human act, in Studio — and the refusal says
  so rather than failing opaquely. This is the constraint most likely to look
  like an arbitrary restriction later; it is not.
- *Sources only.* Each reference must resolve to an existing `knowledgeSource`,
  so the tool cannot attach arbitrary documents.
- *Nothing else moves.* The patch touches `sources` and nothing besides — not
  the review status, not the body, not the content hash. A test asserts the
  patched field list is exactly `['sources']`, which is what lets the tool be
  annotated `destructiveHint: false` honestly. Linking the same source twice
  writes nothing at all.

**The credential is digest-compared.** `secretMatches()` in
`api/vectorize/route.ts` returns early on a length mismatch and so leaks token
length through timing. `ingest-auth.ts` hashes both sides first so the
comparison is unconditionally 32 bytes. Do not copy the older precedent.

**Unconfigured fails closed.** An absent or short `KNOWLEDGE_INGEST_TOKEN`
denies every request and answers 503. It never means "no authentication
required". There is a test whose only job is to assert that.

**The rate limiter's fail-open is refused here.** `checkDurableRateLimit`
degrades to a per-instance in-memory bucket when Upstash is unreachable — right
for login, wrong for a public write endpoint. These routes 503 instead, in
production only, so the endpoint stays testable locally.

**zod is confined to `src/lib/mcp/`.** It is a transport requirement — the SDK
reads a Standard Schema to publish each tool's `inputSchema` — not a validation
decision. The schemas are loose supersets; every real rule stays in
`src/lib/knowledge/schema.ts`. A check asserts no file under
`src/lib/knowledge/` imports zod.

**Capture fills the legacy required fields, because Studio's defaults do not
reach it.** `sourceId`, `status` and `brandTags` are all `required` on the
pre-foundation `knowledgeSource` schema, and an API write never receives a
field's `initialValue` — that only fires when Studio creates a document. So the
first captured source landed in the inbox failing validation on all three, with
a reviewer asked to fill in fields a machine had written the rest of. Fixed
2026-08-20: `sourceId` is now required only on pre-foundation records (it exists
for string reference resolution, which references replaced), while `status` and
`brandTags` are supplied. `status` is **derived** from the review status via
`legacySourceStatusFor()`, never written as a literal, so the legacy and new
verdicts cannot disagree; `brandTags` defaults to `['silicon-and-stone']`, which
records which inbox the record landed in and not a decision about the material.
`knowledgeItem.brandTags` stays unset — optional by design there.

## Operational notes from the rollout

**Set the flag as a NON-sensitive variable.** It was first added as Sensitive,
which makes it write-only — unreadable from both the CLI and the dashboard. The
endpoint then returned 404 with no way to see whether the value was right, and
the fault could not be diagnosed, only re-done. Its value is the word `true`;
it is not a secret, and making it one costs the ability to verify it. The
*token* is a secret and should stay sensitive.

**Only `true` or `1` enables it**, trimmed and lower-cased. Anything else —
including an empty value — reads as off. That strictness is deliberate: a typo
must not switch on a write endpoint.

**Env vars are read at request time, not build time**, so a variable added after
a build still applies. What does *not* apply is a variable added to the wrong
environment; Production is the one that matters.

**Reading the status code tells you the state.** 404 means the flag is off. 503
means the flag is on but the token is missing or under 32 characters. 401 means
it is fully configured and refusing an anonymous caller — that is success.

## Verified

`check`, `test` (1,181 across 50 files, at `573ff212`), `test:security`,
`test:knowledge-inbox`, `test:evidence-index`, `build` — all pass. The two new
check families were each verified by deliberately breaking them.

Locally, end to end: flag off → 404 · token unset → 503 (even with a bearer) ·
no or wrong token → 401 · browser `Origin` → 403 · `GET /api/mcp` → 405 ·
unknown kind → 400 · bad JSON → 400 · missing title → 400 with a correctable
field error · `extractionExpected` → 400 · capture → **201**, repeat → **200**
with the same document ID and no second record · `tools/list` → five tools with
the expected annotations · `tools/call list_knowledge_inbox` → the inbox.

The one test record written to production during that run was deleted.

On production, once configured: `POST /capture` without a token 401 · with a
wrong token 401 (identical message — an attacker learns nothing about which
half was wrong) · `GET /inbox` 401 · `GET /api/mcp` 405 · `POST /api/mcp`
without a token 401 · with a browser `Origin` 403. `claude mcp list` reports
the server connected.

## Stage 2 — OAuth, to unlock ChatGPT: **parked**

The plan question was settled on 2026-08-20 against the owner's own account,
and the answer is that no personal tier can do this.

| ChatGPT tier | Developer Mode / custom connectors | Write tools | Cost |
|---|---|---|---|
| Plus | **absent entirely** — the setting does not exist | — | $20/mo |
| Pro | present | **read / fetch only** | $100–200/mo |
| Business | present | **yes** | ~$20/user/mo, **2-seat minimum** |

Two things follow. Upgrading to Pro would buy nothing here: it is five to ten
times the price of Business per seat and still cannot call a write tool.
Business is simultaneously the cheapest option and the only one that works — so
if ChatGPT capture is ever wanted, the seat is the decision, not the
engineering.

**Zapier does not rescue it.** Zapier's MCP offering is itself a custom
connector, so it needs the same Developer Mode on the same gated tier; it solves
an auth problem the account does not have and leaves the plan problem
untouched, while putting a CMS write credential inside a third party.

**Decision: parked.** Revisit on evidence of repeatedly wanting to capture from
ChatGPT — a note of the times it was actually wanted and could not be done — not
on the hypothesis that it would be convenient. Claude Code covers the case
today.

### What Stage 2 would take, if it is ever revived

A hosted identity provider (not a hand-rolled authorization server), RFC
9728 metadata at `/.well-known/oauth-protected-resource` **and** its
path-suffixed twin, `WWW-Authenticate: Bearer resource_metadata=…` on 401,
audience pinning so a token issued for another resource is rejected, and — the
step most easily missed — an **allowlist of permitted subjects**, because a
hosted IdP authenticates anyone who signs up.

A Business seat is needed either way, so if that is ever bought, put OAuth in
front of our own server rather than a bridge in front of our token.

## Still deferred

URL/PDF extraction, the `/knowledge` cockpit, indexing and retrieval, and
`promote_to_article_draft`.
