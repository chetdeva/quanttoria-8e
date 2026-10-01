import type { Availability } from './types'

export const weekdays = [
  { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
] as const

export function availabilityEnd(start: string, minutes: number): string {
  // Availability is a wall-clock range; do not let the browser's DST offset
  // silently add an hour when calculating its displayed end time.
  const date = new Date(`${start}Z`)
  if (!Number.isFinite(+date) || !Number.isInteger(minutes) || minutes < 15 || minutes > 1440 || minutes % 15) return ''
  date.setUTCMinutes(date.getUTCMinutes() + minutes)
  return date.toISOString().slice(0,16)
}

export function weeklyAvailability(teacherId: string, selectedDays: number[], start: string, end: string, timezone: string, existing: Availability[]) {
  if (!selectedDays.length || selectedDays.some(day=>!Number.isInteger(day)||day<0||day>6)) throw new Error('Choose at least one weekday.')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(end) || start.slice(0,10)!==end.slice(0,10) || start>=end) throw new Error('Weekly availability must start and finish on the same day.')
  return [...new Set(selectedDays)].map(day=>({teacher_id:teacherId,day_of_week:day,start_time:start.slice(11),end_time:end.slice(11),timezone,is_active:true})).filter(row=>!existing.some(item=>item.is_active && item.teacher_id===teacherId && item.day_of_week===row.day_of_week && item.timezone===timezone && item.start_time.slice(0,5)===row.start_time && item.end_time.slice(0,5)===row.end_time))
}
