import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const code = readFileSync(
  new URL('./server/routes/guardStripeWebhook.js', import.meta.url),
  'utf8'
)

test('Checkout temporaneo: webhook prevede HTTP 503', () => {
  assert.match(
    code,
    /if\s*\(!permanentReasons\.has\(result\.reason\)\)/
  )

  assert.match(
    code,
    /error:\s*'Checkout in attesa di riconciliazione'/
  )

  assert.match(
    code,
    /return res\.status\(503\)/
  )
})

test('Checkout definitivamente non valido: webhook prevede rifiuto', () => {
  assert.match(
    code,
    /permanentReasons = new Set/
  )

  assert.match(
    code,
    /'Prezzo Checkout non autorizzato'/
  )

  assert.match(
    code,
    /'rejected'/
  )
})
