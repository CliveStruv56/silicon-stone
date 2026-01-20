'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const AI_ACT_DEADLINE = new Date('2026-08-02T00:00:00Z')

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date()
  const difference = AI_ACT_DEADLINE.getTime() - now.getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export function DeadlineCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <Card className="bg-stone-charcoal border-alert-red/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-alert-red">AI Act Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold text-text-primary">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-stone-charcoal border-alert-red/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-alert-red flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-red"></span>
          </span>
          AI Act Deadline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-text-muted mb-3">August 2, 2026 - High-Risk AI Systems</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-text-primary">{timeLeft.days}</div>
            <div className="text-xs text-text-muted">days</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-text-primary">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-xs text-text-muted">hours</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-text-primary">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-xs text-text-muted">mins</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-text-primary">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-xs text-text-muted">secs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
