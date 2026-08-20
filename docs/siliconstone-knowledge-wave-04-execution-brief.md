# SiliconStone Knowledge System — Wave 4a: external capture

**Project:** `silicon-and-stone-web`
**Built:** 2026-08-20 · **Baseline:** `c3b135f1`
**Governing spec:** `siliconstone-knowledge-llm-master-spec.md`
**Status:** built and verified locally. **Not deployed.** All of it is dark
behind `KNOWLEDGE_EXTERNAL_WRITES_ENABLED`, which defaults to off.

## What this is

Wave 0–1 built the knowledge domain and gave it no way in from outside: the
existing `/api/knowledge/*` routes authenticate with a browser cookie, and a
machine has no cookie. This wave adds the two doors.

- **`POST /api/knowledge/capture`** — plain HTTP. The universal adapter:
  anything that can send a header can use it (curl, Shortcuts, Zapier, n8n).
- **`GET /api/knowledge/inbox`**, **`GET /api/knowledge/record/[id]`** — reads.
- **`/api/mcp`** — a Streamable HTTP MCP server (protocol revision 2026-07-28)
  exposing five tools.

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
3. **ChatGPT may gate write tools behind Business/Enterprise/Edu.** Two official
   pages contradict each other. Settle it empirically before spending anything
   on Stage 2 (see below).

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

## Verified

`check`, `test` (1,165 across 50 files), `test:security`,
`test:knowledge-inbox`, `test:evidence-index`, `build` — all pass. The two new
check families were each verified by deliberately breaking them.

Locally, end to end: flag off → 404 · token unset → 503 (even with a bearer) ·
no or wrong token → 401 · browser `Origin` → 403 · `GET /api/mcp` → 405 ·
unknown kind → 400 · bad JSON → 400 · missing title → 400 with a correctable
field error · `extractionExpected` → 400 · capture → **201**, repeat → **200**
with the same document ID and no second record · `tools/list` → five tools with
the expected annotations · `tools/call list_knowledge_inbox` → the inbox.

The one test record written to production during that run was deleted.

## Stage 2 — OAuth, to unlock ChatGPT

**Before spending anything:** connect any free read/write MCP server to the
owner's ChatGPT account and check whether a write tool actually executes. Ten
minutes, and it settles what two contradictory official pages cannot. If writes
are gated, a Business seat is needed whichever route is taken.

Then: a hosted identity provider (not a hand-rolled authorization server), RFC
9728 metadata at `/.well-known/oauth-protected-resource` **and** its
path-suffixed twin, `WWW-Authenticate: Bearer resource_metadata=…` on 401,
audience pinning so a token issued for another resource is rejected, and — the
step most easily missed — an **allowlist of permitted subjects**, because a
hosted IdP authenticates anyone who signs up.

A Zapier or Make bridge also works, because those products run their own OAuth
and can hold our bearer. It solves the auth problem, not the plan problem: their
connectors are themselves custom MCP connectors subject to the same write gate,
and it puts a CMS write credential inside a third party. If a Business seat is
needed anyway, put OAuth in front of our own server instead.

## Still deferred

URL/PDF extraction, the `/knowledge` cockpit, indexing and retrieval, and
`promote_to_article_draft`.
