import { errorResponse, reserve } from '@/lib/calendar/server'
import { provisionBooking, removeBookingMeeting } from '@/lib/calendar/providers'
export async function POST(request: Request) {
  try {
    const {id,isAdminView,replaceId}=await reserve(request)
    // Admin test previews must never send real student invitations.
    if (!isAdminView) {
      // Provisioning must never turn an already committed reservation into
      // an apparent booking failure (and encourage duplicate retries).
      try {
        if (replaceId) await removeBookingMeeting(replaceId)
        await provisionBooking(id)
      } catch {
        // Booking remains confirmed; its persisted meeting status stays pending.
      }
    }
    return Response.json({id},{status:201,headers:{'Cache-Control':'no-store'}})
  } catch(error) {return errorResponse(error)}
}
