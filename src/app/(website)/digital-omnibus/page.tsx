import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { AI_ACT_TIMELINE } from '@/lib/ai-act-timeline'
import { DIGITAL_OMNIBUS_REVIEWED, OMNIBUS_SOURCES, OMNIBUS_HISTORY, OMNIBUS_APPLICATIONS } from '@/lib/digital-omnibus'
import { absoluteUrl } from '@/lib/site'

const title = 'Digital Omnibus: What Changes and What Matters'
const description = 'A practical guide to the EU Digital Omnibus for UK and EU business leaders and US companies operating in Europe: AI Act dates, proposed data and privacy changes, and the decisions they inform.'

export const metadata: Metadata = {
  title: `${title} | Silicon and Stone`,
  description,
  alternates: { canonical: '/digital-omnibus' },
  openGraph: { title, description, type: 'website', url: '/digital-omnibus' },
  twitter: { card: 'summary_large_image', title, description },
}

function Source({ id, children }: { id: keyof typeof OMNIBUS_SOURCES; children?: React.ReactNode }) {
  const source = OMNIBUS_SOURCES[id]
  return <a href={source.url} className="text-stone-teal underline underline-offset-4">{children || source.title}</a>
}

const sections = [
  ['position', 'Where things stand'], ['timeline', 'Timeline and milestones'],
  ['changes', 'What changes'], ['business', 'What it means for your business'],
  ['advisory', 'How we apply it'], ['sources', 'Sources and updates'],
] as const

// Application dates stay in the same rule pack as the Compliance Checker.
// Historical 2025 entries and legacy-system transitions belong in the detail,
// not in this overview of the main 2026–28 milestones.
const milestones = AI_ACT_TIMELINE.filter(entry => /202[678]$/.test(entry.date))

export default function DigitalOmnibusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: absoluteUrl('/digital-omnibus'), dateModified: DIGITAL_OMNIBUS_REVIEWED, author: { '@type': 'Person', name: 'Clive Struver', url: absoluteUrl('/authors/clive-struver') }, citation: Object.values(OMNIBUS_SOURCES).map(source => source.url) }} />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
            <p className="mb-5 text-sm text-stone-teal">A reference for business leaders</p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">Digital Omnibus</h1>
            <p className="mt-4 text-2xl font-medium text-text-primary sm:text-3xl">What changes and what matters.</p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-muted">Europe is revising its digital rulebook. Some AI rules have changed; wider changes to data, privacy and cybersecurity are still being negotiated. Understanding the distinction helps you decide what to act on, what to prepare for and what to watch.</p>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-muted">For leaders across the UK and EU, and US companies operating in or selling into Europe. This reference provides the shared regulatory context for our advisory work.</p>
            <p className="mt-8 text-sm text-text-muted">Reviewed <time dateTime={DIGITAL_OMNIBUS_REVIEWED}>9 September 2026</time> · Clive Struver, Silicon and Stone</p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:px-8">
          <nav aria-label="On this page" className="border-b border-border-subtle py-6 lg:self-start lg:sticky lg:top-24 lg:border-b-0 lg:py-12">
            <p className="mb-4 font-semibold text-text-primary">On this page</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm lg:flex-col">
              {sections.map(([id, label]) => <li key={id}><a href={`#${id}`} className="text-text-muted hover:text-stone-teal underline-offset-4 hover:underline">{label}</a></li>)}
            </ul>
          </nav>

          <div className="min-w-0 pb-16 [&>section]:scroll-mt-28 [&>section]:border-b [&>section]:border-border-subtle [&>section]:py-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:font-semibold [&_h3]:text-text-primary">
            <section id="position">
              <h2>One name. Two legislative tracks.</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">An omnibus amends several existing rules together. The Digital Omnibus is part of the EU’s effort to reduce administrative complexity and improve competitiveness. Its two tracks are moving at different speeds. <Source id="overview">Read the Commission’s overview.</Source></p>
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div className="border-t-4 border-stone-teal pt-5">
                  <p className="mb-3 text-sm font-medium text-stone-teal">Enacted</p>
                  <h3 className="text-xl">Digital Omnibus on AI</h3>
                  <p className="mt-3 leading-relaxed text-text-muted">Regulation (EU) 2026/1744 entered into force on 27 July 2026. It amends the AI Act, including the timetable for high-risk systems. Entry into force and the date a particular duty applies are different milestones.</p>
                  <p className="mt-4 text-sm"><Source id="enacted">AI changes now in law</Source></p>
                </div>
                <div className="border-t-4 border-silicon-amber pt-5">
                  <p className="mb-3 text-sm font-medium text-silicon-amber-strong">Under negotiation at this review</p>
                  <h3 className="text-xl">Data, privacy and cybersecurity</h3>
                  <p className="mt-3 leading-relaxed text-text-muted">The broader proposal includes changes to GDPR, the Data Act and incident reporting. Parliament’s procedure is awaiting a committee decision. Proposed simplifications should not be treated as permissions already available.</p>
                  <p className="mt-4 text-sm"><Source id="proposal">Follow the legislative procedure</Source></p>
                </div>
              </div>
            </section>

            <section id="timeline">
              <h2>Timeline and milestones</h2>
              <p className="mt-4 leading-relaxed text-text-muted">First, how the AI changes became law. Then, the main application dates to read against your systems and your role.</p>
              <details className="mt-6 rounded-lg border border-border-subtle p-5">
                <summary className="cursor-pointer font-medium text-text-primary">How we got here: November 2025 to July 2026</summary>
                <ol className="mt-5 space-y-5">
                  {OMNIBUS_HISTORY.map(event => <li key={event.date}>
                    <p className="text-sm text-stone-teal">{event.date}</p><h3 className="mt-1">{event.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{event.detail} <Source id={event.source}>Source</Source></p>
                  </li>)}
                </ol>
              </details>
              <ol className="mt-10 ml-2 border-l-2 border-stone-teal/40">
                {milestones.map(event => <li key={event.basis} className="relative pb-9 pl-7 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-stone-teal" />
                  <p className="text-lg font-semibold text-stone-teal">{event.date}</p>
                  <h3 className="mt-1 text-lg">{event.label}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">{event.detail}</p>
                  <p className="mt-2 text-xs text-text-muted">{event.basis} · <Source id="timeline">Official timeline</Source></p>
                </li>)}
              </ol>
              <p className="mt-8 max-w-3xl text-sm leading-relaxed text-text-muted">These are the main milestones, not a universal deadline for every AI system. Classification, operator role and transitional provisions matter. The December 2026 marking transition concerns certain systems placed on the market before 2 August 2026. <Source id="legislation">Read the amending regulation.</Source></p>
              <div className="mt-8 border-l-2 border-silicon-amber pl-5">
                <h3>The wider proposal: milestones still to come</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">Watch for Parliament’s position, the Council position, agreement on a final text, formal adoption and publication. There is no confirmed application date recorded here for the broader package. <Source id="proposal">Check its current status.</Source></p>
              </div>
            </section>

            <section id="changes">
              <h2>More than a change of dates</h2>
              <div className="mt-6 space-y-7 text-text-muted">
                <div><h3>AI: implementation and oversight</h3><p className="mt-2 leading-relaxed">Alongside the high-risk timetable, the enacted changes address support for small mid-cap companies, testing and sandboxes, AI literacy, registration and AI Office supervision. A revised date is only one part of the assessment. <Source id="enacted">Commission summary of the enacted changes.</Source></p></div>
                <div><h3>Data and privacy: proposed simplification</h3><p className="mt-2 leading-relaxed">The broader proposal would consolidate parts of the data framework into the Data Act, adjust aspects of cloud switching, and change elements of GDPR and cookie rules. These could affect data use, supplier contracts and portability; their final form remains unsettled. <Source id="package">What the Commission proposes.</Source></p></div>
                <div><h3>Cybersecurity: a proposed reporting entry point</h3><p className="mt-2 leading-relaxed">A single entry point is proposed for overlapping incident reports under several EU laws. A simpler submission route would not itself remove the underlying reporting obligations. <Source id="package">Incident-reporting proposal.</Source></p></div>
                <div><h3>Where the debate matters</h3><p className="mt-2 leading-relaxed">The European data protection authorities support some simplifications but object to the proposed narrowing of the definition of personal data. Treat disputed provisions as something to monitor, rather than an assumption on which to redesign your data practices. <Source id="privacy">EDPB and EDPS assessment.</Source></p></div>
              </div>
            </section>

            <section id="business">
              <h2>Read the rules against the business</h2>
              <p className="mt-4 leading-relaxed text-text-muted">A UK or US headquarters does not by itself settle EU exposure. Relevant connections include placing AI systems or models on the EU market, and certain uses of AI output in the EU. Establish your role and the scope before choosing a deadline. <Source id="scope">AI Act scope.</Source></p>
              <p className="mt-4 leading-relaxed text-text-muted">EU changes also need to be distinguished from the domestic requirements of the UK or US. The Omnibus does not replace that separate assessment.</p>
              <p className="mt-7 text-sm font-medium text-stone-teal">Our practical interpretation</p>
              <dl className="mt-4 space-y-6">
                <div><dt className="font-semibold text-text-primary">You use AI across your organisation</dt><dd className="mt-2 leading-relaxed text-text-muted">Start with a systems inventory, the purpose of each use and the evidence your vendors supply. Work out which transparency or high-risk questions actually arise.</dd></div>
                <div><dt className="font-semibold text-text-primary">You supply software to European customers</dt><dd className="mt-2 leading-relaxed text-text-muted">Distinguish your legal duties from the evidence a buyer needs to approve a purchase. A later application date may not change a customer’s current procurement requirements.</dd></div>
                <div><dt className="font-semibold text-text-primary">You are choosing an architecture or cloud provider</dt><dd className="mt-2 leading-relaxed text-text-muted">Map data flows, administrative access, key custody and exit options. Keep legal requirements, contractual commitments and strategic sovereignty preferences distinct; assess any wider sovereignty measures on their own basis.</dd></div>
              </dl>
              <p className="mt-7 text-sm"><Link href="/tools/compliance-checker" className="text-stone-teal underline underline-offset-4">Use the Compliance Checker to explore your AI Act position</Link></p>
            </section>

            <section id="advisory">
              <h2>How this informs our advisory work</h2>
              <p className="mt-4 leading-relaxed text-text-muted">This reference is available to everyone. In an engagement, we apply the relevant parts to your systems, evidence and decisions, within the scope we agree with you.</p>
              <div className="mt-7 divide-y divide-border-subtle">
                {OMNIBUS_APPLICATIONS.map(offer => <div key={offer.name} className="py-6 first:pt-0">
                  <p className="text-sm text-text-muted">{offer.question}</p>
                  <h3 className="mt-2 text-lg"><Link href={offer.href} className="text-stone-teal underline underline-offset-4">{offer.name}</Link></h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">{offer.detail}</p>
                </div>)}
              </div>
            </section>

            <section id="sources" className="!border-b-0">
              <h2>Sources and updates</h2>
              <p className="mt-4 leading-relaxed text-text-muted">The status above was reviewed on 9 September 2026. Source links let you check subsequent developments. The business examples are Silicon and Stone’s interpretation; the legislation and official procedures establish the legal position.</p>
              <ul className="mt-6 space-y-3 text-sm leading-relaxed">
                {Object.entries(OMNIBUS_SOURCES).map(([id, source]) => <li key={id}><a href={source.url} className="text-stone-teal underline underline-offset-4">{source.title}</a></li>)}
              </ul>
              <div className="mt-8 rounded-lg bg-stone-charcoal p-5">
                <h3>Review history</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted"><time dateTime={DIGITAL_OMNIBUS_REVIEWED}>9 September 2026</time> — Established the shared reference, separated enacted AI changes from the broader proposal, and checked the main application milestones against Commission guidance.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
