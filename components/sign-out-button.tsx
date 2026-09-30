'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function logOut() {
    setLoading(true)
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-full font-bold"
      >
        Log out
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
          role="presentation"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="w-full max-w-md rounded-3xl border border-border bg-background p-6 text-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="logout-dialog-title" className="font-display text-xl font-extrabold">
              Are you sure you want to log out?
            </h2>
            <p id="logout-dialog-description" className="sr-only">
              Confirm whether you want to end your current session.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={logOut} disabled={loading}>
                {loading ? 'Logging out…' : 'Yes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { SignOutButton as LogOutButton }
