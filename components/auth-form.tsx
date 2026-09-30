'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.56-5.17 3.56-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.96-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.23v3.11A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.23a11.99 11.99 0 0 0 0 10.76l4.02-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44A11.87 11.87 0 0 0 12 0 11.99 11.99 0 0 0 1.23 6.62l4.02 3.11c.95-2.84 3.61-4.96 6.75-4.96Z"
      />
    </svg>
  )
}

const redirectUrl = () =>
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`

export function AuthForm({ mode }: { mode: 'login' | 'signup' | 'admin-signup' | 'forgot' }) {
  const isSignup = mode === 'signup' || mode === 'admin-signup'
  const isAdminSignup = mode === 'admin-signup'
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function signInWithGoogle() {
    setMessage('')
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl() },
      })
      if (error) {
        setMessage('We could not start Google sign-in. Please try again.')
        setGoogleLoading(false)
      }
    } catch {
      setMessage('We could not start Google sign-in. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)
    let navigationStarted = false

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

      if (isSignup) {
        if (password !== confirm) {
          setMessage('Passwords do not match.')
          return
        }
        if (password.length < 8) {
          setMessage('Use at least 8 characters for your password.')
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl(),
            data: { full_name: fullName, role: isAdminSignup ? 'admin' : role },
          },
        })
        if (error) {
          setMessage('We could not create your account. Check your details and try again.')
          return
        }
        if (data.session) {
          navigationStarted = true
          window.location.href = '/dashboard'
          return
        }
        setMessage('Account created. Check your inbox to confirm your email.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('Invalid email or password.')
      } else {
        navigationStarted = true
        window.location.href = '/dashboard'
      }
    } finally {
      if (!navigationStarted) setLoading(false)
    }
  }

  const title =
    mode === 'login' ? 'Welcome back' : isAdminSignup ? 'Create admin account' : mode === 'signup' ? 'Create your account' : 'Reset your password'

  return (
    <main className="flex min-h-screen items-center justify-center bg-graph-paper px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <Link href="/" aria-label="Quanttoria home" className="mx-auto flex w-fit">
          <Logo variant="full" className="w-40 sm:w-48" />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {mode === 'login' ? 'Your next breakthrough is waiting.' : 'A friendly space for curious minds.'}
        </p>

        {loading && (
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-5 bg-background/55 p-4 backdrop-blur-md" role="status" aria-live="polite" aria-label={mode === 'login' ? 'Signing you in' : mode === 'forgot' ? 'Sending your reset link' : 'Creating your account'}>
            <div className="relative grid size-20 place-items-center rounded-full bg-card shadow-xl">
              <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-primary/20 border-t-primary motion-reduce:animate-pulse" aria-hidden="true" />
              <Image src="/images/quanttoria-logo.png" alt="" width={861} height={678} className="size-10 object-contain" priority />
            </div>
            <p className="text-center text-sm font-bold text-foreground">{mode === 'login' ? 'Signing you in…' : mode === 'forgot' ? 'Sending your reset link…' : 'Creating your account…'}</p>
          </div>
        )}

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
              <span className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 font-normal outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </span>
            </label>
          )}

          {isSignup && (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Confirm password
              <span className="relative">
                <input required type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 font-normal outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowConfirm((visible) => !visible)} aria-label={showConfirm ? 'Hide confirmed password' : 'Show confirmed password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {showConfirm ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </span>
            </label>
          )}

          {mode === 'login' && <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">Forgot password?</Link>}
          <Button type="submit" disabled={loading} aria-busy={loading} className="mt-2 min-h-12 w-full rounded-full px-6 text-base font-bold shadow-sm">
            {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : isAdminSignup ? 'Create admin account' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Button>
          {loading && <p className="sr-only" role="status">Submitting, please wait.</p>}
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground" role="separator">
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              or
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleLoading || loading}
              aria-busy={googleLoading}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-input bg-card px-6 text-base font-bold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Connecting…' : mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          </>
        )}

        {mode !== 'forgot' && (
          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>
              {mode === 'login' ? 'New to Quanttoria?' : 'Already have an account?'}{' '}
              <Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-primary hover:underline">
                {mode === 'login' ? 'Create account' : 'Login'}
              </Link>
            </p>
            {mode === 'login' && <Link href="/admin-signup" className="text-xs font-semibold text-muted-foreground hover:text-primary hover:underline">Register as an admin</Link>}
          </div>
        )}
      </div>
    </main>
  )
}
