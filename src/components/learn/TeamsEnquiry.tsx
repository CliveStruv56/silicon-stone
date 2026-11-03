'use client'

import { Building2, Clock, Users } from 'lucide-react'

import { EngagementContactForm } from '@/components/advisory/EngagementContactForm'

/**
 * The in-house training enquiry. The existing `/api/contact` path, so it
 * inherits Standfirst storage and the owner notification instead of
 * reimplementing either. A client wrapper only because the trust items carry
 * icon components, which cannot cross the server boundary.
 */
export function TeamsEnquiry() {
  return (
    <EngagementContactForm
      interest="Learn: in-house training"
      plausibleEvent="Learn Teams Enquiry"
      heading="Tell us what you need"
      intro="Who it is for, roughly how many people, and what they need to be able to do afterwards. We’ll reply with a suggested format."
      messageLabel="What would you like your team to learn?"
      messagePlaceholder="For example: a 90-minute briefing for our board on AI infrastructure and sovereignty, or AI literacy for 200 staff."
      showIntroBooking={false}
      trustItems={[
        { icon: Users, title: 'Any size', body: 'From a board of six to all staff.' },
        { icon: Clock, title: '60 minutes to two days', body: 'Formats built from the same course library.' },
        { icon: Building2, title: 'Your systems', body: 'Exercises run on your own organisation.' },
      ]}
    />
  )
}
