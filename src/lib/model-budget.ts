import 'server-only'

import { getUsageSummary } from './usage'

/**
 * A monthly ceiling on model spend, checked before dispatch rather than
 * discovered on the invoice.
 *
 * Off unless `AI_MONTHLY_BUDGET_USD` is set — an unset ceiling means no ceiling,
 * which is the behaviour every existing call path already has.
 *
 * When it *is* set and the usage ledger cannot be read, the check blocks. That
 * is the deliberate choice: someone who configures a spending limit wants it
 * enforced, and "we could not tell how much you have spent, so we spent more"
 * is not an enforcement strategy. The failure mode is a feature that stops
 * working when the ledger breaks, which is loud, recoverable, and cheap.
 */

export interface BudgetCheck {
  allowed: boolean
  /** Present when a ceiling is configured. */
  ceiling?: number
  spent?: number
  reason?: 'over-budget' | 'ledger-unavailable'
}

function ceilingUsd(): number | null {
  const raw = process.env.AI_MONTHLY_BUDGET_USD?.trim()
  if (!raw) return null
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function checkMonthlyBudget(): Promise<BudgetCheck> {
  const ceiling = ceilingUsd()
  if (ceiling === null) return { allowed: true }

  const summary = await getUsageSummary('mtd')
  if (!summary.available) {
    console.error('Monthly budget ceiling is set but the usage ledger is unavailable — blocking.')
    return { allowed: false, ceiling, reason: 'ledger-unavailable' }
  }

  const spent = summary.totalCostDollars
  return spent >= ceiling
    ? { allowed: false, ceiling, spent, reason: 'over-budget' }
    : { allowed: true, ceiling, spent }
}
