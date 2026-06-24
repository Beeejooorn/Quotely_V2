import { useEffect, useMemo, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import BrandSettings from './components/BrandSettings.jsx'
import Dashboard from './components/Dashboard.jsx'
import Profile from './components/Profile.jsx'
import QuoteBuilder from './components/QuoteBuilder.jsx'
import QuotePreview from './components/QuotePreview.jsx'
import SavedQuotes from './components/SavedQuotes.jsx'
import { defaultSettings, initialQuotes } from './data/seedQuotes.js'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js'
import {
  calculateQuote,
  createBlankQuote,
  downloadQuotationHtml,
  nextQuoteNumber,
  normalizeMoney,
} from './utils/quotation.js'
import './App.css'

const STORAGE_VERSION = 'v1'
const LEGACY_STORAGE_KEYS = {
  'brand-settings': 'quotely-brand-settings',
  quotes: 'quotely-quotes',
}

function getStorageKey(key) {
  return `quotely:${key}:${STORAGE_VERSION}`
}

function readStoredValue(key, fallback) {
  try {
    const storedValue =
      window.localStorage.getItem(getStorageKey(key)) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEYS[key])
    const parsedValue = storedValue ? JSON.parse(storedValue) : fallback

    if (key === 'brand-settings' && parsedValue.accentColor === '#0f9f82') {
      return { ...parsedValue, accentColor: fallback.accentColor }
    }

    return parsedValue
  } catch {
    return fallback
  }
}

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(getStorageKey(key), JSON.stringify(value))
    } catch {
      // localStorage can be unavailable in private browsing or quota-limited contexts.
    }
  }, [key, value])

  return [value, setValue]
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `quote-${Date.now()}`
}

function normalizeDraftForSave(draft, existingId, quotes) {
  const visibleAddOns = draft.addOns.filter(
    (item) => item.name.trim() || normalizeMoney(item.price) > 0,
  )

  return {
    ...draft,
    id: existingId || draft.id || createId(),
    quotationNumber: draft.quotationNumber || nextQuoteNumber(quotes),
    basePrice: normalizeMoney(draft.basePrice),
    discount: normalizeMoney(draft.discount),
    addOns: visibleAddOns.length ? visibleAddOns : [{ name: '', price: 0 }],
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function SecureWorkspace({ account, onLogout }) {
  const [quotes, setQuotes] = usePersistedState('quotes', initialQuotes)
  const [settings, setSettings] = usePersistedState(
    'brand-settings',
    defaultSettings,
  )
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedQuoteId, setSelectedQuoteId] = useState(null)
  const [draftQuote, setDraftQuote] = useState(() =>
    createBlankQuote(nextQuoteNumber(quotes)),
  )

  const draftTotals = useMemo(() => calculateQuote(draftQuote), [draftQuote])
  const isEditing = Boolean(selectedQuoteId)

  const startNewQuote = (nextQuotes = quotes) => {
    setSelectedQuoteId(null)
    setDraftQuote(createBlankQuote(nextQuoteNumber(nextQuotes)))
    setActiveSection('create')
  }

  const saveQuote = () => {
    const savedQuote = normalizeDraftForSave(draftQuote, selectedQuoteId, quotes)

    setQuotes((currentQuotes) => {
      const exists = currentQuotes.some((quote) => quote.id === savedQuote.id)

      if (exists) {
        return currentQuotes.map((quote) =>
          quote.id === savedQuote.id ? savedQuote : quote,
        )
      }

      return [savedQuote, ...currentQuotes]
    })

    setSelectedQuoteId(savedQuote.id)
    setDraftQuote(savedQuote)
    setActiveSection('saved')
  }

  const viewQuote = (quote) => {
    setSelectedQuoteId(quote.id)
    setDraftQuote({
      ...quote,
      addOns: quote.addOns?.length ? quote.addOns : [{ name: '', price: 0 }],
    })
    setActiveSection('create')
  }

  const deleteQuote = (quoteId) => {
    const nextQuotes = quotes.filter((quote) => quote.id !== quoteId)
    setQuotes(nextQuotes)

    if (quoteId === selectedQuoteId) {
      setSelectedQuoteId(null)
      setDraftQuote(createBlankQuote(nextQuoteNumber(nextQuotes)))
    }
  }

  const updateQuoteStatus = (quoteId, status) => {
    setQuotes((currentQuotes) =>
      currentQuotes.map((quote) =>
        quote.id === quoteId
          ? { ...quote, status, updatedAt: new Date().toISOString() }
          : quote,
      ),
    )

    if (quoteId === selectedQuoteId) {
      setDraftQuote((currentDraft) => ({ ...currentDraft, status }))
    }
  }

  const renderSection = () => {
    if (activeSection === 'profile') {
      return <Profile account={account} onLogout={onLogout} />
    }

    if (activeSection === 'saved') {
      return (
        <SavedQuotes
          quotes={quotes}
          onCreate={() => startNewQuote()}
          onDelete={deleteQuote}
          onStatusChange={updateQuoteStatus}
          onView={viewQuote}
        />
      )
    }

    if (activeSection === 'settings') {
      return (
        <BrandSettings
          settings={settings}
          onChange={setSettings}
          quote={draftQuote}
          totals={draftTotals}
        />
      )
    }

    if (activeSection === 'create') {
      return (
        <section className="workspace-page" aria-labelledby="create-heading">
          <div className="page-heading workspace-heading">
            <div>
              <p className="section-label">Create quotation</p>
              <h1 id="create-heading">
                {isEditing ? 'Edit quotation details' : 'Create a quotation'}
              </h1>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => startNewQuote()}
              >
                New quote
              </button>
              <button className="button primary" type="button" onClick={saveQuote}>
                Save quotation
              </button>
            </div>
          </div>

          <div className="quote-workspace">
            <QuoteBuilder
              quote={draftQuote}
              totals={draftTotals}
              onChange={setDraftQuote}
              onNew={() => startNewQuote()}
              onSave={saveQuote}
              isEditing={isEditing}
            />
            <QuotePreview
              quote={draftQuote}
              settings={settings}
              totals={draftTotals}
              onDownload={() => downloadQuotationHtml(draftQuote, settings)}
              onPrint={() => window.print()}
            />
          </div>
        </section>
      )
    }

    return (
      <Dashboard
        quotes={quotes}
        onCreate={() => startNewQuote()}
        onNavigate={setActiveSection}
        onView={viewQuote}
      />
    )
  }

  return (
    <AppShell
      activeSection={activeSection}
      onNavigate={setActiveSection}
      accentColor={settings.accentColor}
      account={account}
      onLogout={onLogout}
    >
      {renderSection()}
    </AppShell>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false)
      setAuthError('Add Supabase environment variables to enable live sign-in.')
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
      }

      setSession(data.session)
      setIsAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      setAuthMessage('')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleEmailAuth = async ({ email, mode, name, password }) => {
    if (!supabase) {
      setAuthError('Add Supabase environment variables to enable live sign-in.')
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()

    if (!trimmedEmail || !password) {
      setAuthError('Enter your email and password.')
      return
    }

    if (mode === 'signup' && !trimmedName) {
      setAuthError('Enter your name.')
      return
    }

    if (password.length < 8) {
      setAuthError('Use at least 8 characters for your password.')
      return
    }

    const response =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: { full_name: trimmedName },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })

    if (response.error) {
      setAuthError(response.error.message)
      return
    }

    setAuthError('')
    setAuthMessage(
      mode === 'signup' && !response.data.session
        ? 'Check your email to confirm your account.'
        : '',
    )
  }

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setSession(null)
    setAuthError('')
  }

  const handleSocialLogin = async (provider) => {
    if (!supabase) {
      setAuthError('Add Supabase environment variables to enable live sign-in.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setAuthError(error.message)
    }
  }

  if (isAuthLoading) {
    return (
      <main className="auth-page" aria-label="Loading Quotely">
        <section className="auth-panel">
          <div className="auth-mark-row">
            <span className="brand-mark" aria-hidden="true">
              Q
            </span>
          </div>
          <div className="auth-copy">
            <h1>Opening Quotely</h1>
            <p>Checking your sign-in session.</p>
          </div>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <AuthScreen
        error={authError}
        isConfigured={isSupabaseConfigured}
        message={authMessage}
        onEmailAuth={handleEmailAuth}
        onSocialLogin={handleSocialLogin}
      />
    )
  }

  return <SecureWorkspace account={session.user} onLogout={logout} />
}

export default App
