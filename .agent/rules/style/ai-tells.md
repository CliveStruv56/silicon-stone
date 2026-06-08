---
type: style
scope: global
canonical: true
updated: 2026-06-08
---

# AI Tells — Detection & Removal (canonical)

> **This file is the single source of truth.** The website repo consumes these
> rules via sync — it never edits them. After changing this file, run
> `sync-style.sh`.

This covers the **general AI register** — the tics that survive a banned-word
clean-up. For the author's own banned words, smart-quote and em-dash rules, and
register, [[house-style]] is the authority and takes precedence. Enforce both:
the house list first, then everything below.

## 1. Banned / suspect vocabulary

Words and phrases that cluster heavily in generated text. Cut or replace with
plainer, more specific language. Not every instance is wrong — but density is the
signal. If three or more appear in a paragraph, the paragraph needs rewriting.

**Verbs & abstract nouns**
delve, navigate (figurative), leverage, utilise, foster, harness, unlock,
elevate, embark, underscore, showcase, spearhead, streamline, facilitate,
empower, cultivate, garner, glean

**The "grand register"**
tapestry, landscape (figurative), realm, journey (figurative), testament,
beacon, cornerstone, bedrock, gateway, ever-evolving, ever-changing,
fast-paced world, digital age, in today's world, at its core, the heart of

**Inflated adjectives**
robust, seamless, cutting-edge, state-of-the-art, game-changing, transformative,
pivotal, crucial, vital, comprehensive, holistic, multifaceted, nuanced (when
used to avoid taking a position), invaluable, unparalleled, myriad

**Stock phrases**
"a powerful tool", "plays a crucial/vital/key role", "a wide range of",
"the world of", "when it comes to", "at the end of the day", "the key takeaway",
"it's no secret that", "more than ever before", "stand the test of time",
"the possibilities are endless", "only time will tell"

> The house banned list in [[house-style]] adds the author's own terms
> (`game-changer`, `unlock`, `empower`, `seamless`, `leverage` as a verb, etc.)
> and the artificial-urgency phrases. Enforce that list as strictly as this one —
> several of those words are also classic AI tells.

## 2. The hedge reflex

Generated text hedges to avoid commitment. Cut the throat-clearing and state the
claim, or cut the claim entirely if it can't be defended.

- "It's important to note that…" → just say the thing
- "It's worth considering…" → consider it for the reader, or drop it
- "can be a valuable / powerful…" → is it, or isn't it? commit
- "may potentially / could possibly" → one modal, not two
- "Some might argue…" → who, and do they have a point worth answering?
- "While there are many factors…" → name the factors that matter

## 3. Structural tics

These survive a vocabulary clean-up and are the harder tell.

- **Rule of three, relentlessly.** "fast, reliable, and scalable" / three-item
  lists in every sentence. Vary the count. Sometimes one. Sometimes four.
- **"It's not just X — it's Y."** And its cousin "X isn't about A; it's about B."
  Striking once; a verbal tic by the third use.
- **"From A to B" sweeps.** "From startups to enterprises, from coding to
  marketing…" Almost always replaceable with one concrete example.
- **Parallel paragraph architecture.** Every section the same length, same
  shape, same topic-sentence-then-three-supports rhythm. Break it.
- **The summarising kicker.** A final sentence that restates the paragraph in
  slightly different words. Delete it; the paragraph already made the point.
- **Bullet lists for prose.** AI reaches for bullets to avoid writing
  connective argument. If the items form an argument, write the argument.
- **Bold-everywhere emphasis.** Scattergun **bolding** of phrases that aren't
  actually the key point. Reserve emphasis for where it earns its place.

## 4. Empty connectives & transitions

- "Moreover", "Furthermore", "Additionally", "What's more" — usually deletable;
  if the logical link matters, make it explicit instead.
- "In conclusion", "In summary", "To wrap up" — cut; just conclude.
- "Firstly / Secondly / Lastly" as paragraph openers — only keep if the
  sequence genuinely matters.
- Section openers that announce what the section will do ("In this section,
  we'll explore…") rather than doing it.

## 5. False balance

AI defaults to evenhandedness even when the author has earned a view. Signs:

- Every claim immediately qualified by its opposite.
- "On one hand… on the other hand…" where the author clearly favours one hand.
- Conclusions that refuse to conclude ("ultimately, it depends").

Fix: state the position. Acknowledge the strongest counter-argument *once*,
honestly, then say why the author still holds the view. A real opinion, defended,
is the most human thing on the page.

## 6. The absence test (most important)

Read the draft and ask: **could this paragraph have been written by someone who
had never done the work?** If yes, it needs a specific only the author has — a
number, a name, a date, a client situation, a contrarian take, a lived detail.
Generality is the deepest AI tell, and the only fix is concrete knowledge. Flag
these gaps as `[AUTHOR: …]` placeholders describing exactly what is needed — never
invent facts, statistics, names, or quotes to fill them.
