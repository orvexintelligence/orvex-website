import crypto from 'crypto'

const usageStore = new Map()
const WINDOW_MS = Number(process.env.FREE_SCAN_WINDOW_HOURS || 24) * 60 * 60 * 1000
const FREE_SCAN_LIMIT = Number(process.env.FREE_SCAN_LIMIT || 1)
const ENFORCE_FREE_SCAN_LIMIT = process.env.ENFORCE_FREE_SCAN_LIMIT !== 'false'

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value).toLowerCase().trim()).digest('hex')
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

function cleanupUsage(now = Date.now()) {
  for (const [key, entry] of usageStore.entries()) {
    if (now - entry.windowStartedAt > WINDOW_MS) usageStore.delete(key)
  }
}

export function checkFreeScan(req, scope, value, commit = false) {
  if (!ENFORCE_FREE_SCAN_LIMIT) return { allowed: true, used: 0, limit: FREE_SCAN_LIMIT }

  const now = Date.now()
  cleanupUsage(now)

  const normalizedScope = String(scope || 'scan').toLowerCase().trim()
  const normalizedValue = String(value || '').toLowerCase().trim()
  const keys = [
    `${normalizedScope}:ip:${sha256(getClientIp(req))}`,
    `${normalizedScope}:entity:${sha256(normalizedValue)}`,
  ]
  const entries = keys.map(key => [key, usageStore.get(key) || { count: 0, windowStartedAt: now }])

  for (const [, entry] of entries) {
    if (now - entry.windowStartedAt > WINDOW_MS) {
      entry.count = 0
      entry.windowStartedAt = now
    }
  }

  const maxUsed = Math.max(...entries.map(([, entry]) => entry.count))
  if (maxUsed >= FREE_SCAN_LIMIT) {
    return { allowed: false, used: maxUsed, limit: FREE_SCAN_LIMIT }
  }

  if (commit) {
    for (const [key, entry] of entries) {
      entry.count += 1
      usageStore.set(key, entry)
    }
  }

  return { allowed: true, used: commit ? maxUsed + 1 : maxUsed, limit: FREE_SCAN_LIMIT }
}

export function isFreeScanLimitEnabled() {
  return ENFORCE_FREE_SCAN_LIMIT
}

export function getFreeScanLimit() {
  return FREE_SCAN_LIMIT
}
