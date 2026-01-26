'use client'

import { useEffect, useState, useRef } from 'react'
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
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      requestAnimationFrame(() => setMounted(true))
    }
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
    <div className="w-full bg-stone-charcoal border-none py-1.5 px-6 flex items-center justify-between gap-4 font-mono text-xs overflow-hidden">
      <div className="flex items-center gap-2 text-alert-red font-bold uppercase tracking-wider whitespace-nowrap">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-red opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-red"></span>
        </span>
        AI Act Deadline
      </div>

      <div className="flex items-center gap-4 text-text-primary whitespace-nowrap">
        <span>{timeLeft.days}D</span>
        <span>{String(timeLeft.hours).padStart(2, '0')}H</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}M</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}S</span>
      </div>

      <div className="hidden md:block text-text-muted truncate opacity-70">
        Status: Implementation Phase
      </div>
    </div>
  )
}
