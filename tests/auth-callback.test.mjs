import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

registerHooks({
  resolve(specifier,context,nextResolve){
    if(specifier==='@/lib/supabase/server') return {url:'data:text/javascript,export async function createClient(){return globalThis.authCallbackDb}',shortCircuit:true}
    if(specifier==='next/server') return nextResolve('next/server.js',context)
    return nextResolve(specifier,context)
  },
  load(url,context,nextLoad){
    if(url.endsWith('/app/auth/callback/route.ts')) return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true}
    return nextLoad(url,context)
  },
})
const { GET } = await import('../app/auth/callback/route.ts')
const { NextRequest } = await import('next/server.js')

test('successful Google callback exchanges code and returns to the same origin dashboard',async()=>{
  let received
  globalThis.authCallbackDb={auth:{exchangeCodeForSession:async code=>{received=code;return {error:null}}}}
  const response=await GET(new NextRequest('https://quanttoria.com/auth/callback?code=test-code'))
  assert.equal(received,'test-code')
  assert.equal(response.headers.get('location'),'https://quanttoria.com/dashboard')
})
test('failed or missing callback code returns to login instead of dashboard',async()=>{
  globalThis.authCallbackDb={auth:{exchangeCodeForSession:async()=>({error:{message:'expired code'}})}}
  for(const query of ['?code=expired','?error=access_denied','']) {
    const response=await GET(new NextRequest(`http://localhost:3000/auth/callback${query}`))
    assert.equal(response.headers.get('location'),'http://localhost:3000/login')
  }
})
test('callback ignores externally supplied redirect destinations',async()=>{
  globalThis.authCallbackDb={auth:{exchangeCodeForSession:async()=>({error:null})}}
  const response=await GET(new NextRequest('https://quanttoria.com/auth/callback?code=ok&next=https://evil.example'))
  assert.equal(response.headers.get('location'),'https://quanttoria.com/dashboard')
})
