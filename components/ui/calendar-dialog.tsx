'use client'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarDialog({
  open,
  onClose,
  title,
  children,
  busy = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  busy?: boolean
}) {
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose()
      }}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/35 p-4 backdrop-blur-sm"
    >
      <Modal className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl">
        <Dialog className="outline-none">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Heading slot="title" className="font-display text-2xl font-bold">
              {title}
            </Heading>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close dialog"
              disabled={busy}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
