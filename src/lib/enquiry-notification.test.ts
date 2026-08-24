import { describe, it, expect } from 'vitest'
import {
  buildEnquiryNotification,
  singleLine,
  type Enquiry,
} from './enquiry-notification'

const base: Enquiry = {
  name: 'Jordan Blake',
  email: 'jordan@example-corp.com',
  company: 'Example Corp',
  interest: 'Exposure Diagnostic',
  message: 'We deploy an Annex III system and need to know where we stand.',
}

describe('singleLine', () => {
  it('strips newlines, which is the point of it', () => {
    expect(singleLine('Example\nCorp')).toBe('Example Corp')
    expect(singleLine('Example\r\nCorp')).toBe('Example Corp')
  })

  it('collapses runs of whitespace and trims', () => {
    expect(singleLine('  Example    Corp  ')).toBe('Example Corp')
  })

  it('caps length', () => {
    expect(singleLine('x'.repeat(500))).toHaveLength(120)
  })
})

describe('buildEnquiryNotification', () => {
  it('leads the subject with the interest and the company', () => {
    const { subject } = buildEnquiryNotification(base, 'stored')
    expect(subject).toBe('Enquiry — Exposure Diagnostic — Example Corp')
  })

  it('falls back to the name, then the email, when there is no company', () => {
    expect(
      buildEnquiryNotification({ ...base, company: '' }, 'stored').subject,
    ).toContain('Jordan Blake')
    expect(
      buildEnquiryNotification({ ...base, company: '', name: '' }, 'stored').subject,
    ).toContain('jordan@example-corp.com')
  })

  it('carries the whole enquiry, so the email is a usable record on its own', () => {
    const { text } = buildEnquiryNotification(base, 'stored')
    expect(text).toContain('Jordan Blake')
    expect(text).toContain('jordan@example-corp.com')
    expect(text).toContain('Example Corp')
    expect(text).toContain('Exposure Diagnostic')
    expect(text).toContain('We deploy an Annex III system')
  })

  it('preserves the advisory form’s "Subject area:" first line verbatim', () => {
    const message = 'Subject area: Semiconductors\n\nWhat is our exposure?'
    const { text } = buildEnquiryNotification({ ...base, message }, 'stored')
    expect(text).toContain(message)
  })

  it('replies to the enquirer, not to the site', () => {
    expect(buildEnquiryNotification(base, 'stored').replyTo).toBe(base.email)
  })

  describe('when the enquiry was not saved', () => {
    it('says so in the subject, where it cannot be missed in an inbox list', () => {
      const { subject } = buildEnquiryNotification(base, 'failed')
      expect(subject.startsWith('[NOT SAVED]')).toBe(true)
    })

    it('tells the reader this copy is the only record', () => {
      const { text } = buildEnquiryNotification(base, 'failed')
      expect(text).toContain('WAS NOT SAVED')
      expect(text).toContain('Saved to Kit: NO')
    })

    it('still carries the full message, which is the whole reason to send it', () => {
      const { text } = buildEnquiryNotification(base, 'failed')
      expect(text).toContain('We deploy an Annex III system')
    })
  })

  it('never emits a multi-line subject, whatever the visitor typed', () => {
    // `normalizeField` in the route trims and truncates but does not strip
    // newlines, so these arrive exactly as typed.
    const hostile: Enquiry = {
      ...base,
      company: 'Example\nBcc: someone@elsewhere.test',
      interest: 'Diagnostic\r\nX-Injected: yes',
    }
    const { subject } = buildEnquiryNotification(hostile, 'stored')
    expect(subject).not.toContain('\n')
    expect(subject).not.toContain('\r')
  })

  it('renders em dashes for the optional fields rather than blanks', () => {
    const { text } = buildEnquiryNotification(
      { ...base, company: '', message: '' },
      'stored',
    )
    expect(text).toContain('Company:  —')
    expect(text).toContain('(no message)')
  })
})
