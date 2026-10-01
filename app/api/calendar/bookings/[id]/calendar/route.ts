import { calendarIdentity, CalendarError, errorResponse, normalizeBooking } from '@/lib/calendar/server'
import { bookingFields } from '@/lib/calendar/types'
import { bookingIcs } from '@/lib/calendar/ics'
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {supabase}=await calendarIdentity(request)
    const {id}=await params
    const {data,error}=await supabase.from('class_bookings').select(bookingFields).eq('id',id).maybeSingle()
    if(error||!data) throw new CalendarError('Class not found.',404)
    return new Response(bookingIcs(normalizeBooking(data)),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="math-class.ics"','Cache-Control':'private, no-store'}})
  } catch(error) {return errorResponse(error)}
}
