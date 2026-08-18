import { RULE_PACK } from '@/lib/rulepack'
import type {
  AnswerRecordV2,
  ComplianceFindingV2,
  EvaluatedRole,
  EvaluatedScope,
  LegalRole,
  LegalSourceReference,
  OrganisationSizeResult,
} from '../types'
import { PROPOSITION_BY_ID } from '../legal-content/propositions'
import { heldRoles } from './roles'
import { sizeReliefIsSettled } from './organisation-size'
import { evaluateAnnexI, evaluateAnnexIII, evaluateArticle6Exemption } from './annex-routes'
import { evaluateArticle5 } from './article-5'
import { evaluateArticle50, routesOwedBy } from './article-50'
import type { ClassificationResult } from './classify'
import { ANNEX_III_APPLIES, ANNEX_I_APPLIES, isInApplication, packDate } from './dates'

/**
 * Turning route evaluations into the typed findings the result renders.
 *
 * Two rules shape every function below, and both are lessons from v1.
 *
 * **A finding is emitted only where the answers put it there.** v1 showed every
 * SME an Article 57 sandbox measure and an Article 99(6) penalty ceiling
 * whatever their result — defect 4, and §4.5's "no irrelevant information". So
 * nothing here is unconditional: the size reliefs are gated on actually holding
 * provider duties, and the penalty finding on there being something for it to
 * be about (§12.4).
 *
 * **A duty is never assigned to a role that does not hold it.** The Article 50
 * routes already carry `owedBy`; here that becomes the difference between a
 * `current_obligation` and a `supplier_responsibility`, which are different
 * sections of the result with different verbs.
 *
 * Every finding that cites law carries a `source` built from an approved
 * proposition, so §20.11 — "every legal proposition is selected from the
 * approved library" — is structural rather than a matter of care.
 */

function sourceFrom(propositionId: string): LegalSourceReference | undefined {
  const proposition = PROPOSITION_BY_ID.get(propositionId)
  if (!proposition) return undefined
  return {
    documentId: proposition.documentId,
    documentTitle: proposition.documentTitle,
    provision: proposition.provision,
    officialUrl: proposition.officialUrl,
    rulepackVersion: proposition.rulepackVersion,
    reviewedAt: proposition.reviewedAt,
    shortExtract: proposition.shortExtract,
    plainEnglishSummary: proposition.plainEnglishSummary,
    conditions: proposition.conditions,
    exceptions: proposition.exceptions,
    reviewStatus: proposition.reviewStatus,
  }
}

export interface FindingContext {
  answers: AnswerRecordV2
  scope: EvaluatedScope
  roles: EvaluatedRole[]
  size: OrganisationSizeResult
  classification: ClassificationResult
  assessedAt: string
}

const HIGH_RISK: Array<ClassificationResult['classification']> = [
  'likely_high_risk',
  'possible_high_risk',
]

export function buildLegalFindings(context: FindingContext): ComplianceFindingV2[] {
  const { answers, scope, roles, size, classification, assessedAt } = context
  const held = heldRoles(roles)
  const findings: ComplianceFindingV2[] = []

  /**
   * §9.3. An out-of-scope result emits no current EU AI Act obligation of any
   * kind — the defect that made v1's out-of-scope screen contradict itself. It
   * returns early rather than filtering at the end, because a filter is
   * something a later edit can slip past.
   */
  if (scope.outcome === 'out_of_scope') return []

  /**
   * Article 5, in three shapes rather than one (§7.6).
   *
   * Before the per-practice trees existed this loop emitted one alarm per ticked
   * box and never cleared. Now a practice arrives here as `all_limbs_met`,
   * `unresolved` or `not_engaged`, and each gets a different card — including,
   * importantly, the last one. A reader who ticked "infers emotions" and whose
   * use is a medical one is *told* that Article 5(1)(f) excepts it, rather than
   * being left with an alarm and no way to clear it.
   */
  const article5 = evaluateArticle5(answers)
  const article5Roles = held.length ? held : (['deployer'] as LegalRole[])

  for (const practice of article5.engaged) {
    const complete = practice.outcome === 'all_limbs_met'
    findings.push({
      id: `article-5-${practice.point}`,
      ruleId: 'article-5-conditions',
      title: complete
        ? `Every limb of this prohibition is met on your answers: ${practice.summary}`
        : `Possible prohibited practice: ${practice.summary}`,
      // Never a `current_obligation`, on either path. §7.6 forbids concluding
      // "prohibited", and a prohibition is not an obligation in any case: there
      // is nothing to do that discharges it.
      kind: 'unresolved_issue',
      applicability: complete ? 'likely_applies' : 'possibly_applies',
      appliesToRoles: article5Roles,
      effectiveFrom: practice.appliesFrom,
      whyItApplies: complete
        ? `You selected this practice on the Article 5 screen, and your answers satisfy every limb of the definition: ${practice.satisfied.join('; ')}. No exception the provision states applies on those answers.${
            practice.appliesFrom ? ` It becomes prohibited on ${practice.appliesFrom}, not today.` : ''
          }`
        : `You selected this practice on the Article 5 screen. ${
            practice.satisfied.length
              ? `Your answers establish that ${practice.satisfied.join('; ')}.`
              : 'None of its limbs has been settled yet.'
          } ${
            practice.unresolved.length === 1 ? 'One limb is' : `${practice.unresolved.length} limbs are`
          } still open, so this is unresolved rather than cleared.${
            practice.appliesFrom ? ` It becomes prohibited on ${practice.appliesFrom}, not today.` : ''
          }`,
      practicalMeaning: complete
        ? 'A prohibition has no compliance route: there is no conformity assessment that satisfies it, no documentation that cures it and no risk measure that makes it lawful. Every limb of the definition being met on your own answers is as close as this tool comes to a conclusion — and it stops there, because these are judgements about your system that a court would take evidence on.'
        : `A prohibition has no compliance route: there is no conformity assessment that satisfies it, no documentation that cures it and no risk measure that makes it lawful. Whether it is engaged here turns on ${
            practice.unresolved.length === 1 ? 'one limb' : 'limbs'
          } this assessment has not settled: ${practice.unresolved.join('; ')}.`,
      action: complete
        ? 'Take legal advice on this specific use today, before the system goes any further. Bring this result and the answers behind it — the limbs are already identified, which is most of what an adviser needs to start.'
        : `Settle the open ${practice.unresolved.length === 1 ? 'limb' : 'limbs'} first — they are questions about your own system, not about the law — and take legal advice on what is left.`,
      evidenceToKeep: [
        'A written description of the use, the people affected, and what the system actually does.',
        'Your answers to the Article 5 questions, and who in the organisation gave them.',
      ],
      triggeringAnswerIds: practice.triggeringAnswerIds,
      missingAnswerIds: practice.missingAnswerIds,
      source: sourceFrom(`prop-art-5-1-${practice.point}`),
      priority: 'urgent',
      // Never `high`. A complete path is a complete path through self-reported
      // answers, against legal content that has not been counsel-reviewed.
      confidence: complete ? 'medium' : 'low',
    })
  }

  /**
   * The cleared practices, reported rather than dropped.
   *
   * §4.5 forbids irrelevant material, and this is not that: the reader raised
   * the flag, and the tool owes them the answer. It is typed
   * `recommended_safeguard` because what survives *is* a recommendation — the
   * exclusion rests on a fact that can change, and saying which fact is the
   * useful part.
   */
  for (const practice of article5.cleared) {
    findings.push({
      id: `article-5-cleared-${practice.point}`,
      ruleId: 'article-5-conditions',
      title: `Not engaged on your answers: ${practice.summary}`,
      kind: 'recommended_safeguard',
      applicability: 'applies',
      appliesToRoles: article5Roles,
      whyItApplies: `You flagged this practice on the Article 5 screen, and it is not engaged on your answers, because ${practice.clearedBecause}. That is a conclusion about the answers you gave rather than about the system in general.`,
      practicalMeaning:
        'Article 5’s prohibitions are cumulative: every limb of the definition has to be met, and where the provision states an exception, that exception takes the case out. One limb failing is enough, which is why most systems that trip the broad screen are not caught by the provision behind it.',
      action:
        'Record why this does not apply, in one paragraph, with the date. If the fact it rests on changes — a different setting, a different purpose, a safeguard that lapses — re-run this assessment before the change goes live.',
      evidenceToKeep: [
        'A dated note of the limb that is not met, and the evidence for it.',
      ],
      triggeringAnswerIds: practice.triggeringAnswerIds,
      missingAnswerIds: [],
      source: sourceFrom(`prop-art-5-1-${practice.point}`),
      priority: 'normal',
      confidence: 'medium',
    })
  }

  const annexIII = evaluateAnnexIII(answers)
  const annexI = evaluateAnnexI(answers)
  const exemption = evaluateArticle6Exemption(answers, annexIII)
  const isHighRisk = HIGH_RISK.includes(classification.classification)
  const highRiskDate = annexI.applicability === 'applies'
    ? packDate(ANNEX_I_APPLIES)
    : packDate(ANNEX_III_APPLIES)

  /**
   * §9.4: "The display layer must calculate status using the assessment date and
   * must never label a future duty 'immediate.'" Computed here rather than in
   * the component, so the same result read from a stored record next year says
   * the same thing — and so a duty that has come into application since is
   * reported as current rather than staying "later" forever.
   */
  const highRiskKind = isInApplication(highRiskDate, assessedAt)
    ? ('current_obligation' as const)
    : ('future_obligation' as const)

  if (isHighRisk) {
    if (held.includes('deployer')) {
      findings.push({
        id: 'art-26-6-log-retention',
        ruleId: 'high-risk-log-retention',
        title: 'Keep the logs the system generates',
        kind: highRiskKind,
        applicability: classification.classification === 'likely_high_risk' ? 'applies' : 'possibly_applies',
        appliesToRoles: ['deployer'],
        effectiveFrom: highRiskDate.display,
        whyItApplies: `The system reaches the high-risk tier through ${classification.statutoryRoutes.join(' and ')}, and you use it under your own authority.`,
        practicalMeaning:
          'Six months is a floor, not a target, and the duty only reaches logs you can actually control.',
        action:
          'Establish now that the system can export its logs, and that you have somewhere to keep them. A system whose logs you cannot export leaves you owing a duty you have no means to discharge.',
        evidenceToKeep: ['Exported logs, and a note of the retention period you chose and why.'],
        triggeringAnswerIds: classification.triggeringAnswerIds,
        missingAnswerIds: [],
        source: sourceFrom('prop-art-26-6-deployer-log-retention'),
        priority: 'high',
        confidence: classification.confidence,
      })

      findings.push({
        id: 'art-13-instructions-for-use',
        ruleId: 'vendor-instructions-missing',
        title: 'Obtain the instructions for use, including the oversight measures',
        kind: 'supplier_responsibility',
        applicability: 'applies',
        appliesToRoles: ['provider'],
        effectiveFrom: highRiskDate.display,
        whyItApplies:
          'This duty is the provider’s, not yours — but the instructions are what tell you whether your own oversight can act on what the system produces.',
        practicalMeaning:
          'A provider of a high-risk system must state the human oversight measures in the instructions for use, including the technical measures that help you interpret its output.',
        action: 'Ask your supplier for it during procurement, while you still have leverage.',
        evidenceToKeep: ['The instructions for use, dated, as supplied.'],
        triggeringAnswerIds: classification.triggeringAnswerIds,
        missingAnswerIds: [],
        source: sourceFrom('prop-art-13-3-d-oversight-measures'),
        priority: 'normal',
        confidence: 'high',
      })
    }

    /**
     * The provider's own duties (Chapter III, Section 2).
     *
     * Added 2026-08-19, after Phase 8's shadow comparison showed a high-risk
     * *provider* receiving no duty at all — only an SME documentation relief.
     * The deployer path had Article 26(6) and the supplier-instructions item;
     * the provider path had nothing unless the Article 6(3) derogation was
     * available. A tool that tells the provider of a high-risk recruitment
     * system that they owe nothing is worse than one that says nothing at all.
     *
     * Not the whole of Section 2 — Articles 10, 14, 15, 16 and 43 are not in the
     * pinned corpus, so nothing here could verify a citation to them. What is
     * here is the subset the pack can back, and the last finding says plainly
     * that it is a subset. Adding the rest means adding them to the corpus,
     * which is a pack version bump.
     */
    if (held.includes('provider')) {
      const PROVIDER_DUTIES: Array<{
        id: string
        propositionId: string
        title: string
        why: string
        action: string
        evidence: string[]
        priority: ComplianceFindingV2['priority']
      }> = [
        {
          id: 'art-9-risk-management',
          propositionId: 'prop-art-9-risk-management',
          title: 'Run a risk management system for the system’s whole life',
          why: 'You supply this system, and it reaches the high-risk tier, so the Chapter III requirements fall on you rather than on the organisations using it.',
          action:
            'Give it an owner and a review cadence before you give it a template. A process nobody runs is the failure mode here, and it is the one an auditor finds first.',
          evidence: ['The risk register, its review dates, and who signed each review.'],
          priority: 'high',
        },
        {
          id: 'art-11-technical-documentation',
          propositionId: 'prop-art-11-technical-documentation',
          title: 'Draw up the technical documentation before launch, not after',
          why: 'You supply this system. Annex IV sets out what the documentation contains, and Article 11 sets out when it has to exist.',
          action:
            'Start it now and date it. If your organisation is an SME or a small mid-cap, look at the simplified form in Article 11(1) — it is a real reduction in work, and it is yours to take up.',
          evidence: ['The dated technical documentation, and the version history showing it is kept current.'],
          priority: 'high',
        },
        {
          id: 'art-12-record-keeping',
          propositionId: 'prop-art-12-record-keeping',
          title: 'Build the system so it records its own events',
          why: 'You supply this system, so its logging capability is a design decision you make rather than one your customers can retrofit.',
          action:
            'Check what the system records today against what Article 12(2) asks it to enable, and treat any gap as engineering work with a deadline rather than as documentation.',
          evidence: ['A description of what is logged, and a sample export.'],
          priority: 'high',
        },
        {
          id: 'art-17-quality-management',
          propositionId: 'prop-art-17-quality-management',
          title: 'Put a quality management system in place, in writing',
          why: 'You supply this system. This is the largest single item on a small provider’s list, and the one with the longest lead time.',
          action:
            'Read Article 17(1)’s list before deciding how big this is — much of it is describing what you already do. If you are an SME, Article 17(2) allows a simplified approach.',
          evidence: ['The written policies, procedures and instructions, and their approval dates.'],
          priority: 'high',
        },
        {
          id: 'art-19-provider-log-retention',
          propositionId: 'prop-art-19-provider-log-retention',
          title: 'Keep the logs your system generates, where they are yours to keep',
          why: 'You supply this system. This is the provider side of the same duty your deployers owe under Article 26(6).',
          action:
            'Establish which logs are under your control and which sit on a customer’s infrastructure. The answer decides whose duty it is, and it is worth having in writing before anyone asks.',
          evidence: ['The retention period chosen, the reasoning for it, and where the logs live.'],
          priority: 'normal',
        },
      ]

      for (const duty of PROVIDER_DUTIES) {
        findings.push({
          id: duty.id,
          ruleId: 'high-risk-provider-duties',
          title: duty.title,
          kind: highRiskKind,
          applicability:
            classification.classification === 'likely_high_risk' ? 'applies' : 'possibly_applies',
          appliesToRoles: ['provider'],
          effectiveFrom: highRiskDate.display,
          whyItApplies: `${duty.why} The route is ${classification.statutoryRoutes.join(' and ')}.`,
          practicalMeaning:
            PROPOSITION_BY_ID.get(duty.propositionId)?.practicalMeaning ??
            'A requirement of Chapter III, Section 2, which applies to providers of high-risk systems.',
          action: duty.action,
          evidenceToKeep: duty.evidence,
          triggeringAnswerIds: classification.triggeringAnswerIds,
          missingAnswerIds: [],
          source: sourceFrom(duty.propositionId),
          priority: duty.priority,
          confidence: classification.confidence,
        })
      }

      // Registration is Annex III only — Article 49(1) is written about systems
      // listed in Annex III, and an Annex I product route reaches the database
      // by a different provision the pack does not carry.
      if (annexIII.applicability === 'applies' || annexIII.applicability === 'likely_applies') {
        findings.push({
          id: 'art-49-registration',
          ruleId: 'high-risk-provider-duties',
          title: 'Register yourself and the system in the EU database before launch',
          kind: highRiskKind,
          applicability:
            classification.classification === 'likely_high_risk' ? 'applies' : 'possibly_applies',
          appliesToRoles: ['provider'],
          effectiveFrom: highRiskDate.display,
          whyItApplies: `You supply this system and it is listed in Annex III, so registration is a condition of placing it on the market. The route is ${classification.statutoryRoutes.join(' and ')}.`,
          practicalMeaning:
            PROPOSITION_BY_ID.get('prop-art-49-registration')?.practicalMeaning ?? '',
          action:
            'Treat this as part of the launch checklist rather than as paperwork that follows launch. Note that Article 49(2) requires the same registration even where you have concluded the system is *not* high-risk under Article 6(3).',
          evidenceToKeep: ['The registration reference, and the date it was completed.'],
          triggeringAnswerIds: classification.triggeringAnswerIds,
          missingAnswerIds: [],
          source: sourceFrom('prop-art-49-registration'),
          priority: 'high',
          confidence: classification.confidence,
        })
      }

      /**
       * And the honest limit on the list above. §4.5 forbids irrelevant
       * material; it does not permit a subset presented as a whole. A provider
       * reading five duties and inferring that five is the number would be
       * misled by an omission this tool created.
       */
      findings.push({
        id: 'high-risk-provider-duties-incomplete',
        ruleId: 'high-risk-provider-duties',
        title: 'This is not the complete list of what a provider owes',
        kind: 'unresolved_issue',
        applicability: 'applies',
        appliesToRoles: ['provider'],
        whyItApplies:
          'The duties above are the ones this tool can quote from the statute it has pinned. Chapter III, Section 2 contains more of them, and they are no less binding for being absent here.',
        practicalMeaning:
          'Data governance, human oversight, accuracy and robustness, the provider obligations in Article 16 and the conformity assessment in Article 43 all apply to a high-risk system and are not assessed above. This tool shows what it can verify against its pinned copy of the Regulation, and says so rather than letting a short list read as a complete one.',
        action:
          'Read Chapter III, Section 2 in full, or have someone read it for you, before treating the list above as your scope of work.',
        evidenceToKeep: [],
        triggeringAnswerIds: classification.triggeringAnswerIds,
        missingAnswerIds: [],
        priority: 'high',
        confidence: 'high',
      })
    }

    if (held.includes('provider') && exemption.outcome === 'available') {
      findings.push({
        id: 'art-6-4-exemption-documentation',
        ruleId: 'annex-iii-exemption-duties',
        title: 'Document the assessment behind your exemption, before launch',
        kind: 'conditional_obligation',
        applicability: 'applies',
        appliesToRoles: ['provider'],
        effectiveFrom: highRiskDate.display,
        whyItApplies:
          'You have taken the position that Article 6(3) lifts the classification. That position is not a silent one.',
        practicalMeaning:
          'The assessment has to exist before the system is placed on the market or put into service. Writing it up after a regulator asks does not satisfy the paragraph, and the date on the document is what shows which happened.',
        action: 'Write the assessment now, and register in the EU database as Article 49(2) requires.',
        evidenceToKeep: ['The dated assessment, and the registration reference.'],
        triggeringAnswerIds: exemption.triggeringAnswerIds,
        missingAnswerIds: [],
        source: sourceFrom('prop-art-6-4-exemption-documentation'),
        priority: 'high',
        confidence: 'high',
      })
    }
  }

  /**
   * The Article 6(3) derogation, where it was available. An entitlement, not a
   * duty — and one whose conditions are worth putting in front of the reader,
   * because it is claimed rather than granted.
   */
  if (exemption.outcome === 'available') {
    findings.push({
      id: 'art-6-3-derogation',
      ruleId: 'annex-iii-exemption',
      title: 'The narrow-task derogation is available to this system',
      kind: 'entitlement_or_relief',
      applicability: 'applies',
      appliesToRoles: held.length ? held : ['provider'],
      whyItApplies: exemption.explanation,
      practicalMeaning:
        'It changes which requirements apply, not whether the Regulation does. And it is cumulative: both halves have to keep being true.',
      action: 'Record the reasoning, and revisit it whenever the system’s role in the decision changes.',
      evidenceToKeep: ['The written assessment, dated before launch.'],
      triggeringAnswerIds: exemption.triggeringAnswerIds,
      missingAnswerIds: [],
      source: sourceFrom('prop-art-6-3-derogation'),
      priority: 'normal',
      confidence: 'medium',
    })
  }

  // Article 50, split by who owes what.
  const transparency = routesOwedBy(evaluateArticle50(answers), held)
  const PROPOSITION_BY_ROUTE: Record<string, string> = {
    'art-50-1-interaction': 'prop-art-50-1-interaction-disclosure',
    'art-50-3-emotion-categorisation': 'prop-art-50-3-emotion-categorisation',
    'art-50-4-public-interest-text': 'prop-art-50-4-editorial-exception',
  }

  for (const route of [...transparency.owed, ...transparency.supplierSide]) {
    if (route.applicability === 'does_not_apply') {
      // Still worth showing: an exception that was met is a fact the reader
      // should be able to point at later, and §12.2 asks for exceptions on the
      // card. It is not an obligation, so it is not typed as one.
      findings.push({
        id: `${route.id}-exception`,
        ruleId: route.id,
        title: `${route.provision} does not require disclosure here`,
        kind: 'unresolved_issue',
        applicability: 'does_not_apply',
        appliesToRoles: [route.owedBy],
        whyItApplies: route.explanation,
        practicalMeaning: route.exception ?? 'An exception in the paragraph is met.',
        action: 'Keep the record of what makes the exception apply — it is what you would be asked for.',
        evidenceToKeep: ['A note of the facts the exception rests on.'],
        triggeringAnswerIds: route.triggeringAnswerIds,
        missingAnswerIds: route.missingAnswerIds,
        source: sourceFrom(PROPOSITION_BY_ROUTE[route.id] ?? ''),
        priority: 'low',
        confidence: 'high',
      })
      continue
    }

    const owed = held.includes(route.owedBy)
    findings.push({
      id: route.id,
      ruleId: route.id,
      title: route.duty,
      kind: owed ? 'current_obligation' : 'supplier_responsibility',
      applicability: route.applicability,
      appliesToRoles: [route.owedBy],
      whyItApplies: route.explanation,
      practicalMeaning: owed
        ? 'This one is yours. It is discharged by what you actually do, not by what your contract says.'
        : 'This duty falls on a party whose role you do not hold. It is here so you know to ask for it, not because it is yours to discharge.',
      action: owed
        ? route.duty
        : `Ask the party that holds this role to confirm how they satisfy ${route.provision}.`,
      evidenceToKeep: [owed ? 'A record of the disclosure as users see it.' : 'Their written answer.'],
      triggeringAnswerIds: route.triggeringAnswerIds,
      missingAnswerIds: route.missingAnswerIds,
      source: sourceFrom(PROPOSITION_BY_ROUTE[route.id] ?? ''),
      priority: owed ? 'high' : 'normal',
      confidence: route.applicability === 'applies' ? 'high' : 'medium',
    })
  }

  /**
   * Size relief. v1's accuracy defect was firing these on organisation size
   * alone, which told an SME deploying a chatbot it could simplify Annex IV
   * documentation it never owed. Gated on holding provider duties *and* being
   * on a high-risk path, which is where the reliefs actually bite.
   */
  if (isHighRisk && held.includes('provider') && size.band && size.band !== 'large') {
    findings.push({
      id: 'sme-documentation-relief',
      ruleId: 'size-relief',
      title: 'Simplified technical documentation may be available to you',
      kind: 'entitlement_or_relief',
      applicability: sizeReliefIsSettled(size) ? 'applies' : 'possibly_applies',
      appliesToRoles: ['provider'],
      effectiveFrom: highRiskDate.display,
      whyItApplies: size.summary,
      practicalMeaning:
        'A relief changes the form the documentation takes. It never changes whether documentation is owed, and taking it up has conditions of its own.',
      action: 'Confirm the size position before relying on it, and record what you relied on.',
      evidenceToKeep: ['The size determination and the date it was made.'],
      triggeringAnswerIds: size.triggeringAnswerIds,
      missingAnswerIds: size.missingAnswerIds,
      priority: 'low',
      confidence: sizeReliefIsSettled(size) ? 'medium' : 'low',
    })
  }

  /**
   * §12.4. Penalty information is contextual, never a table. It appears only
   * where there is a finding for it to be about, and it says what it is: not an
   * obligation, and not a prediction.
   */
  // A route the reader holds *and* which was not excepted away. A result whose
  // only transparency duty turned out not to apply has nothing for a penalty
  // ceiling to be about, and showing one there is the universal table wearing a
  // condition.
  const liveTransparencyDuty = transparency.owed.some(
    (route) => route.applicability !== 'does_not_apply'
  )
  const penaltyBasis = article5.engaged.length
    ? RULE_PACK.penalties.find((tier) => /Article 5/.test(tier.infringement))
    : liveTransparencyDuty
      ? RULE_PACK.penalties.find((tier) => /Article 50/.test(tier.infringement))
      : undefined

  if (penaltyBasis) {
    findings.push({
      id: 'enforcement-context',
      ruleId: 'penalties',
      title: `How a fine would be calculated for this kind of infringement`,
      kind: 'enforcement_information',
      applicability: 'applies',
      appliesToRoles: held.length ? held : ['deployer'],
      whyItApplies: `This is here because the result identifies ${
        article5.engaged.length ? 'a possible prohibited practice' : 'a transparency duty'
      }. It is not shown on results it would not relate to.`,
      practicalMeaning: `${penaltyBasis.ceiling} — ${penaltyBasis.basis}. That is the ceiling the Regulation sets, not an estimate of what would happen.`,
      action: 'Nothing. This is information about seriousness, not a task.',
      evidenceToKeep: [],
      triggeringAnswerIds: classification.triggeringAnswerIds,
      missingAnswerIds: [],
      priority: 'low',
      confidence: 'high',
    })
  }

  /**
   * §9.3: "If scope is `scope_uncertain`, legal findings must be conditional or
   * unresolved." Applied here rather than at each emit site, because it is a
   * property of the whole result and a rule applied in fourteen places is a rule
   * that will one day be applied in thirteen.
   *
   * The finding keeps its content and its citation; what changes is the claim
   * being made about it, which is exactly what the uncertainty is about.
   */
  if (scope.outcome === 'scope_uncertain') {
    return findings.map((finding) =>
      finding.kind === 'current_obligation' || finding.kind === 'future_obligation'
        ? {
            ...finding,
            kind: 'conditional_obligation' as const,
            applicability: 'possibly_applies' as const,
            whyItApplies: `${finding.whyItApplies} This is conditional on the Regulation applying at all, which your answers leave unsettled.`,
            missingAnswerIds: [...new Set([...finding.missingAnswerIds, ...scope.missingAnswerIds])],
          }
        : finding
    )
  }

  return findings
}

/**
 * Readiness findings: our recommendations, never the Regulation's requirements.
 *
 * Kept separate from the legal findings at the type level as well as in the
 * result, because the single thing v1's card got most wrong was letting a
 * recommendation sit in a list headed with the word "obligations".
 */
export function buildReadinessFindings(context: FindingContext): ComplianceFindingV2[] {
  const { scope, roles } = context
  const held: LegalRole[] = heldRoles(roles).length ? heldRoles(roles) : ['deployer']
  // §9.3 permits readiness recommendations on an out-of-scope result, "clearly
  // labelled as recommendations" — which `recommended_safeguard` and its own
  // section already are. What it forbids is an obligation, and there are none.
  const outOfScope = scope.outcome === 'out_of_scope'

  return [
    {
      id: 'keep-a-system-record',
      ruleId: 'system-record',
      title: 'Keep a record of this system and this assessment',
      kind: 'recommended_safeguard',
      applicability: 'applies',
      appliesToRoles: held,
      whyItApplies: outOfScope
        ? 'The Regulation does not apply on these answers, so this is a recommendation and nothing more. It is what makes the question answerable if an EU connection is ever added.'
        : 'Not a requirement of the Regulation at this tier. It is what makes every later question — about a change, a complaint, or a supplier — answerable.',
      practicalMeaning:
        'One page per system: what it does, who supplies it, what it decides, and when you last looked at it.',
      action: 'Record this assessment against the system, with its date and the answers behind it.',
      evidenceToKeep: ['The assessment, dated, with the rule pack version it was made against.'],
      triggeringAnswerIds: [],
      missingAnswerIds: [],
      priority: 'normal',
      confidence: 'high',
    },
  ]
}
