import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OAUTH_POPUP_MESSAGE = 'quanttoria-oauth-callback'
const POPUP_COOKIE = 'oauth_popup'

// Google's own sign-in pages send a Cross-Origin-Opener-Policy header that
// severs window.opener once the popup navigates to accounts.google.com, even
// after Google redirects back to our origin. window.opener can't be trusted
// here, so BroadcastChannel (unaffected by COOP) carries the result, and the
// short-lived cookie below (set client-side before the popup opens) is what
// this route uses to know it's handling the popup flow rather than a normal
// email-link redirect.
function popupCloseResponse(success: boolean) {
  const html = `<!doctype html>
<html>
<body>
<script>
  (function () {
    try {
      var channel = new BroadcastChannel(${JSON.stringify(OAUTH_POPUP_MESSAGE)})
      channel.postMessage({ success: ${success} })
      channel.close()
    } catch (e) {}
    window.close()
    // If this window wasn't actually a script-opened pop-up (close() is a
    // no-op), fall back to a normal redirect instead of sitting blank.
    setTimeout(function () {
      window.location.replace(${JSON.stringify(success ? '/dashboard' : '/login')})
    }, 1500)
  })()
</script>
</body>
</html>`
  const response = new NextResponse(html, { headers: { 'content-type': 'text/html' } })
  response.cookies.set(POPUP_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const isPopup = request.cookies.get(POPUP_COOKIE)?.value === '1'

  let success = false
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    success = !error
  }

  if (isPopup) {
    return popupCloseResponse(success)
  }

  return NextResponse.redirect(new URL(success ? '/dashboard' : '/login', request.url))
}
