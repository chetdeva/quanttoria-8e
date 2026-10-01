import { calendarIdentity, CalendarError, errorResponse, sameOrigin } from '@/lib/calendar/server'
import { removeBookingMeeting } from '@/lib/calendar/providers'
export async function DELETE(request: Request,{params}:{params:Promise<{id:string}>}) {
  try {
    sameOrigin(request)
    const {supabase,isAdminView}=await calendarIdentity(request)
    const {id}=await params
    const {error}=await supabase.rpc('calendar_cancel',{p_booking:id})
    if(error) throw new CalendarError('Could not cancel this class. Refresh and try again.',400)
    if(!isAdminView) {
      try { await removeBookingMeeting(id) } catch {
        // Cancellation has committed; provider cleanup must not report it failed.
      }
    }
    return Response.json({cancelled:true})
  } catch(error) {return errorResponse(error)}
}
