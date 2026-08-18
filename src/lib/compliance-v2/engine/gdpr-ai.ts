import type {
  AnswerRecordV2,
  ComplianceFindingV2,
  GdprAiOverlayResult,
  GdprReference,
  GdprRegime,
} from '../types'
import { includesAny, saidUnknown, unsettled, valueOf, valuesOf } from './read'

/**
 * The GDPR-for-AI overlay (§11).
 *
 * **A pure function of the answers, and of nothing else.** Not of the
 * classification, not of the roles, not of the findings. That is how Phase 7's
 * first exit criterion — "GDPR cannot change AI Act classification" — is made
 * structural rather than asserted: this module is downstream of everything and
 * upstream of nothing. `assemble.ts` calls it last, attaches the result to its
 * own field, and no AI Act evaluator imports it. The information flows one way,
 * and the way it does not flow is the safety property.
 *
 * **It cites nothing, and quotes nothing.** §11.3 permits a specific
 * data-protection duty only where "a separately approved GDPR proposition"
 * establishes one, and there are none: the pinned rule pack is the AI Act, and
 * the retrieval corpus that does hold the GDPR is editorial-only and is never an
 * authority for anything on screen. So every finding below speaks in concepts —
 * a lawful basis, special-category data, an impact assessment, a transfer — and
 * the instrument is linked once, at overlay level. Naming an Article here would
 * be a legal claim with nothing behind it, which is the thing this whole
 * codebase is arranged to prevent.
 *
 * **Nothing here is binding.** Every finding is `adjacent_law`,
 * `recommended_safeguard` or `unresolved_issue`, and `appliesToRoles` is empty
 * on all of them. A GDPR duty falls on a controller, and "controller" is not an
 * AI Act role — badging a data-protection consideration "Deployer" would assert
 * a correspondence that does not hold.
 */

export const GDPR_NOTICE =
  'These are data-protection considerations raised by what you told us about this AI system. They are not a GDPR audit, they are not a complete list of your data-protection duties, and nothing here is a legal conclusion about your organisation. Data protection law applies alongside the EU AI Act and independently of it — none of it changes the AI Act position above, and satisfying the AI Act does not satisfy it.'

const EU_GDPR_REFERENCE: GdprReference = {
  label: 'Regulation (EU) 2016/679 — General Data Protection Regulation',
  url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
  appliesTo: 'eu_gdpr',
}

const UK_GDPR_REFERENCE: GdprReference = {
  label: 'The UK GDPR, as retained in UK law, with the Data Protection Act 2018',
  url: 'https://www.legislation.gov.uk/eur/2016/679/contents',
  appliesTo: 'uk_gdpr',
}

const ICO_AI_GUIDANCE: GdprReference = {
  label: 'ICO guidance on AI and data protection',
  url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/',
  appliesTo: 'uk_gdpr',
}

const EDPB_GUIDANCE: GdprReference = {
  label: 'European Data Protection Board — guidelines and opinions',
  url: 'https://www.edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en',
  appliesTo: 'eu_gdpr',
}

export interface GdprJurisdiction {
  regimes: GdprRegime[]
  note: string
  /** True where the answers settled it, false where both are offered for safety. */
  determined: boolean
}

/**
 * Which data-protection regime to talk about (§11.3).
 *
 * The rule the section states is the one that matters: where jurisdiction
 * cannot be determined, say both may need consideration rather than picking one
 * by assumption. So "both" is the fallback, not the guess — and the note always
 * says which of the two it is.
 *
 * There is no UK counterpart to `ai_market_connection` in the catalogue, and one
 * is not added here: §11.2 lists the overlay's questions and a jurisdiction
 * question is not among them. What that costs is precision on the UK side for a
 * non-UK organisation, and the honest answer to that is the undetermined branch
 * rather than a silent "no".
 */
export function gdprJurisdiction(answers: AnswerRecordV2): GdprJurisdiction {
  const establishment = valueOf(answers, 'organisation_establishment')
  const euConnection = valuesOf(answers, 'ai_market_connection').some((value) => value !== 'none')

  if (establishment === 'eu_eea') {
    return {
      regimes: ['eu_gdpr'],
      determined: true,
      note: 'You told us the organisation is established in the EU or EEA, so the EU GDPR is the regime these considerations are written against. The UK GDPR would apply in addition if the system processes data about people in the United Kingdom.',
      }
  }

  if (establishment === 'uk') {
    return euConnection
      ? {
          regimes: ['uk_gdpr', 'eu_gdpr'],
          determined: true,
          note: 'You told us the organisation is established in the United Kingdom and that the system has a connection to the EU. The UK GDPR applies to you, and the EU GDPR applies in addition where the system is offered to, or monitors, people in the Union.',
        }
      : {
          regimes: ['uk_gdpr'],
          determined: true,
          note: 'You told us the organisation is established in the United Kingdom and that the system has no EU connection, so the UK GDPR is the regime these considerations are written against.',
        }
  }

  return {
    regimes: ['eu_gdpr', 'uk_gdpr'],
    determined: false,
    note: 'Your answers do not settle which data-protection regime applies. Both are set out below rather than one being chosen by assumption: the EU GDPR reaches organisations outside the Union that offer services to, or monitor, people in it, and the UK GDPR does the same for the United Kingdom. Which of them bites, and whether both do, depends on where the people in the data are.',
  }
}

interface Draft {
  id: string
  title: string
  kind: ComplianceFindingV2['kind']
  applicability: ComplianceFindingV2['applicability']
  why: string
  meaning: string
  action: string
  evidence?: string[]
  triggers: string[]
  missing?: string[]
  priority?: ComplianceFindingV2['priority']
  confidence?: ComplianceFindingV2['confidence']
}

function finding(draft: Draft): ComplianceFindingV2 {
  return {
    id: draft.id,
    ruleId: 'gdpr-ai-overlay',
    title: draft.title,
    kind: draft.kind,
    applicability: draft.applicability,
    // Empty, and deliberately. See the module comment: controller and processor
    // are data-protection roles, and this array holds AI Act ones.
    appliesToRoles: [],
    whyItApplies: draft.why,
    practicalMeaning: draft.meaning,
    action: draft.action,
    evidenceToKeep: draft.evidence ?? [],
    triggeringAnswerIds: draft.triggers,
    missingAnswerIds: draft.missing ?? [],
    priority: draft.priority ?? 'normal',
    confidence: draft.confidence ?? 'medium',
  }
}

/**
 * The overlay, or nothing.
 *
 * `undefined` where §11.1's trigger does not fire — a reader who told us the
 * system uses no personal data is not shown a data-protection section headed
 * with a notice about not being an audit. §4.5 again: no irrelevant material.
 */
export function evaluateGdprAiOverlay(answers: AnswerRecordV2): GdprAiOverlayResult | undefined {
  const personalData = valueOf(answers, 'personal_data_use')
  const personalDataUnknown = saidUnknown(answers, 'personal_data_use')
  if (personalData !== 'yes' && personalData !== 'possibly' && !personalDataUnknown) return undefined

  const jurisdiction = gdprJurisdiction(answers)
  const findings: ComplianceFindingV2[] = []

  // --- The baseline. Always present, and it carries the uncertainty. --------

  const settled = personalData === 'yes'
  findings.push(
    finding({
      id: 'gdpr-applies-alongside',
      title: settled
        ? 'Data protection law applies to this system as well as the AI Act'
        : 'Data protection law may apply to this system as well as the AI Act',
      kind: 'adjacent_law',
      applicability: settled ? 'applies' : 'possibly_applies',
      why: settled
        ? 'You told us the system uses personal data. The EU AI Act and data protection law are separate regimes with separate regulators, and a system can sit outside every risk category in the Act while still raising every question below.'
        : `You told us the system ${personalDataUnknown ? 'may use personal data and that you were not sure' : 'possibly uses personal data'}. That is not resolved either way here, so these considerations are set out as things to check rather than as things that apply.`,
      meaning:
        'Nothing in the AI Act result above discharges a data-protection duty, and nothing you do for data protection discharges an AI Act one. Where they overlap — records, risk assessment, human oversight, telling people what is happening — the same piece of work can often serve both, but only if someone plans it that way.',
      action:
        'Read the considerations below alongside the AI Act result, and take them to whoever owns data protection in your organisation. If that is nobody, that is the first thing to settle.',
      evidence: [
        'A short note recording that the AI Act position and the data-protection position were considered together, and by whom.',
      ],
      triggers: ['personal_data_use'],
      missing: settled ? [] : ['personal_data_use'],
      confidence: settled ? 'high' : 'low',
    })
  )

  // --- Special categories --------------------------------------------------

  /**
   * Readable phrases, not option values. The card says "you told us the system
   * handles …" and completing that sentence with `health, protected_characteristics`
   * turns a finding into a database row.
   */
  const CATEGORY_PHRASE: Record<string, string> = {
    health: 'health or medical information',
    biometric_identification: 'biometric data used to identify people',
    protected_characteristics:
      'data revealing race, ethnicity, religion, politics, trade union membership, sex life or sexual orientation',
    criminal_offence: 'criminal offences, convictions or allegations',
    children: 'data about children',
  }

  const listPhrases = (phrases: string[]): string =>
    phrases.length > 1
      ? `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`
      : (phrases[0] ?? '')

  const SENSITIVE = ['health', 'biometric_identification', 'protected_characteristics', 'criminal_offence']
  const sensitive = includesAny(answers, 'gdpr_data_categories', SENSITIVE)
  const children = valuesOf(answers, 'gdpr_data_categories').includes('children')

  if (sensitive || children) {
    findings.push(
      finding({
        id: 'gdpr-sensitive-categories',
        title: children && !sensitive
          ? 'The system handles data about children'
          : 'The system handles data in a category that carries stricter conditions',
        kind: 'adjacent_law',
        applicability: 'applies',
        why: `You told us the system handles ${listPhrases(
          valuesOf(answers, 'gdpr_data_categories')
            .map((value) => CATEGORY_PHRASE[value])
            .filter(Boolean)
        )}. Data protection law treats that differently from ordinary personal data, and the difference bites before the data is used rather than after.`,
        meaning:
          'For the sensitive categories, an ordinary lawful basis is not enough on its own — a further, narrower condition has to be met before the data may be used at all, and the analysis has to be done before the processing starts rather than after a question is raised. Data about children attracts additional expectations about how clearly things are explained and how much is collected.',
        action:
          'Confirm with whoever owns data protection that a specific condition has been identified for each of these categories, and that it was identified for *this* use of the data rather than for the original collection.',
        evidence: [
          'The written analysis identifying the condition relied on for each sensitive category.',
        ],
        triggers: ['gdpr_data_categories'],
        priority: 'high',
        confidence: 'high',
      })
    )
  } else if (saidUnknown(answers, 'gdpr_data_categories')) {
    findings.push(
      finding({
        id: 'gdpr-sensitive-categories-unknown',
        title: 'It is not established what categories of personal data the system handles',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: 'You told us you were not sure which categories of data the system handles. Several of them change what is required before the data may be used at all, so this is not a detail that can be left open.',
        meaning:
          'Health data, biometric identification, criminal-offence data and data about children each carry conditions beyond an ordinary lawful basis. Whether any of them are present is usually answerable in an afternoon by looking at what the system actually ingests, rather than at what it was designed to ingest.',
        action:
          'List the fields the system receives, including anything in free text, and check each against those categories. Free-text fields are where sensitive data arrives unplanned.',
        triggers: [],
        missing: ['gdpr_data_categories'],
        confidence: 'low',
      })
    )
  }

  // --- Lawful basis --------------------------------------------------------

  const basis = valueOf(answers, 'gdpr_lawful_basis')
  if (basis === 'not_reviewed' || saidUnknown(answers, 'gdpr_lawful_basis')) {
    findings.push(
      finding({
        id: 'gdpr-lawful-basis-unresolved',
        title: 'The reason you are allowed to use this data has not been settled for this system',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: basis === 'not_reviewed'
          ? 'You told us this has not been looked at for this system.'
          : 'You told us you were not sure whether this has been looked at for this system.',
        meaning:
          'Personal data may only be used for a reason identified in advance, and the reason has to fit the use actually being made. Where data collected for one purpose is fed into an AI system for another, the original reason does not automatically carry across — this is the most common way an otherwise careful deployment goes wrong.',
        action:
          'Before extending the system further, establish and write down why this use of the data is permitted. It is a short piece of work when done first and an expensive one when done after a complaint.',
        evidence: [
          'A record of the reason relied on, the use it covers, and the date it was decided.',
        ],
        triggers: basis === 'not_reviewed' ? ['gdpr_lawful_basis'] : [],
        missing: basis === 'not_reviewed' ? [] : ['gdpr_lawful_basis'],
        priority: 'high',
        confidence: basis === 'not_reviewed' ? 'high' : 'low',
      })
    )
  } else if (basis === 'identified_not_recorded') {
    findings.push(
      finding({
        id: 'gdpr-lawful-basis-record',
        title: 'Write down the reason you are allowed to use this data',
        kind: 'recommended_safeguard',
        applicability: 'applies',
        why: 'You told us the reason is known but not written down. That is a much better position than not knowing it, and it is not the position a regulator or a customer’s due-diligence questionnaire asks you to be in.',
        meaning:
          'An unwritten reason is one that leaves with the person who holds it, and it cannot be shown to anyone who asks. Writing it down also tends to surface the cases where the reason covers the original collection but not the new use.',
        action:
          'Record the reason, the specific use it covers, and who decided it. A paragraph is enough.',
        evidence: ['The written record, dated.'],
        triggers: ['gdpr_lawful_basis'],
        confidence: 'high',
      })
    )
  }

  // --- Data obtained from somewhere other than the person ------------------

  const indirectSources = ['from_another_organisation', 'public_or_scraped', 'purchased_dataset']
  if (includesAny(answers, 'gdpr_data_source', indirectSources)) {
    findings.push(
      finding({
        id: 'gdpr-indirect-collection',
        title: 'Some of the data did not come from the people it is about',
        kind: 'adjacent_law',
        applicability: 'applies',
        why: 'You told us the system uses personal data obtained from another organisation, from public sources, or from a purchased dataset.',
        meaning:
          'Where personal data is obtained from somewhere other than the person, there is a duty to tell them you hold it, what you are doing with it and where it came from — a duty that does not arise, in the same form, when they gave it to you themselves. Scraped and purchased datasets carry a second problem: the people in them have generally not been told anything by anyone.',
        action:
          'Establish how the people in this data are told that you hold it, and check the answer is not "they are not". Where the source is a purchased or scraped dataset, ask what the supplier told them and get the answer in writing.',
        evidence: [
          'The notice given to people whose data was obtained indirectly, and the date it was published or sent.',
          'The supplier’s written account of how the dataset was assembled.',
        ],
        triggers: ['gdpr_data_source'],
        priority: 'high',
        confidence: 'high',
      })
    )
  }

  // --- Significant automated decisions -------------------------------------

  const significant = valueOf(answers, 'gdpr_significant_effects')
  const intervention = valueOf(answers, 'gdpr_human_intervention')

  if (significant === 'yes') {
    const weak = intervention === 'nominal_review' || intervention === 'no_review'
    findings.push(
      finding({
        id: 'gdpr-automated-decisions',
        title: weak
          ? 'A decision with a significant effect is being taken without meaningful human involvement'
          : 'The system contributes to decisions with a significant effect on people',
        kind: weak ? 'unresolved_issue' : 'adjacent_law',
        applicability: 'applies',
        why: weak
          ? `You told us the output can produce a legal or similarly significant effect, and that ${
              intervention === 'no_review'
                ? 'nobody reviews it before it is acted on'
                : 'the sign-off does not in practice change the outcome'
            }.`
          : 'You told us the output can produce a legal or similarly significant effect, and that a person reviews it and can decide otherwise.',
        meaning: weak
          ? 'Decisions of this kind, taken solely by automated means, are restricted under data protection law: they are permitted only in narrow circumstances and, where permitted, carry additional safeguards including the right to obtain human intervention and to contest the outcome. A review that never changes anything does not take a decision outside that restriction — the test is whether the reviewer has the authority, the information and the time to reach a different answer.'
          : 'Meaningful human involvement is what keeps this outside the restriction on solely automated decisions. It is a claim that has to keep being true: reviews degrade quietly as volume rises, and the safeguard is only as good as the reviewer’s ability to actually disagree.',
        action: weak
          ? 'Treat this as the priority item in this section. Either establish genuine human involvement — a reviewer with authority, information and time — or establish which narrow circumstance permits the decision to be taken automatically, and put the accompanying safeguards in place.'
          : 'Record what the reviewer sees, what authority they have to depart from the output, and how often they do. The last of those is the number that tells you whether the safeguard is real.',
        evidence: [
          'A description of the decision, the reviewer’s authority, and what they are shown.',
          'A periodic count of how often the human decision differs from the system’s output.',
        ],
        triggers: ['gdpr_significant_effects', ...(intervention ? ['gdpr_human_intervention'] : [])],
        missing: unsettled(answers, ['gdpr_human_intervention']),
        priority: weak ? 'urgent' : 'high',
        confidence: intervention ? 'high' : 'low',
      })
    )
  } else if (saidUnknown(answers, 'gdpr_significant_effects')) {
    findings.push(
      finding({
        id: 'gdpr-significant-effects-unknown',
        title: 'It is not established whether the system’s output significantly affects anyone',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: 'You told us you were not sure whether the output can produce a legal or similarly significant effect for a person.',
        meaning:
          'This is the question that decides whether the strictest part of data protection law is engaged at all. It is answered by following one output through to what happens next — not by reading the system’s documentation, which describes what it produces rather than what is done with it.',
        action:
          'Take one real output and trace what changes for the person as a result. If the answer is "a job, a loan, a place, a price or a benefit", the answer to this question is yes.',
        triggers: [],
        missing: ['gdpr_significant_effects'],
        confidence: 'low',
      })
    )
  }

  // --- Impact assessment ---------------------------------------------------

  const dpia = valueOf(answers, 'gdpr_dpia_status')
  const highRiskSignals = sensitive || children || significant === 'yes'
  if (dpia === 'not_considered' || saidUnknown(answers, 'gdpr_dpia_status')) {
    findings.push(
      finding({
        id: 'gdpr-dpia',
        title: highRiskSignals
          ? 'An impact assessment has not been done, and your answers point to the kind of processing that needs one'
          : 'No impact assessment has been considered for this system',
        kind: highRiskSignals ? 'unresolved_issue' : 'recommended_safeguard',
        applicability: highRiskSignals ? 'likely_applies' : 'possibly_applies',
        why: highRiskSignals
          ? 'You told us no impact assessment has been considered, and you also told us about factors — sensitive categories, data about children, or decisions with significant effects — that are the standard indicators of processing likely to be high risk.'
          : 'You told us no impact assessment has been considered for this system. On your other answers, one may not be required — but "not required" is itself a conclusion someone should reach and record.',
        meaning:
          'Where processing is likely to result in a high risk to people, an assessment of that risk is required before the processing begins. Doing it late is not the same as doing it: the point of the assessment is to change the design while changing it is still cheap.',
        action: highRiskSignals
          ? 'Commission the assessment now, before the system is extended further. It also produces most of the material the AI Act findings above ask you to keep.'
          : 'Have someone record the short reasoning for why one is not needed. That record is the thing you will be asked for, not the assessment itself.',
        evidence: [
          'The completed assessment, or the dated note recording why one was not required.',
        ],
        triggers: dpia === 'not_considered' ? ['gdpr_dpia_status'] : [],
        missing: dpia === 'not_considered' ? [] : ['gdpr_dpia_status'],
        priority: highRiskSignals ? 'high' : 'normal',
        confidence: dpia === 'not_considered' ? 'high' : 'low',
      })
    )
  }

  // --- Controller or processor --------------------------------------------

  const controllerRole = valueOf(answers, 'gdpr_controller_role')
  if (controllerRole === 'not_established' || saidUnknown(answers, 'gdpr_controller_role')) {
    findings.push(
      finding({
        id: 'gdpr-controller-role-unresolved',
        title: 'It is not established who decides why and how this data is used',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: 'You told us the controller and processor positions have not been established for this system.',
        meaning:
          'Almost every data-protection duty attaches to the party that decides the purpose. Until that is settled, nobody can say which duties are yours, which are your supplier’s, and which are shared — and the answer is not always what the contract calls the parties.',
        action:
          'Settle it in writing, for this system specifically. The question is who decides what the data is used for, not who holds it or who pays for it.',
        evidence: ['A written statement of the position, and the contract terms that support it.'],
        triggers: controllerRole === 'not_established' ? ['gdpr_controller_role'] : [],
        missing: controllerRole === 'not_established' ? [] : ['gdpr_controller_role'],
        priority: 'high',
        confidence: controllerRole === 'not_established' ? 'high' : 'low',
      })
    )
  } else if (controllerRole === 'joint') {
    findings.push(
      finding({
        id: 'gdpr-joint-controllers',
        title: 'Decisions about this data are made jointly with another organisation',
        kind: 'adjacent_law',
        applicability: 'applies',
        why: 'You told us your organisation decides why and how the data is used jointly with another organisation.',
        meaning:
          'A joint arrangement requires the parties to agree, transparently, which of them does what — particularly who answers the people in the data when they ask. Without that, both are exposed and neither is prepared.',
        action:
          'Check that a written arrangement exists, that it names who handles requests from individuals, and that the substance of it is available to those individuals.',
        evidence: ['The joint arrangement, and the summary of it made available to individuals.'],
        triggers: ['gdpr_controller_role'],
        confidence: 'high',
      })
    )
  }

  // --- Transfers -----------------------------------------------------------

  const transfers = valueOf(answers, 'gdpr_transfers')
  if (transfers === 'yes') {
    findings.push(
      finding({
        id: 'gdpr-transfers',
        title: 'Personal data leaves the UK or the EEA',
        kind: 'adjacent_law',
        applicability: 'applies',
        why: 'You told us the personal data this system handles goes outside the UK or the European Economic Area.',
        meaning:
          'A transfer out needs its own basis — an adequacy decision covering the destination, or a safeguard the parties put in place, with an assessment of whether it actually works in that country. With a hosted AI service the transfer is usually a property of the supplier’s infrastructure rather than a decision you took, which does not make it any less yours to account for.',
        action:
          'Ask the supplier where the data is processed and stored, including for support access and for any sub-processors, and get the mechanism relied on in writing.',
        evidence: [
          'The supplier’s written statement of processing locations and sub-processors.',
          'The transfer mechanism relied on, and any assessment done for it.',
        ],
        triggers: ['gdpr_transfers'],
        priority: 'high',
        confidence: 'high',
      })
    )
  } else if (transfers === 'not_established' || saidUnknown(answers, 'gdpr_transfers')) {
    findings.push(
      finding({
        id: 'gdpr-transfers-unknown',
        title: 'It is not established whether the data leaves the UK or the EEA',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: 'You told us this has not been established. With a hosted AI service it usually has an answer — it is simply one nobody has asked the supplier for.',
        meaning:
          'Where data goes is not a detail of the deployment; it decides whether a further requirement applies at all. It is also one of the few questions in this section a supplier can answer in a single email.',
        action:
          'Ask the supplier, in writing, where data is processed and stored — including where support staff access it from, and where each sub-processor sits.',
        evidence: ['The supplier’s written answer.'],
        triggers: transfers === 'not_established' ? ['gdpr_transfers'] : [],
        missing: transfers === 'not_established' ? [] : ['gdpr_transfers'],
        confidence: 'low',
      })
    )
  }

  // --- What the supplier may do with the inputs ----------------------------

  const supplierUse = valueOf(answers, 'gdpr_supplier_data_use')
  if (supplierUse === 'training_permitted' || supplierUse === 'retention_only') {
    const training = supplierUse === 'training_permitted'
    findings.push(
      finding({
        id: 'gdpr-supplier-data-use',
        title: training
          ? 'Your supplier may use what you put into the system to improve their models'
          : 'Your supplier retains what you put into the system',
        kind: training ? 'unresolved_issue' : 'recommended_safeguard',
        applicability: 'applies',
        why: training
          ? 'You told us the terms permit inputs to be used to improve the supplier’s models. Where those inputs contain personal data, that is a further use of it, by another party, for their own purpose.'
          : 'You told us inputs are retained but not used for training. Retention is the lesser of the two, and it still means the data sits somewhere for as long as the supplier keeps it.',
        meaning: training
          ? 'Once personal data has contributed to a trained model, deleting the original record does not necessarily remove its effect — which makes this hard to reverse and hard to answer for when someone asks you to erase their data. It also usually needs its own reason, separate from the reason you had for using the system at all.'
          : 'Retention periods you did not set are still retention periods you have to be able to explain, and they are the part of a supplier’s terms that most often has no number in it at all.',
        action: training
          ? 'Establish whether the training use can be switched off, and switch it off unless there is a recorded reason not to. Where it cannot, establish what reason permits it before more data goes in.'
          : 'Get the retention period in writing, and check it against how long you actually need the data.',
        evidence: [
          'The contract term or setting that governs retention and training use, and the date it was checked.',
        ],
        triggers: ['gdpr_supplier_data_use'],
        priority: training ? 'high' : 'normal',
        confidence: 'high',
      })
    )
  } else if (saidUnknown(answers, 'gdpr_supplier_data_use')) {
    findings.push(
      finding({
        id: 'gdpr-supplier-data-use-unknown',
        title: 'It is not established what your supplier may do with what you put into the system',
        kind: 'unresolved_issue',
        applicability: 'cannot_determine',
        why: 'You told us you were not sure what the terms permit. This is the term most often left unread when a tool is adopted, and the one hardest to undo afterwards.',
        meaning:
          'Whether inputs are retained, and whether they may be used to improve the supplier’s models, changes what you can honestly tell the people in the data and what you can do when one of them asks you to delete it.',
        action:
          'Read the data-processing terms for the specific plan you are on — the answer often differs between free, professional and enterprise tiers of the same product.',
        evidence: ['The relevant terms, and the date and plan they were read against.'],
        triggers: [],
        missing: ['gdpr_supplier_data_use'],
        confidence: 'low',
      })
    )
  }

  // --- Answering the people in the data ------------------------------------

  const requests = valueOf(answers, 'gdpr_subject_requests')
  if (requests === 'no_route' || requests === 'with_effort' || saidUnknown(answers, 'gdpr_subject_requests')) {
    const none = requests === 'no_route'
    findings.push(
      finding({
        id: 'gdpr-subject-requests',
        title: none
          ? 'You would not be able to find what the system holds about a person'
          : 'Finding what the system holds about a person would take manual work',
        kind: none ? 'unresolved_issue' : 'recommended_safeguard',
        applicability: none ? 'applies' : 'possibly_applies',
        why: none
          ? 'You told us there is no route for finding, correcting or deleting what the system holds about an individual.'
          : requests === 'with_effort'
            ? 'You told us it could be done, but that it would take manual work.'
            : 'You told us you were not sure whether it could be done.',
        meaning:
          'People can ask what you hold about them, and the answer has to arrive within a fixed period. AI systems are unusually good at holding data in places nobody thinks to look — inference caches, prompt logs, evaluation sets, vector stores — and a request arrives with a clock already running.',
        action:
          'Before a request arrives, write down every place this system puts data about a person, and how each one would be searched and cleared. Doing it once, calmly, is the whole of the work.',
        evidence: [
          'A list of every store the system writes personal data to, and the route to search and clear each one.',
        ],
        triggers: requests ? ['gdpr_subject_requests'] : [],
        missing: requests ? [] : ['gdpr_subject_requests'],
        priority: none ? 'high' : 'normal',
        confidence: requests ? 'high' : 'low',
      })
    )
  }

  const references = [
    ...(jurisdiction.regimes.includes('eu_gdpr') ? [EU_GDPR_REFERENCE, EDPB_GUIDANCE] : []),
    ...(jurisdiction.regimes.includes('uk_gdpr') ? [UK_GDPR_REFERENCE, ICO_AI_GUIDANCE] : []),
  ]

  return {
    regimes: jurisdiction.regimes,
    jurisdictionNote: jurisdiction.note,
    findings,
    references,
    notice: GDPR_NOTICE,
  }
}
