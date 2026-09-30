import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OAUTH_POPUP_MESSAGE = 'quanttoria-oauth-callback'

function popupCloseResponse(success: boolean) {
  const html = `<!doctype html>
<html>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: ${JSON.stringify(OAUTH_POPUP_MESSAGE)}, success: ${success} }, window.location.origin)
    window.close()
  } else {
    window.location.replace(${JSON.stringify(success ? '/dashboard' : '/login')})
  }
</script>
</body>
</html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html' } })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  let success = false
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    success = !error
  }

  // Google sign-in runs through a pop-up window, so this response must decide
  // at runtime (via window.opener) whether to notify+close the pop-up or
  // redirect normally, since query params aren't guaranteed to survive the
  // Supabase/v0 redirect proxy chain.
  return popupCloseResponse(success)
}
