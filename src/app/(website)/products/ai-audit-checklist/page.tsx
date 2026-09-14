import { permanentRedirect } from 'next/navigation'

/** The checklist assets are included in both editions of the consolidated toolkit. */
export default function ChecklistRedirect() {
  permanentRedirect('/products/ai-act-toolkit')
}
