'use client'
import type { Snapshot } from './types'

export async function calendarRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/calendar${path}`, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (response.redirected || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.status === 404
      ? 'The booking service is unavailable. Refresh the page; if this persists, restart the app server.'
      : 'The calendar service returned an unexpected response. Refresh your classes before trying again.')
  }
  const data = await response.json().catch(() => {
    throw new Error('The calendar service returned an invalid response. Refresh your classes before trying again.')
  })
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The calendar service returned an invalid response. Refresh your classes before trying again.')
  }
  if (!response.ok) throw new Error(data.error || 'Calendar request failed. Please try again.')
  return data as T
}
export const loadCalendar = (profileId: string) => calendarRequest<Snapshot>(`?userId=${encodeURIComponent(profileId)}`)
