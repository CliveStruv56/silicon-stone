'use client'

import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Accessible name for the sheet dialog. */
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * Mobile bottom sheet built on native <dialog>, which supplies the focus trap,
 * Esc-to-close, inert background, and focus return to the trigger for free.
 * Adds the sheet-specific gestures: scrim tap and swipe-down on the grab
 * handle. Slides up on open unless the user prefers reduced motion.
 */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragDelta = useRef(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Keep the page from scrolling behind the sheet.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Native cancel fires on Esc; sync it back into React state.
  const handleCancel = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()
      onClose()
    },
    [onClose],
  )

  // If the dialog closes by any native path we didn't drive (e.g. a
  // method="dialog" form), keep React state in sync so it can reopen.
  const handleNativeClose = useCallback(() => {
    if (open) onClose()
  }, [open, onClose])

  // Clicks on the <dialog> element itself are backdrop (scrim) clicks —
  // clicks inside the panel land on descendants.
  const handleScrimClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose()
    },
    [onClose],
  )

  const onTouchStart = (event: React.TouchEvent) => {
    dragStartY.current = event.touches[0].clientY
    dragDelta.current = 0
  }

  const onTouchMove = (event: React.TouchEvent) => {
    if (dragStartY.current === null) return
    dragDelta.current = event.touches[0].clientY - dragStartY.current
    const panel = dialogRef.current?.firstElementChild as HTMLElement | null
    if (panel && dragDelta.current > 0) {
      panel.style.transform = `translateY(${dragDelta.current}px)`
      panel.style.transition = 'none'
    }
  }

  const onTouchEnd = () => {
    const panel = dialogRef.current?.firstElementChild as HTMLElement | null
    if (panel) {
      panel.style.transform = ''
      panel.style.transition = ''
    }
    if (dragDelta.current > 80) onClose()
    dragStartY.current = null
    dragDelta.current = 0
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleScrimClick}
      className={cn(
        // Reset dialog UA styles; pin to the bottom, full width.
        'fixed inset-x-0 bottom-0 top-auto z-50 m-0 w-full max-w-none bg-transparent p-0',
        'backdrop:bg-black/50',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-t-2xl border-t border-border-subtle bg-slate-deep shadow-2xl',
          'max-h-[85dvh] overflow-y-auto overscroll-contain',
          'motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-200',
        )}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Grab handle — the swipe-down dismiss target */}
        <div
          className="sticky top-0 cursor-grab touch-none bg-slate-deep pb-2 pt-3"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-border-subtle" aria-hidden="true" />
        </div>
        {children}
      </div>
    </dialog>
  )
}
