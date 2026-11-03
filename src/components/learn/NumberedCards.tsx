import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Numbered cards, exactly as the AI Act Compliance Toolkit page draws them
 * (amber mono "01" above the title), so Learn reads as part of the same site.
 */
export function NumberedCards({
  items,
  columns = 2,
}: {
  items: ReadonlyArray<{ title: string; body: string }>
  columns?: 2 | 4
}) {
  const grid = columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'
  return (
    <div className={`grid grid-cols-1 gap-6 ${grid}`}>
      {items.map((item, index) => (
        <Card key={item.title} className="border-border-subtle bg-stone-charcoal">
          <CardHeader className="pb-2">
            <span className="font-mono text-sm text-silicon-amber-strong">{String(index + 1).padStart(2, '0')}</span>
            <CardTitle className="text-lg text-text-primary">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
