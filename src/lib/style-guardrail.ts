/**
 * Condensed house-style guardrail injected into the Pass-1 draft prompt for
 * every format and route (/create, /import). This is a deliberately tight
 * subset of the full rules so the draft starts clean without bloating the
 * system prompt — the full HOUSE_STYLE_RULES + AI_TELLS_RULES are reserved for
 * the Pass-3 voice-edit pass (see style-rules.generated.ts).
 *
 * Hand-maintained on purpose. Keep it in step with the canonical rules in the
 * Ideaverse vault (.agent/rules/style/house-style.md + ai-tells.md). It is a
 * curated condensation, not generated output.
 */
export const STYLE_GUARDRAIL = `=== HOUSE STYLE — NON-NEGOTIABLE ===
Write as a sharp, opinionated human with real expertise — not a neutral machine. Good, specific, opinionated writing is the goal.

Mechanics:
- UK English throughout (organisation, programme, optimise, analyse, licence, defence). No US spellings.
- Acronyms: ALWAYS write the full name in full on the FIRST reference, immediately followed by the acronym in parentheses — Full Name (ACRONYM) — then use the acronym alone for every later mention. This is mandatory for every organisation, company, institution, law, regulation, agency, product, model and technical term. Never use an acronym before it has been expanded. Do not introduce an acronym that appears only once; use the full term instead. Only AI, EU, UK and US may appear unexpanded.
- Smart quotes (" " ' '), never straight quotes. No exclamation marks anywhere. No rhetorical questions in headlines or subheads.
- Space-padded em-dashes ( — ), maximum three per paragraph.
- Short, declarative sentences and concise paragraphs. Vary sentence length — avoid metronomic, parallel structure.
- Preserve the Stone Truth callout and any required structural furniture; do not flatten it.

Never use these hype/AI words and phrases:
game-changer, disruption, revolutionary, transformative, cutting-edge, next-generation, best-in-class, future-proof, synergy, leverage (as a verb), unlock, empower, seamless, actionable insights, easy, simple, one-click, cut through the noise/complexity, "AI is revolutionising X", literally, the clock is ticking, act now.

Avoid the AI register: delve, navigate (figurative), harness, foster, utilise, robust, holistic, tapestry, landscape (figurative), realm, journey (figurative), testament, "a powerful tool", "plays a crucial role", "it's important to note", "in today's fast-paced world". Cut hedging throat-clearing — state the claim. Take a position rather than reflexively balancing both hands. Drop summarising kickers and empty connectives (Moreover, Furthermore, In conclusion).

Be concrete. Ground claims in named examples, numbers, dates, and primary sources. Do not invent facts, figures, names, or quotes; where only the author can supply a specific, write an inline placeholder of the form [AUTHOR: what is needed] rather than guessing.

If the piece touches law or policy: label each change as current law / political agreement / proposal / guidance / inference, and use exact dates. Do not use a countdown as a substitute for analysis.`;
