# Article Generation — How-To (Claude Code vs Website)

How to generate a Silicon & Stone article two ways: **in Claude Code on your Max
plan** (no Anthropic API credits) or **through the website** `/create` button
(uses API credits). This is the operator's reference — what you do, when, and the
exact words to type.

_Last reviewed: 22 June 2026._

---

## TL;DR — which path, when

| | **Claude Code (Max plan)** | **Website `/create`** |
|---|---|---|
| Cost | Your Max subscription (no API credits). Only Exa + one embedding + Pinecone + the Sanity write cost a few pennies. | Anthropic **API credits** per article, plus the same Exa/embedding/Pinecone. |
| Where | Claude Code, opened in the `silicon-and-stone-web` repo | Any browser, logged in at siliconandstone.com/login |
| Quality | Opus-tier; usually a notch better | Sonnet 4.6 |
| Speed | You drive it; Deep Dive research takes ~5–7 min | Self-serve button; Deep Dive runs as a background job |
| Output | A **draft** in Sanity Studio | A **draft** in Sanity Studio |
| Use when | Default for quality work, or whenever API credits are empty | Quick self-serve, or when you are not in Claude Code |

Both produce an unpublished **draft** in Studio that you review and publish. They
use the same brand voice, persona, research, RAG and metadata — the only real
difference is which model does the writing and who pays for it.

---

## A. Generate in Claude Code (on your Max plan)

### Step 1 — Open Claude Code in the repo
Open Claude Code with the working directory set to the `silicon-and-stone-web`
project (terminal, desktop or IDE — anywhere it can run the repo's scripts).
Nothing else to set up: `.env.local` already holds the keys.

### Step 2 — Type the prompt
Paste this template and fill the three slots (FORMAT, PERSONA, TOPIC). The
wording is chosen to trigger the `ss-draft-local` skill:

```
Use the ss-draft-local skill to draft a [FORMAT] locally on my Max plan
for the [PERSONA] persona.
Topic: [TOPIC]
Brief: [OPTIONAL — angle, emphasis, what to include or avoid]
```

- **FORMAT** — one of: `Pulse`, `Signal`, `Deep Dive`, `Guide`, `YouTube Script`.
- **PERSONA** — say the friendly name or the slug (either works — see the table below).
- **TOPIC** — one plain line. This is the search seed; keep it specific.
- **Brief** — optional. Anything here is treated as authoritative steering
  (the equivalent of the website's Step-4 "Context / Brief" box). Leave the line
  out if you have no steer.

That is the whole prompt. You do **not** need to name the scripts, slugs, or
steps — the skill handles the sequence.

#### Trigger words (any of these in your message will start the skill)
`draft locally` · `on my Max plan` · `ss-draft-local` · `/ss-draft` ·
`draft an article in Claude Code` · `write a Silicon & Stone draft without API credits`

> If Claude Code ever doesn't pick it up, just say: **"Run the ss-draft-local
> skill"** and give it the FORMAT, PERSONA and TOPIC.

### Step 3 — Let it run
Claude Code will, in order: gather research (Exa), synthesise it, write the
draft, run the voice-edit pass, extract SEO/metadata, and save a draft to Sanity.
It reports back the draft ID and the Studio link.

- **Pulse / Signal / Guide / YouTube:** about a minute or two.
- **Deep Dive:** the research alone takes ~5–7 minutes (Exa Research Pro), so the
  whole run is ~10–15 minutes. This is expected.

### Step 4 — Review and publish in Studio
Open siliconandstone.com/studio → **Article**. Find your new draft.
- Read it. Resolve any **`[AUTHOR: …]`** placeholders — these are specifics the
  system refused to invent (a figure, a primary-source link). Fill them in or
  delete the sentence.
- Check the Stone Truth line, categories, persona and intelligence tier.
- When happy, **Publish** in Studio.

### Worked examples (copy, change the topic)

Signal:
```
Use the ss-draft-local skill to draft a Signal locally on my Max plan
for the Operations / Supply Chain persona.
Topic: Taiwan drought risk and 2026 wafer-fab water rationing
```

Deep Dive with a brief:
```
Use the ss-draft-local skill to draft a Deep Dive locally on my Max plan
for the Policy Analyst persona.
Topic: The EU Cyber Resilience Act and its effect on open-source maintainers
Brief: Lead with the maintainer-liability question. UK and EU angle only,
no US detail. Assume the reader already knows what the CRA is.
```

Pulse:
```
Use the ss-draft-local skill to draft a Pulse locally on my Max plan
for the General Public persona.
Topic: What the new US–Netherlands lithography export deal actually changes
```

---

## B. Reference tables

### Personas (say the name or the slug)

| Friendly name | Slug | Who it is |
|---|---|---|
| Legal / Compliance | `compliance-clara` | Legal/Compliance Officer |
| Operations / Supply Chain | `industrial-ian` | Operations/Supply Chain Manager |
| Policy Analyst | `sovereign-sofia` | Policy Analyst/Advisor |
| Regional Development | `remote-robert` | Regional Development Professional |
| General Public | `global-citizen` | General Public/Generalist Reader |

### Formats

| Format | Length | Intelligence tier | Use for |
|---|---|---|---|
| Pulse | under ~600 words | pulse | A 30-second scan of one development |
| Signal | ~800–1,200 words | briefing | Rapid "what just happened and what it means" |
| Deep Dive | 3,000+ words | audit | The definitive forensic reference on a topic |
| Guide | ~500–2,000 words | (varies) | How-to for a tool or technique |
| YouTube Script | 12–18 min outline | (varies) | A video script outline |

> "Research only" (gather intel without drafting) exists on the website but is
> not a Claude Code drafting format — if you only want research, just ask Claude
> Code to research the topic directly.

---

## C. Website generation (after topping up credits)

**Yes — topping up your Anthropic API credits restores the website generator.**
The only reason `/create` currently fails is that the Anthropic API account is at
a zero/low balance (the error is the generic "Analysis failed to parse"; the real
cause is `400 — credit balance is too low`). Once credits are added, the in-app
button works again with no code change.

To use it:
1. Go to siliconandstone.com/login and enter the writer access code.
2. Open **Create** (or click a dashboard card — "New Signal" / "New Deep Dive"
   carry the format through).
3. Pick **Format**, **Target Persona**, type the **Primary Topic**, and
   optionally fill the **Context / Brief** box.
4. Click **Launch Agent** → review the gathered intelligence → click
   **Generate [Format]**.
5. It saves a draft to Studio; review and publish as in Step 4 above.

The website path bills API credits per article (a Deep Dive is roughly a few tens
of cents; Signals/Pulses less). The Claude Code path avoids that by using your
Max plan — so keep Claude Code as the default and treat the website as the
self-serve fallback.

---

## D. Quick troubleshooting

- **"It didn't trigger the skill."** Say "Run the ss-draft-local skill" and give
  FORMAT / PERSONA / TOPIC.
- **A draft has `[AUTHOR: …]` notes.** That is by design — the system never
  invents figures or sources. Fill them in Studio before publishing.
- **Deep Dive feels slow.** Normal — Exa Research Pro runs for minutes. Let it.
- **Website still says "Analysis failed to parse."** Credits are still empty —
  top up the Anthropic account.
- **Wrong persona/topic in the draft.** It is only a draft; tell Claude Code to
  redo it with the corrected persona or topic, or discard it in Studio.
