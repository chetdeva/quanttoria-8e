'use client'

import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Session } from './types'

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))

export function BookingDialog({
  session,
  topic,
  onTopicChange,
  onClose,
  onConfirm,
}: {
  session: Session | null
  topic: string
  onTopicChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={session !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Confirm your class</DialogTitle>
        </DialogHeader>
        {session && (
          <>
            <p className="rounded-2xl bg-secondary p-4 font-bold">
              {formatDate(session.starts_at)} · {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
              <span className="mt-1 block text-sm font-normal text-muted-foreground">{session.title}</span>
            </p>
            <label className="mt-1 block text-sm font-bold" htmlFor="topic">
              What would you like to work on?
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Optional topic or note"
            />
            <Button className="mt-3 w-full" onClick={onConfirm}>
              <Check data-icon="inline-start" />
              Confirm booking
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
