import type { Booking } from './types'

export function validDuration(minutes: unknown): minutes is number {
  return typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= 15 && minutes <= 180 && minutes % 15 === 0
}

export function requiredCredits(minutes: number): number {
  return minutes / 60
}

export function joinLink(booking: Booking, now = Date.now()): string | null {
  if (booking.status !== 'confirmed' || !booking.class_sessions || !(Date.parse(booking.class_sessions.ends_at) > now)) return null
  try {
    const url = new URL(booking.meeting_url || '')
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}
