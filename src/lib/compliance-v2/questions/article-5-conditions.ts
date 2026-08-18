import type { AssessmentQuestionV2, ConditionExpression } from '../types'

/**
 * The per-practice condition trees §7.6 asks for.
 *
 * Until 2026-08-19 this file did not exist, and every positive Article 5 screen
 * held at `potentially_prohibited` with a single generic "needs legal review"
 * note. That was the safe direction, and it was also wrong in a way worth
 * naming: a user who ticked "infers emotions" and whose use is a medical one —
 * an exception Article 5(1)(f) states in its own words — got the gravest result
 * this tool can produce, permanently, with no way to clear it.
 *
 * **Every question below is a limb of a statutory definition, or an exception
 * the provision itself states.** Nothing here is an inference about what a
 * prohibition "really means". Where the Regulation says "significant harm", the
 * question asks about significant harm; where it excepts labelling of lawfully
 * acquired biometric datasets, that is the exception offered. The prose of each
 * `whyAsked` says which limb it is, because a user answering these deserves to
 * know that the answer is doing legal work.
 *
 * **They are cumulative, and that is the point.** Article 5's prohibitions are
 * conjunctions: (a) needs a technique *and* material distortion *and* an
 * impaired informed decision *and* significant harm. A "no" to any one of them
 * takes the practice out. Most real systems that trip the screen fail at least
 * one limb, and saying so is more useful than an alarm nobody can clear.
 *
 * **What the trees still do not do** is conclude "prohibited". §6.3's
 * classification enum has no such value, and this is not the tool to invent one:
 * every answer here is a self-reported judgement about the user's own system,
 * and the legal content is `internal` review status. A complete path raises the
 * finding's confidence and says every limb is met — and still says
 * "potentially". See `engine/article-5.ts`.
 */

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const SECTION = 'Prohibited practices'

/** Visible when the screen selected any of these points. */
const screened = (...points: string[]): ConditionExpression => ({
  questionId: 'prohibited_screen',
  includesAny: points.map((point) => `art5_${point}`),
})

export const ARTICLE_5_CONDITION_QUESTIONS: AssessmentQuestionV2[] = [
  // --- (a) and (b): manipulation and exploitation -------------------------
  //
  // Two practices, three shared questions and one that is not. Article 5(1)(a)
  // and (b) share the words "materially distorting the behaviour" and "causes or
  // is reasonably likely to cause … significant harm" verbatim, so asking twice
  // would be asking the same question twice. (a) carries one extra limb — the
  // appreciable impairment of an informed decision — and that one is asked only
  // where (a) is in play.
  {
    id: 'art5_a_technique',
    section: SECTION,
    prompt: 'Which of these describes how the system influences people?',
    shortPrompt: 'Technique used',
    help:
      'Choose every one that applies. "Deceptive" means the person is given a false impression; persuasion that is open about what it is doing is not deception.',
    whyAsked:
      'Article 5(1)(a) opens with the technique: subliminal techniques beyond a person’s consciousness, purposefully manipulative techniques, or deceptive techniques. If none of those describes the system, the prohibition does not begin.',
    examples: [
      'A checkout flow that hides the cost until the last screen is arguably deceptive.',
      'A recommendation engine that surfaces what you are likely to want is neither.',
    ],
    answerType: 'multi',
    options: [
      { value: 'subliminal', label: 'Subliminal techniques, beyond a person’s consciousness' },
      { value: 'purposefully_manipulative', label: 'Purposefully manipulative techniques' },
      { value: 'deceptive', label: 'Deceptive techniques' },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('a'),
  },
  {
    id: 'art5_a_informed_decision',
    section: SECTION,
    prompt:
      'Does it appreciably impair a person’s ability to make an informed decision, so that they take a decision they would not otherwise have taken?',
    shortPrompt: 'Impaired decision',
    help:
      'Both halves: the ability to decide is appreciably impaired, *and* the person ends up taking a different decision as a result.',
    whyAsked:
      'This is the middle limb of Article 5(1)(a), and it is what separates a prohibited technique from ordinary marketing. Influence that leaves someone able to decide for themselves does not meet it.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('a'),
  },
  {
    id: 'art5_b_vulnerability',
    section: SECTION,
    prompt: 'Does the system exploit any of these vulnerabilities?',
    shortPrompt: 'Vulnerability exploited',
    help:
      '"Exploits" is stronger than "affects". The question is whether the vulnerability is what the system works through.',
    whyAsked:
      'Article 5(1)(b) names three vulnerabilities and no others: age, disability, and a specific social or economic situation. If the system does not exploit one of them, this prohibition does not begin.',
    answerType: 'multi',
    options: [
      { value: 'age', label: 'Age — children, or older people' },
      { value: 'disability', label: 'Disability' },
      {
        value: 'social_economic',
        label: 'A specific social or economic situation',
        help: 'Poverty, debt, insecure housing, insecure immigration status and similar.',
      },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('b'),
  },
  {
    id: 'art5_ab_material_distortion',
    section: SECTION,
    prompt: 'Is materially distorting someone’s behaviour either the objective of the system, or its effect?',
    shortPrompt: 'Behaviour distorted',
    help:
      'Either one is enough — the Regulation says "with the objective, or the effect". You do not have to have intended it.',
    whyAsked:
      'Both Article 5(1)(a) and Article 5(1)(b) turn on material distortion of behaviour, in the same words. It is asked once because answering it twice would be answering the same question twice.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('a', 'b'),
  },
  {
    id: 'art5_ab_significant_harm',
    section: SECTION,
    prompt: 'Does that cause, or is it reasonably likely to cause, significant harm to someone?',
    shortPrompt: 'Significant harm',
    help:
      'To the person affected, to another person, or to a group. "Reasonably likely" does not require it to have happened yet.',
    whyAsked:
      'This is the final limb of both Article 5(1)(a) and (b), and it is the one that most often fails. A system that nudges people towards a worse deal is not, without more, causing significant harm — and the prohibition requires it.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('a', 'b'),
  },

  // --- (ba) and (bb): the two future-dated prohibitions --------------------
  //
  // Article 5(1a) is a gate in front of both of them, and it is asked once. It
  // splits by role in the statute itself: for placing on the market or putting
  // into service, the test is intended purpose *or* foreseeable-and-reproducible
  // output without adequate safeguards; for *use*, it is simply whether the
  // deployer uses the system for that purpose.
  {
    id: 'art5_babb_intended_purpose',
    section: SECTION,
    prompt: 'Is generating or manipulating that material the intended purpose of the system?',
    shortPrompt: 'Intended purpose',
    help: 'What the system is for, as you describe it and market it — not what someone could misuse it to do.',
    whyAsked:
      'Article 5(1a)(a)(i) makes intended purpose the first route into these two prohibitions. A "no" here does not clear them — the next question asks the second route — but it decides which route is being tested.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('ba', 'bb'),
  },
  {
    id: 'art5_babb_foreseeable_output',
    section: SECTION,
    prompt:
      'Do the system’s design, training, architecture, capabilities or user-facing features make that output a reasonably foreseeable and reproducible result, without significant technical modification?',
    shortPrompt: 'Foreseeable output',
    help:
      'The question is about what the system will do as built and shipped, not about what a determined attacker could make it do after rebuilding it.',
    whyAsked:
      'Article 5(1a)(a)(ii) is the second route in, and it is the one that reaches general-purpose systems. It is paired with the safeguards question that follows: foreseeable output *and* the absence of reasonable and adequate technical safety measures are both needed.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      all: [screened('ba', 'bb'), { questionId: 'art5_babb_intended_purpose', equals: 'no' }],
    },
  },
  {
    /**
     * Moved here from `prohibited.ts` on 2026-08-19. It is the second half of
     * Article 5(1a)(a)(ii) and is meaningless on its own, so it now sits behind
     * the question it qualifies and is asked only where that route is live —
     * which a catalogue ordered by dependency can express and a flat list of
     * screen questions could not.
     */
    id: 'technical_safety_measures',
    section: SECTION,
    prompt:
      'Does the system have reasonable and adequate technical safety measures and other safeguards to reliably prevent that output, and to correct misuse that is observed or reported?',
    shortPrompt: 'Safety measures',
    help:
      'Both halves matter — preventing it, and correcting it when it happens anyway — and both have to work against misuse that is reasonably foreseeable rather than only against the obvious case.',
    whyAsked:
      'Article 5(1a)(a)(ii) makes this the difference between a general-purpose system that falls inside these prohibitions and one that does not. Foreseeable, reproducible output *and* the absence of adequate safeguards are needed together; safeguards that work take the system out.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: { questionId: 'art5_babb_foreseeable_output', equals: 'yes' },
  },
  {
    id: 'art5_babb_deployer_use',
    section: SECTION,
    prompt: 'Does your organisation use the system for the purpose of generating or manipulating that material?',
    shortPrompt: 'Use for that purpose',
    help: 'This asks about your own use, not about what the system is capable of.',
    whyAsked:
      'Article 5(1a)(b) narrows these prohibitions sharply for anyone who only deploys: use is prohibited only where the deployer uses the system for that purpose. Supplying a general tool that could do it is a different question, answered above.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('ba', 'bb'),
  },
  {
    id: 'art5_ba_consent',
    section: SECTION,
    prompt:
      'Does the depicted person give freely-given, specific, informed, unambiguous and explicit consent to that generation or manipulation?',
    shortPrompt: 'Explicit consent',
    help:
      'All five qualities, for this generation or manipulation specifically. A general terms-of-service acceptance is not this.',
    whyAsked:
      'Article 5(1)(ba) is defined around the absence of that consent. Where it is genuinely present, the practice as the Regulation defines it is not made out.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('ba'),
  },
  {
    id: 'art5_ba_manipulation_scope',
    section: SECTION,
    prompt: 'Which of these describes what the system does to the material?',
    shortPrompt: 'Manipulation scope',
    help:
      'The middle option is narrow: edits that change nothing about what is exposed or what is depicted — cropping, colour, resolution, background.',
    whyAsked:
      'Article 5(1b) states this as a definition rather than an exception: manipulation that does not increase the exposure of any depicted intimate parts, or alter the nature of any depicted sexually explicit activity, is not "manipulation" for the purposes of Article 5(1)(ba). It clears a manipulation route; it does not clear generation, which is why the third option is here.',
    answerType: 'single',
    options: [
      {
        value: 'increases_or_alters',
        label: 'It manipulates material in a way that increases exposure of intimate parts, or alters the nature of a depicted sexual activity',
      },
      {
        value: 'neither',
        label: 'It manipulates material, but does neither of those things',
      },
      {
        value: 'generates_new',
        label: 'It generates such material rather than manipulating material that already exists',
      },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('ba'),
  },
  {
    id: 'art5_bb_without_right',
    section: SECTION,
    prompt: 'Does a "without right" defence under national law apply to this use?',
    shortPrompt: 'Without right defence',
    help:
      'These are narrow and specific — typically law enforcement, forensic, judicial or authorised research contexts, established by the national law that applies to you. If you are not operating under one, choose "No".',
    whyAsked:
      'Article 5(1)(bb) carries an express carve-out for cases where a "without right" defence applies under national law. It is the only exception the provision states, and it is a matter of national law rather than of the Regulation.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('bb'),
  },

  // --- (c) social scoring --------------------------------------------------
  {
    id: 'art5_c_evaluation',
    section: SECTION,
    prompt:
      'Does the system evaluate or classify people over a period of time, based on their social behaviour or their personal or personality characteristics?',
    shortPrompt: 'Social evaluation',
    help:
      '"Over a period of time" matters — a single transaction check is not this. The characteristics may be known, inferred or predicted.',
    whyAsked:
      'Article 5(1)(c) begins here. A credit decision made on financial history is not automatically a social score; the provision is about evaluating the person against their social behaviour or character over time.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('c'),
  },
  {
    id: 'art5_c_detriment',
    section: SECTION,
    prompt: 'Does the resulting score lead to either of these?',
    shortPrompt: 'Detrimental treatment',
    help: 'Choose every one that applies.',
    whyAsked:
      'Article 5(1)(c) is only complete where the score leads to detrimental treatment of one of two specific kinds. A score that leads to nothing detrimental does not reach it, however uncomfortable it is.',
    answerType: 'multi',
    options: [
      {
        value: 'unrelated_context',
        label: 'Detrimental treatment in a context unrelated to where the data came from',
      },
      {
        value: 'disproportionate',
        label: 'Detrimental treatment that is unjustified or disproportionate to the behaviour or its gravity',
      },
      { value: 'none_of_these', label: 'Neither of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('c'),
  },

  // --- (d) predicting criminal offences ------------------------------------
  {
    id: 'art5_d_solely_profiling',
    section: SECTION,
    prompt:
      'Is the risk assessment based solely on profiling the person, or on assessing their personality traits and characteristics?',
    shortPrompt: 'Solely profiling',
    help: '"Solely" is the word doing the work. If objective facts about conduct also drive it, the answer is no.',
    whyAsked:
      'Article 5(1)(d) prohibits predicting the risk of a person committing a criminal offence where that prediction rests *solely* on profiling or personality assessment. Anything else falls outside its terms.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('d'),
  },
  {
    id: 'art5_d_supports_human_assessment',
    section: SECTION,
    prompt:
      'Does the system support a human assessment of a person’s involvement in a criminal activity that is already based on objective and verifiable facts directly linked to that activity?',
    shortPrompt: 'Supports human assessment',
    help:
      'Two things have to be true: a person is making the assessment, and it already rests on objective, verifiable facts tied to the activity.',
    whyAsked:
      'Article 5(1)(d) states this exception in its own words. It is the difference between a tool that helps an investigator weigh evidence and one that predicts who will offend.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('d'),
  },

  // --- (e) untargeted scraping of facial images ----------------------------
  {
    id: 'art5_e_database',
    section: SECTION,
    prompt: 'Does the system create or expand a facial recognition database?',
    shortPrompt: 'Facial database',
    help: 'A store of facial images or facial templates used to recognise people.',
    whyAsked:
      'Article 5(1)(e) is about building the database, not about recognising faces as such. A system that matches against a database somebody else lawfully built is a different question.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('e'),
  },
  {
    id: 'art5_e_untargeted',
    section: SECTION,
    prompt: 'Are the images collected by untargeted scraping from the internet or from CCTV footage?',
    shortPrompt: 'Untargeted scraping',
    help:
      '"Untargeted" means taking whatever is there rather than seeking a specific person. Images collected from your own enrolled users are not this.',
    whyAsked:
      'Article 5(1)(e) names two sources and one method: untargeted scraping, from the internet or CCTV. Images obtained another way — enrolment, consent, a targeted lawful request — fall outside its terms.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('e'),
  },

  // --- (f) emotion inference in workplace and education --------------------
  {
    id: 'art5_f_context',
    section: SECTION,
    prompt: 'Where is the emotion inference used?',
    shortPrompt: 'Where used',
    help: 'Choose every one that applies. The workplace includes recruitment and remote working.',
    whyAsked:
      'Article 5(1)(f) is confined to two settings: the workplace and education institutions. Inferring emotions anywhere else is not within this prohibition, though it may be a high-risk use under Annex III.',
    answerType: 'multi',
    options: [
      { value: 'workplace', label: 'In the workplace' },
      { value: 'education', label: 'In an education institution' },
      { value: 'none_of_these', label: 'Neither — somewhere else entirely' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('f'),
  },
  {
    id: 'art5_f_medical_safety',
    section: SECTION,
    prompt: 'Is the system intended to be put in place, or placed on the market, for medical or safety reasons?',
    shortPrompt: 'Medical or safety',
    help:
      'Detecting fatigue in a driver is a safety reason. Measuring how engaged staff seem in meetings is not, however it is described internally.',
    whyAsked:
      'Article 5(1)(f) states this exception in its own words, and it is the one most often available in practice. It turns on what the system is intended for, not on what it happens to be used for on a given day.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('f'),
  },

  // --- (g) biometric categorisation ----------------------------------------
  {
    id: 'art5_g_characteristics',
    section: SECTION,
    prompt: 'Which of these does the system deduce or infer about a person from their biometric data?',
    shortPrompt: 'Characteristics inferred',
    help: 'Choose every one that applies. This is about what is inferred, not what is recorded.',
    whyAsked:
      'Article 5(1)(g) lists the characteristics exhaustively. Categorising people by biometric data for anything outside that list — age band, for instance — is not within this prohibition.',
    answerType: 'multi',
    options: [
      { value: 'race', label: 'Race' },
      { value: 'political_opinions', label: 'Political opinions' },
      { value: 'trade_union', label: 'Trade union membership' },
      { value: 'religious_beliefs', label: 'Religious or philosophical beliefs' },
      { value: 'sex_life', label: 'Sex life or sexual orientation' },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('g'),
  },
  {
    id: 'art5_g_carveout',
    section: SECTION,
    prompt:
      'Is this the labelling or filtering of a lawfully acquired biometric dataset, or categorisation of biometric data in the area of law enforcement?',
    shortPrompt: 'Labelling carve-out',
    help: 'Both halves are narrow. "Lawfully acquired" is a claim you would have to be able to evidence.',
    whyAsked:
      'Article 5(1)(g) says in terms that the prohibition does not cover either of these. It is a carve-out from the definition rather than a defence, which is why it is asked here rather than left to advice.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('g'),
  },

  // --- (h) real-time remote biometric identification -----------------------
  {
    id: 'art5_h_realtime_public',
    section: SECTION,
    prompt: 'Is this "real-time" remote biometric identification in a publicly accessible space, for law enforcement?',
    shortPrompt: 'Real-time RBI',
    help:
      'All three parts. "Real-time" means identification as it happens rather than against recordings later; a publicly accessible space is one the public can enter, whether or not it is privately owned.',
    whyAsked:
      'Article 5(1)(h) applies only where all three are true. Post-hoc identification against stored footage, or identification outside law enforcement, is governed elsewhere in the Regulation rather than prohibited here.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('h'),
  },
  {
    id: 'art5_h_objective',
    section: SECTION,
    prompt: 'Is the use strictly necessary for one of these objectives?',
    shortPrompt: 'Permitted objective',
    help: 'Choose every one that applies. "Strictly necessary" is part of the test, not a description of how important it feels.',
    whyAsked:
      'Article 5(1)(h) lists three objectives and no others. Falling within one does not by itself make the use lawful — the authorisation and safeguards in Article 5(2) and 5(3) also have to be met — but falling outside all three ends the question.',
    answerType: 'multi',
    options: [
      {
        value: 'victims_or_missing',
        label: 'Targeted search for specific victims of abduction, trafficking or sexual exploitation, or for missing persons',
      },
      {
        value: 'imminent_threat',
        label: 'Preventing a specific, substantial and imminent threat to life or physical safety, or a genuine and present or foreseeable terrorist attack',
      },
      {
        value: 'serious_offence',
        label: 'Locating or identifying a suspect for an Annex II offence punishable by at least four years’ custody',
      },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('h'),
  },
  {
    id: 'art5_h_safeguards',
    section: SECTION,
    prompt: 'Which of these are in place for this use?',
    shortPrompt: 'RBI safeguards',
    help:
      'Choose every one that applies. In a duly justified urgent case, authorisation may be requested within 24 hours and registration completed without undue delay — if that is your position, choose the ones you have.',
    whyAsked:
      'Article 5(3) requires prior authorisation by a judicial or independent administrative authority, and Article 5(2) requires a completed fundamental rights impact assessment and registration in the EU database. They are cumulative, and each is a document somebody either has or does not.',
    answerType: 'multi',
    options: [
      {
        value: 'prior_authorisation',
        label: 'Prior authorisation from a judicial or independent administrative authority',
      },
      { value: 'fundamental_rights_assessment', label: 'A completed fundamental rights impact assessment' },
      { value: 'eu_database_registration', label: 'Registration of the system in the EU database' },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: screened('h'),
  },
]
