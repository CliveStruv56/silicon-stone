/** Numbered steps with the teal rule, as the Toolkit page's workflow draws them. */
export function NumberedSteps({
  items,
  columns = 2,
}: {
  items: ReadonlyArray<{ title: string; body?: string | null }>
  columns?: 2 | 3 | 4
}) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns]
  return (
    <ol className={`grid grid-cols-1 gap-6 ${grid}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item.title}`} className="border-l-2 border-stone-teal pl-4">
          <div className="font-semibold text-text-primary">
            <span className="mr-2 font-mono text-stone-teal">{index + 1}.</span>
            {item.title}
          </div>
          {item.body && <p className="mt-2 text-sm text-text-muted">{item.body}</p>}
        </li>
      ))}
    </ol>
  )
}
