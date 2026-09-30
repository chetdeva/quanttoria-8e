export const TIMEZONE_OPTIONS = [
  { value: 'auto', label: 'Local time (detected)' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
]

export function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })
  const map: Record<string, string> = {}
  for (const part of fmt.formatToParts(date)) map[part.type] = part.value
  const hour = map.hour === '24' ? 0 : Number(map.hour)
  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    hour,
    minute: Number(map.minute),
    weekday: map.weekday,
    monthDay: `${map.month}/${map.day}`,
  }
}

export function hourLabel(hour: number) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display} ${period}`
}
