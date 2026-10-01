import { errorResponse, snapshot } from '@/lib/calendar/server'
export async function GET(request: Request) {
  try {return Response.json(await snapshot(request),{headers:{'Cache-Control':'private, no-store'}})} catch(error) {return errorResponse(error)}
}
