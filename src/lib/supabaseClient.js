import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const configuredAppUrl = import.meta.env.VITE_APP_URL

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

const authStorageKey = 'quotely:auth-session'
const authPersistenceKey = 'quotely:auth-persistence'

function getLegacyAuthStorageKey() {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

    return projectRef ? `sb-${projectRef}-auth-token` : ''
  } catch {
    return ''
  }
}

function safeStorage(type) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return type === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function normalizeOrigin(value) {
  if (!value) {
    return ''
  }

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function isLocalOrigin(value) {
  try {
    const hostname = new URL(value).hostname

    return ['localhost', '127.0.0.1', '::1'].includes(hostname)
  } catch {
    return false
  }
}

export function getAuthRedirectUrl() {
  const runtimeOrigin = typeof window !== 'undefined' ? normalizeOrigin(window.location.origin) : ''
  const configuredOrigin = normalizeOrigin(configuredAppUrl)

  if (runtimeOrigin && !isLocalOrigin(runtimeOrigin)) {
    return runtimeOrigin
  }

  return configuredOrigin || runtimeOrigin || '/'
}

function getAuthPersistence() {
  const localStorage = safeStorage('local')
  const persistence = localStorage?.getItem(authPersistenceKey)

  return persistence === 'session' ? 'session' : 'local'
}

export function setAuthPersistence(shouldPersist) {
  const localStorage = safeStorage('local')
  const nextPersistence = shouldPersist ? 'local' : 'session'

  localStorage?.setItem(authPersistenceKey, nextPersistence)
}

export function shouldPersistAuthSession() {
  return getAuthPersistence() === 'local'
}

export function clearAuthSessionStorage() {
  const legacyStorageKey = getLegacyAuthStorageKey()
  const authKeys = legacyStorageKey ? [authStorageKey, legacyStorageKey] : [authStorageKey]

  authKeys.forEach((key) => {
    safeStorage('local')?.removeItem(key)
    safeStorage('session')?.removeItem(key)
  })
}

const authStorage = {
  getItem(key) {
    const preferredStorage = safeStorage(getAuthPersistence())
    const fallbackStorage = safeStorage(getAuthPersistence() === 'local' ? 'session' : 'local')

    return preferredStorage?.getItem(key) || fallbackStorage?.getItem(key) || null
  },
  removeItem(key) {
    safeStorage('local')?.removeItem(key)
    safeStorage('session')?.removeItem(key)
  },
  setItem(key, value) {
    const persistence = getAuthPersistence()
    const storage = safeStorage(persistence)
    const fallbackStorage = safeStorage(persistence === 'local' ? 'session' : 'local')

    storage?.setItem(key, value)
    fallbackStorage?.removeItem(key)
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: authStorage,
        storageKey: authStorageKey,
      },
    })
  : null
