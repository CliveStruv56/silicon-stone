/**
 * Retention and marketing-use decisions (§22.1 and §22.2), recorded.
 *
 * These were the last two of §22's open decisions that release criterion 16
 * waited on. The spec's instruction was "must not be guessed during
 * implementation" — not "must not be written down". Taken by the owner on
 * 2026-08-19: **adopt the periods v1 already runs, explicitly, and keep the
 * report email to delivery use with marketing as a separate, optional,
 * unticked consent.**
 *
 * Two things about the shape of this file.
 *
 * **It is a decision record, not a configuration.** Nothing reads these to
 * decide how long to keep something — v1's own constants still do that, in
 * `report/record.ts`, `report/capture.ts` and `checker-session-schema.ts`. What
 * this file holds is the *policy*, which is a different object: it is what a
 * privacy notice promises, and it has to be stateable in one place before it can
 * be published. `retention.test.ts` and `scripts/compliance-v2-check.ts` assert
 * the two agree, so the promise and the behaviour cannot drift apart silently.
 * That is the same arrangement the regulatory lane uses against the rule pack:
 * the lanes assert consistency with each other, they never share storage.
 *
 * **The numbers are v1's, adopted deliberately rather than inherited by
 * accident.** That distinction is the whole reason §22.1 was held open: copying
 * a constant makes it policy by default, and a period nobody chose is not a
 * promise anybody can defend. Each carries its reasoning below.
 *
 * A period is stated in seconds and in prose. The prose is what a reader sees;
 * the seconds are what a test can compare. Deriving the prose from the number
 * would be neater and worse — "30 days" and "two years" are the words the notice
 * uses, and a formatter that rendered "730 days" would quietly change what was
 * promised.
 */

export const RETENTION_DECIDED_ON = '2026-08-19'

export interface RetentionPolicy {
  id: 'generated-report' | 'report-email' | 'assessment-session'
  /** What is kept. */
  what: string
  seconds: number
  /** As a privacy notice would say it. */
  period: string
  /** Why this length and not another. */
  because: string
  /** Where the behaviour that implements it lives. */
  implementedIn: string
}

const DAY = 60 * 60 * 24

export const RETENTION: RetentionPolicy[] = [
  {
    id: 'generated-report',
    what: 'A generated report, and the answers it was built from.',
    seconds: DAY * 30,
    period: '30 days',
    because:
      'Long enough that a signed link still works when somebody comes back to it after a fortnight, and short enough that the tool is not quietly accumulating a file of other organisations’ compliance positions. A report is a snapshot of a legal position that changes; one kept for a year would invite reliance on a stale answer, which is the failure this whole rebuild exists to avoid.',
    implementedIn: 'REPORT_TTL_SECONDS in src/lib/report/record.ts',
  },
  {
    id: 'report-email',
    what: 'The email address a report was sent to, and the consent record for it.',
    seconds: DAY * 730,
    period: 'two years',
    because:
      'Longer than the report on purpose, and for a different reason: this is the evidence that consent was given and what wording was shown. Deleting it with the report would destroy the record of the lawful basis while the consequences of having relied on it were still live. Two years is the shortest period that outlasts a plausible dispute about whether somebody agreed to be emailed.',
    implementedIn: 'CAPTURE_TTL_SECONDS in src/lib/report/capture.ts',
  },
  {
    id: 'assessment-session',
    what: 'An in-progress assessment: the answers given so far.',
    seconds: DAY,
    period: '24 hours',
    because:
      'A working file, not a record. It exists so a long questionnaire survives a closed tab, and nothing about it is worth keeping once the session is over. This is also why §22.3 — anonymous session recovery across devices — stays open rather than being resolved by lengthening this: recovery is a feature to decide on, not a side effect of a retention number.',
    implementedIn: 'CHECKER_SESSION_TTL_SECONDS in src/lib/checker-session-schema.ts',
  },
]

export const RETENTION_BY_ID = new Map(RETENTION.map((policy) => [policy.id, policy]))

/**
 * §22.2, decided: the report email is for delivering the report.
 *
 * Marketing is a separate consent, offered separately, defaulting to false, and
 * recorded with the wording that was shown. `report/consent.ts` already makes
 * the alternative unrepresentable — there is no single value meaning "agreed to
 * both" — so this constant records the *decision* that the implementation's
 * default is also the policy, rather than a default nobody ever ratified.
 */
export const MARKETING_USE = {
  permitted: false,
  statement:
    'The address you give for a report is used to send you that report, and to tell you if the assessment behind it changes. It is not added to a marketing list unless you separately ask for that, which is a different tick box with its own wording.',
  decidedOn: RETENTION_DECIDED_ON,
} as const

/**
 * Everything a privacy notice needs to state about what this tool keeps.
 *
 * Assembled rather than written twice, so the notice cannot come to say
 * something the decision record does not.
 */
export function retentionSummary(): string[] {
  return RETENTION.map((policy) => `${policy.what} Kept for ${policy.period}.`)
}
