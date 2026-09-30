export type GridSession = { id: string; title: string; starts_at: string; ends_at: string }

export type Session = {
  id: string
  teacher_id: string
  title: string
  starts_at: string
  ends_at: string
  status: string
  topic: string | null
  notes: string | null
}

export type Booking = {
  id: string
  session_id: string
  status: string
  topic: string | null
  notes: string | null
  class_sessions?: Session
}

export type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
}
