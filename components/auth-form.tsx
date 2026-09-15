'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const redirectUrl = () =>
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

export function AuthForm({ mode }: { mode: 'login' | 'signup' | 'forgot' }) {
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl(),
        })
        setMessage(
          error
            ? 'We could not send that reset email. Please try again.'
            : 'Check your inbox for a password reset link.',
        )
        return
      }

      if (mode === 'signup') {
        if (password !== confirm) {
          setMessage('Passwords do not match.')
          return
        }
        if (password.length < 8) {
          setMessage('Use at least 8 characters for your password.')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl(),
            data: { full_name: fullName, role },
          },
        })
        setMessage(
          error
            ? 'We could not create your account. Check your details and try again.'
            : 'Account created. Check your inbox to confirm your email.',
        )
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('Invalid email or password.')
      } else {
        window.location.href = '/dashboard'
      }
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'

  return (
    <main className="flex min-h-screen items-center justify-center bg-graph-paper px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <Link href="/" className="font-display text-2xl font-extrabold text-primary">
          Quanttoria
        </Link>
        <h1 className="mt-8 font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {mode === 'login' ? 'Your next breakthrough is waiting.' : 'A friendly space for curious minds.'}
        </p>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1" role="group" aria-label="Account type">
                {(['student', 'teacher'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    aria-pressed={role === item}
                    className={`rounded-xl px-3 py-2 text-sm font-bold capitalize ${role === item ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-1 text-sm font-bold">
                Full name
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1 text-sm font-bold">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>

          {mode !== 'forgot' && (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Password
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
            </label>
          )}

          {mode === 'signup' && (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Confirm password
              <input required type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
            </label>
          )}

          {mode === 'login' && <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">Forgot password?</Link>}
          <Button type="submit" disabled={loading} className="mt-2 w-full rounded-full font-bold">
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Button>
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        </form>

        {mode !== 'forgot' && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'New to Quanttoria?' : 'Already have an account?'}{' '}
            <Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-primary hover:underline">
              {mode === 'login' ? 'Create account' : 'Login'}
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
