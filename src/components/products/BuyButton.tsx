import { Button } from '@/components/ui/button'

/**
 * The one Buy button. Opens a Lemon Squeezy hosted checkout in a new tab and
 * fires a Plausible goal via the CSS-class convention (`+` for spaces, which
 * Plausible decodes). Callers must only pass a URL that came back non-null
 * from `liveCheckoutUrl()` — this component does not re-check the gates.
 */
export function BuyButton({
  url,
  label,
  event,
  className = '',
  variant = 'default',
  size = 'lg',
}: {
  url: string
  label: string
  /** Plausible goal name with spaces, e.g. "Buy Sector Report". */
  event: string
  className?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}) {
  const goal = `plausible-event-name=${event.trim().replace(/\s+/g, '+')}`
  return (
    <Button size={size} variant={variant} className={className} asChild>
      <a href={url} target="_blank" rel="noopener noreferrer" className={`lemonsqueezy-button ${goal}`}>
        {label}
      </a>
    </Button>
  )
}
