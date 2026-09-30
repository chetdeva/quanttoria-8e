'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
export function SignOutButton() { async function signOut() { await createClient().auth.signOut(); window.location.href = '/login' } return <Button variant="outline" onClick={signOut} className="rounded-full font-bold">Sign out</Button> }
