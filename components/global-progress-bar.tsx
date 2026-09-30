'use client'

import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

const NAVIGATION_PENDING_KEY = 'quanttoria-navigation-pending'

function ProgressBarController() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendingRequests, setPendingRequests] = useState(0)
  const [navigationPending, setNavigationPending] = useState(false)
  const [progress, setProgress] = useState(0)
  const originalFetchRef = useRef<typeof window.fetch | null>(null)
  const routeKeyRef = useRef(`${pathname}?${searchParams.toString()}`)

  useEffect(() => {
    if (!sessionStorage.getItem(NAVIGATION_PENDING_KEY)) return
    setNavigationPending(true)
    const frame = window.requestAnimationFrame(() => {
      sessionStorage.removeItem(NAVIGATION_PENDING_KEY)
      setNavigationPending(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    originalFetchRef.current = window.fetch

    window.fetch = async (...args) => {
      setPendingRequests((count) => count + 1)
      try {
        return await originalFetchRef.current!.apply(window, args)
      } finally {
        setPendingRequests((count) => Math.max(0, count - 1))
      }
    }

    return () => {
      if (originalFetchRef.current) window.fetch = originalFetchRef.current
    }
  }, [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return

      sessionStorage.setItem(NAVIGATION_PENDING_KEY, 'true')
      setNavigationPending(true)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    const routeKey = `${pathname}?${searchParams.toString()}`
    if (routeKey === routeKeyRef.current) return
    routeKeyRef.current = routeKey
    sessionStorage.removeItem(NAVIGATION_PENDING_KEY)
    setNavigationPending(false)
  }, [pathname, searchParams])

  const isLoading = pendingRequests > 0 || navigationPending

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      const timeout = window.setTimeout(() => setProgress(0), 180)
      return () => window.clearTimeout(timeout)
    }

    setProgress((current) => (current === 0 ? 12 : current))
    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + Math.max(1, (92 - current) * 0.08)))
    }, 220)
    return () => window.clearInterval(interval)
  }, [isLoading])

  const visible = isLoading || progress > 0

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="progressbar"
      aria-label="Loading page content"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full bg-primary shadow-[0_0_10px_var(--primary)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function GlobalProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarController />
    </Suspense>
  )
}
