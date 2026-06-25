import { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import BrandSettings from './components/BrandSettings.jsx'
import Dashboard from './components/Dashboard.jsx'
import Profile from './components/Profile.jsx'
import QuoteBuilder from './components/QuoteBuilder.jsx'
import QuotePreview from './components/QuotePreview.jsx'
import SavedQuotes from './components/SavedQuotes.jsx'
import ServiceLibrary from './components/ServiceLibrary.jsx'
import LogoMark from './components/LogoMark.jsx'
import { defaultSettings, initialQuotes } from './data/seedQuotes.js'
import {
  isSupabaseConfigured,
  supabase,
  supabaseKey,
  supabaseUrl,
} from './lib/supabaseClient.js'
import {
  calculateQuote,
  createBlankQuote,
  downloadQuotationHtml,
  nextQuoteNumber,
  normalizeMoney,
  splitLines,
} from './utils/quotation.js'
import './App.css'

const STORAGE_VERSION = 'v1'
const LEGACY_STORAGE_KEYS = {
  'brand-settings': 'quotely-brand-settings',
  quotes: 'quotely-quotes',
}
const WORKSPACE_STORAGE_KEYS = ['quotes', 'brand-settings', 'service-templates', 'profile-image']
const LEGACY_WORKSPACE_OWNER_KEY = `quotely:legacy-workspace-owner:${STORAGE_VERSION}`
const EMPTY_SERVICE_TEMPLATES = []
const DEMO_CLIENT_FIXES = {
  'harry jay ortega': {
    clientEmail: 'isabel.reyes@studiomarquee.co',
    clientName: 'Isabel Reyes',
    location: 'Makati City',
    projectName: 'Studio Marquee Website Redesign',
  },
  'marco duchsand': {
    clientEmail: 'hello@northlineevents.com',
    clientName: 'Northline Events Co.',
    location: 'Valencia City',
    projectName: 'Website CMS Integration',
  },
  'mbappe duchsand': {
    clientEmail: 'billing@brightpathcreative.co',
    clientName: 'BrightPath Creative',
    location: 'Cagayan de Oro',
    projectName: 'Brand Identity Sprint',
  },
  'trsh plyr': {
    clientEmail: 'adrian.santos@northlineevents.com',
    clientName: 'Adrian Santos',
    location: 'Davao City',
    projectName: 'Event Proposal Package',
  },
}
const DEMO_EMAIL_FIXES = {
  'harry@gmail.com': 'isabel.reyes@studiomarquee.co',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function polishServiceText(value) {
  return String(value || '')
    .replace(/Integrate CMS in webflow made websites/gi, 'Integrate CMS into Webflow-built websites.')
    .replace(/\bwebflow\b/g, 'Webflow')
    .replace(/\bwebsite redesign\b/gi, 'Website Redesign')
}

function normalizeStoredQuote(quote) {
  const normalizedClient = String(quote.clientName || '').trim().toLowerCase()
  const fixedClient = DEMO_CLIENT_FIXES[normalizedClient] || {}
  const normalizedEmail = String(quote.clientEmail || '').trim().toLowerCase()

  return {
    ...quote,
    ...fixedClient,
    clientEmail: fixedClient.clientEmail || DEMO_EMAIL_FIXES[normalizedEmail] || quote.clientEmail,
    packageType: polishServiceText(quote.packageType),
    paymentTerms: polishServiceText(quote.paymentTerms),
    projectName: fixedClient.projectName || polishServiceText(quote.projectName),
    servicesIncluded: polishServiceText(quote.servicesIncluded),
  }
}

function normalizeStoredService(template) {
  return {
    ...template,
    description: polishServiceText(template.description),
    name: polishServiceText(template.name),
  }
}

function getStorageKey(key, accountId) {
  return accountId
    ? `quotely:${accountId}:${key}:${STORAGE_VERSION}`
    : `quotely:${key}:${STORAGE_VERSION}`
}

function normalizeStoredValue(key, value, fallback) {
  if (key === 'quotes' && Array.isArray(value)) {
    return value
      .filter((quote) => !String(quote.id || '').startsWith('seed-'))
      .map(normalizeStoredQuote)
  }

  if (key === 'service-templates' && Array.isArray(value)) {
    return value.map(normalizeStoredService)
  }

  if (key === 'brand-settings' && value?.accentColor === '#0f9f82') {
    return { ...value, accentColor: fallback.accentColor }
  }

  return value
}

function readStoredValue(key, fallback, accountId) {
  try {
    const storedValue = window.localStorage.getItem(getStorageKey(key, accountId))
    const parsedValue = storedValue ? JSON.parse(storedValue) : fallback

    return normalizeStoredValue(key, parsedValue, fallback)
  } catch {
    return fallback
  }
}

function getLegacyStoredValue(key) {
  const possibleKeys = [getStorageKey(key), LEGACY_STORAGE_KEYS[key]].filter(Boolean)

  for (const storageKey of possibleKeys) {
    const storedValue = window.localStorage.getItem(storageKey)

    if (storedValue) {
      return storedValue
    }
  }

  return null
}

function migrateLegacyWorkspace(accountId) {
  if (!accountId) {
    return
  }

  try {
    const legacyOwner = window.localStorage.getItem(LEGACY_WORKSPACE_OWNER_KEY)

    if (legacyOwner && legacyOwner !== accountId) {
      return
    }

    const migrationKey = `quotely:${accountId}:legacy-migrated:${STORAGE_VERSION}`

    if (window.localStorage.getItem(migrationKey)) {
      return
    }

    const hasLegacyWorkspace = WORKSPACE_STORAGE_KEYS.some((key) => getLegacyStoredValue(key))

    if (!hasLegacyWorkspace) {
      window.localStorage.setItem(migrationKey, 'true')
      return
    }

    if (!legacyOwner) {
      window.localStorage.setItem(LEGACY_WORKSPACE_OWNER_KEY, accountId)
    }

    WORKSPACE_STORAGE_KEYS.forEach((key) => {
      const accountKey = getStorageKey(key, accountId)

      if (window.localStorage.getItem(accountKey)) {
        return
      }

      const legacyValue = getLegacyStoredValue(key)

      if (legacyValue) {
        window.localStorage.setItem(accountKey, legacyValue)
      }
    })

    window.localStorage.setItem(migrationKey, 'true')
  } catch {
    // localStorage can be unavailable in private browsing or quota-limited contexts.
  }
}

function usePersistedState(key, initialValue, accountId) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue, accountId))

  useEffect(() => {
    setValue(readStoredValue(key, initialValue, accountId))
  }, [accountId, initialValue, key])

  useEffect(() => {
    try {
      window.localStorage.setItem(getStorageKey(key, accountId), JSON.stringify(value))
    } catch {
      // localStorage can be unavailable in private browsing or quota-limited contexts.
    }
  }, [accountId, key, value])

  return [value, setValue]
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `quote-${Date.now()}`
}

function isValidEmail(value) {
  return emailPattern.test(String(value || '').trim())
}

function normalizeServiceTemplate(template) {
  return {
    id: template.id || createId(),
    name: String(template.name || '').trim(),
    description: String(template.description || '').trim(),
    price: normalizeMoney(template.price),
    updatedAt: new Date().toISOString(),
  }
}

function validateQuoteDraft(quote) {
  const errors = {}

  if (!quote.clientName.trim()) {
    errors.clientName = 'Add the client name before saving.'
  }

  if (!quote.clientEmail.trim()) {
    errors.clientEmail = 'Add the client email before saving.'
  } else if (!isValidEmail(quote.clientEmail)) {
    errors.clientEmail = 'Use a valid client email address.'
  }

  if (!quote.projectName.trim()) {
    errors.projectName = 'Add the project or event name.'
  }

  if (!quote.eventDate) {
    errors.eventDate = 'Choose the project or event date.'
  }

  if (!quote.location.trim()) {
    errors.location = 'Add the project location.'
  }

  if (!quote.packageType.trim()) {
    errors.packageType = 'Add a package or service name.'
  }

  if (normalizeMoney(quote.basePrice) <= 0) {
    errors.basePrice = 'Add a package price greater than zero.'
  }

  if (!splitLines(quote.servicesIncluded).length) {
    errors.servicesIncluded = 'Add at least one included deliverable.'
  }

  if (!quote.validityDate) {
    errors.validityDate = 'Choose an expiry date.'
  }

  if (!quote.paymentTerms.trim()) {
    errors.paymentTerms = 'Add payment terms for the client.'
  }

  return errors
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

function ToastViewport({ toast }) {
  if (!toast) {
    return null
  }

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <div className={`app-toast ${toast.type}`}>
        <strong>{toast.title}</strong>
        {toast.message && <span>{toast.message}</span>}
      </div>
    </div>
  )
}

function SecureWorkspace({ account, onLogout, showFeedback }) {
  const accountId = account?.id

  migrateLegacyWorkspace(accountId)

  const [quotes, setQuotes] = usePersistedState('quotes', initialQuotes, accountId)
  const [settings, setSettings] = usePersistedState(
    'brand-settings',
    defaultSettings,
    accountId,
  )
  const [serviceTemplates, setServiceTemplates] = usePersistedState(
    'service-templates',
    EMPTY_SERVICE_TEMPLATES,
    accountId,
  )
  const [profileImage, setProfileImage] = usePersistedState('profile-image', '', accountId)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedQuoteId, setSelectedQuoteId] = useState(null)
  const [quoteErrors, setQuoteErrors] = useState({})
  const settingsFeedbackRef = useRef(null)
  const [draftQuote, setDraftQuote] = useState(() =>
    createBlankQuote(nextQuoteNumber(quotes), settings),
  )

  const draftTotals = useMemo(() => calculateQuote(draftQuote), [draftQuote])
  const isEditing = Boolean(selectedQuoteId)

  const clearQuoteErrors = (fields) => {
    setQuoteErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      fields.forEach((field) => {
        delete nextErrors[field]
      })

      return nextErrors
    })
  }

  const updateDraftQuote = (nextQuote, changedFields = []) => {
    setDraftQuote(nextQuote)

    if (changedFields.length) {
      clearQuoteErrors(changedFields)
    }
  }

  useEffect(
    () => () => {
      if (settingsFeedbackRef.current) {
        window.clearTimeout(settingsFeedbackRef.current)
      }
    },
    [],
  )

  const startNewQuote = (nextQuotes = quotes, shouldNotify = true) => {
    setSelectedQuoteId(null)
    setDraftQuote(createBlankQuote(nextQuoteNumber(nextQuotes), settings))
    setQuoteErrors({})
    setActiveSection('create')

    if (shouldNotify) {
      showFeedback('New quote draft ready', 'Add the client, package, and terms when ready.')
    }
  }

  const saveQuote = () => {
    const validationErrors = validateQuoteDraft(draftQuote)

    if (Object.keys(validationErrors).length) {
      setQuoteErrors(validationErrors)
      setActiveSection('create')
      showFeedback(
        'Quotation needs a few details',
        Object.values(validationErrors)[0],
        'error',
      )
      return
    }

    const savedQuote = normalizeDraftForSave(draftQuote, selectedQuoteId, quotes)
    const wasEditing = Boolean(selectedQuoteId)

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
    setQuoteErrors({})
    setActiveSection('saved')
    showFeedback(
      wasEditing ? 'Quotation updated' : 'Quotation saved',
      `${savedQuote.quotationNumber} is saved and ready for follow-up.`,
    )
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
    const deletedQuote = quotes.find((quote) => quote.id === quoteId)
    const nextQuotes = quotes.filter((quote) => quote.id !== quoteId)
    setQuotes(nextQuotes)

    if (quoteId === selectedQuoteId) {
      setSelectedQuoteId(null)
      setDraftQuote(createBlankQuote(nextQuoteNumber(nextQuotes), settings))
    }

    showFeedback(
      'Quotation deleted',
      deletedQuote?.quotationNumber
        ? `${deletedQuote.quotationNumber} was removed from your workspace.`
        : 'The quotation was removed from your workspace.',
    )
  }

  const updateQuoteStatus = (quoteId, status) => {
    const updatedQuote = quotes.find((quote) => quote.id === quoteId)

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

    showFeedback(
      'Status updated',
      `${updatedQuote?.quotationNumber || 'Quotation'} is now marked ${status}.`,
    )
  }

  const updateSettings = (nextSettings) => {
    setSettings(nextSettings)
    if (settingsFeedbackRef.current) {
      window.clearTimeout(settingsFeedbackRef.current)
    }

    settingsFeedbackRef.current = window.setTimeout(() => {
      showFeedback('Business details saved', 'New previews now use your latest business information.')
    }, 650)
  }

  const downloadQuote = () => {
    downloadQuotationHtml(draftQuote, settings)
    showFeedback('Quotation downloaded', `${draftQuote.quotationNumber} was saved as an HTML file.`)
  }

  const printQuote = () => {
    showFeedback('Print dialog opening', 'Choose your print or PDF settings to finish.')
    window.print()
  }

  const saveServiceTemplate = (template) => {
    const nextTemplate = normalizeServiceTemplate(template)

    if (!nextTemplate.name) {
      showFeedback('Add a package name', 'Name this reusable package before saving.', 'error')
      return false
    }

    if (nextTemplate.price <= 0) {
      showFeedback('Add a package price', 'Use a package price greater than zero.', 'error')
      return false
    }

    if (!splitLines(nextTemplate.description).length) {
      showFeedback(
        'Add deliverables',
        'Add at least one deliverable line for this package.',
        'error',
      )
      return false
    }

    setServiceTemplates((currentTemplates) => {
      const exists = currentTemplates.some((item) => item.id === nextTemplate.id)

      if (exists) {
        return currentTemplates.map((item) =>
          item.id === nextTemplate.id ? nextTemplate : item,
        )
      }

      return [nextTemplate, ...currentTemplates]
    })

    showFeedback('Package saved', `${nextTemplate.name} is ready for new quotations.`)
    return true
  }

  const deleteServiceTemplate = (templateId) => {
    const deletedTemplate = serviceTemplates.find((item) => item.id === templateId)

    setServiceTemplates((currentTemplates) =>
      currentTemplates.filter((item) => item.id !== templateId),
    )
    showFeedback(
      'Package deleted',
      deletedTemplate?.name ? `${deletedTemplate.name} was removed.` : 'The package was removed.',
    )
  }

  const applyServiceTemplate = (templateId) => {
    const selectedTemplate = serviceTemplates.find((item) => item.id === templateId)

    if (!selectedTemplate) {
      return
    }

    updateDraftQuote(
      {
        ...draftQuote,
        packageType: selectedTemplate.name,
        basePrice: selectedTemplate.price,
        servicesIncluded: selectedTemplate.description,
      },
      ['packageType', 'basePrice', 'servicesIncluded'],
    )
    showFeedback('Package applied', `${selectedTemplate.name} was added to this quotation.`)
  }

  const updateProfileImage = (imageDataUrl) => {
    setProfileImage(imageDataUrl)
    showFeedback('Profile image updated', 'Your sidebar now uses this image.')
  }

  const removeProfileImage = () => {
    setProfileImage('')
    showFeedback('Profile image removed', 'Your account now uses the default profile mark.')
  }

  const renderSection = () => {
    if (activeSection === 'profile') {
      return (
        <Profile
          account={account}
          onFeedback={showFeedback}
          onLogout={onLogout}
          onProfileImageChange={updateProfileImage}
          onProfileImageRemove={removeProfileImage}
          profileImage={profileImage}
        />
      )
    }

    if (activeSection === 'saved') {
      return (
        <SavedQuotes
          quotes={quotes}
          onCreate={() => startNewQuote()}
          onDelete={deleteQuote}
          onDownload={(quote) => {
            downloadQuotationHtml(quote, settings)
            showFeedback('Quotation downloaded', `${quote.quotationNumber} was saved as an HTML file.`)
          }}
          onStatusChange={updateQuoteStatus}
          onView={viewQuote}
        />
      )
    }

    if (activeSection === 'services') {
      return (
        <ServiceLibrary
          onDelete={deleteServiceTemplate}
          onSave={saveServiceTemplate}
          services={serviceTemplates}
        />
      )
    }

    if (activeSection === 'settings') {
      return (
        <BrandSettings
          settings={settings}
          onChange={updateSettings}
          onFeedback={showFeedback}
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
              <p className="page-subtitle">
                Add the client, package, pricing, and terms before sending.
              </p>
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
              errors={quoteErrors}
              onApplyService={applyServiceTemplate}
              onChange={updateDraftQuote}
              onNew={() => startNewQuote()}
              onSave={saveQuote}
              isEditing={isEditing}
              serviceTemplates={serviceTemplates}
            />
            <QuotePreview
              quote={draftQuote}
              settings={settings}
              totals={draftTotals}
              onDownload={downloadQuote}
              onPrint={printQuote}
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
      profileImage={profileImage}
    >
      {renderSection()}
    </AppShell>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [authFieldErrors, setAuthFieldErrors] = useState({})
  const [authMessage, setAuthMessage] = useState('')
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [socialProviders, setSocialProviders] = useState({
    google: null,
    x: null,
  })

  const showFeedback = (title, message = '', type = 'success') => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }

    setToast({ message, title, type })
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
    }, 3200)
  }

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false)
      setAuthError('Sign-in is not ready yet.')
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
        showFeedback('Could not check your session', error.message, 'error')
      }

      setSession(data.session)
      setIsAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      setAuthFieldErrors({})
      setAuthMessage('')

      if (event === 'SIGNED_IN') {
        showFeedback('Signed in', 'Your quotation workspace is ready.')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSocialProviders({ google: false, x: false })
      return
    }

    let isMounted = true

    const loadAuthSettings = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        })

        if (!response.ok) {
          throw new Error('Could not check sign-in options.')
        }

        const settings = await response.json()
        const external = settings.external || {}

        if (isMounted) {
          setSocialProviders({
            google: Boolean(external.google),
            x: Boolean(external.x || external.twitter),
          })
        }
      } catch {
        if (isMounted) {
          setSocialProviders({ google: true, x: true })
        }
      }
    }

    loadAuthSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const handleEmailAuth = async ({ email, mode, name, password }) => {
    if (!supabase) {
      setAuthError('Sign-in is not ready yet.')
      showFeedback('Sign-in is not ready', 'Finish sign-in setup before launching Quotely.', 'error')
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    const fieldErrors = {}

    if (!trimmedEmail) {
      fieldErrors.email = 'Enter your email address.'
    } else if (!isValidEmail(trimmedEmail)) {
      fieldErrors.email = 'Use a valid email address.'
    }

    if (!password) {
      fieldErrors.password = 'Enter your password.'
    } else if (password.length < 8) {
      fieldErrors.password = 'Use at least 8 characters.'
    }

    if (mode === 'signup' && !trimmedName) {
      fieldErrors.name = 'Enter your name.'
    }

    if (Object.keys(fieldErrors).length) {
      const firstError = Object.values(fieldErrors)[0]
      setAuthFieldErrors(fieldErrors)
      setAuthError(firstError)
      showFeedback('Check the sign-in details', firstError, 'error')
      return
    }

    setAuthFieldErrors({})

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
      showFeedback('Sign-in failed', response.error.message, 'error')
      return
    }

    setAuthError('')
    setAuthFieldErrors({})
    setAuthMessage(
      mode === 'signup' && !response.data.session
        ? 'Check your email to confirm your Quotely account.'
        : '',
    )
    if (mode === 'signup' && !response.data.session) {
      showFeedback('Account created', 'Check your email to confirm your Quotely account.')
    }
  }

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setSession(null)
    setAuthError('')
    setAuthFieldErrors({})
    setAuthMessage('You have been logged out of Quotely.')
    showFeedback('Logged out', 'This browser no longer has access to your workspace.')
  }

  const handleSocialLogin = async (provider) => {
    if (!supabase) {
      setAuthError('Sign-in is not ready yet.')
      showFeedback('Sign-in is not ready', 'Finish sign-in setup before launching Quotely.', 'error')
      return
    }

    const providerName = provider === 'x' ? 'X' : 'Google'

    if (socialProviders[provider] === false) {
      setAuthError(`${providerName} sign-in is not available yet.`)
      showFeedback(
        `${providerName} sign-in unavailable`,
        'Use email sign-in for now or choose another available option.',
        'error',
      )
      return
    }

    showFeedback(`Opening ${providerName}`, 'Complete the secure sign-in to return to Quotely.')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setAuthError(error.message)
      showFeedback(`${providerName} sign-in failed`, error.message, 'error')
    }
  }

  if (isAuthLoading) {
    return (
      <>
        <main className="auth-page" aria-label="Loading Quotely">
          <section className="auth-panel">
            <div className="auth-mark-row">
              <span className="brand-mark" aria-hidden="true">
                <LogoMark />
              </span>
            </div>
            <div className="auth-copy">
              <h1>Opening Quotely</h1>
              <p>Checking whether this browser already has workspace access.</p>
            </div>
          </section>
        </main>
        <ToastViewport toast={toast} />
      </>
    )
  }

  if (!session) {
    return (
      <>
        <AuthScreen
          error={authError}
          fieldErrors={authFieldErrors}
          isConfigured={isSupabaseConfigured}
          message={authMessage}
          onFieldChange={(field) => {
            setAuthError('')
            setAuthMessage('')
            setAuthFieldErrors((currentErrors) => {
              const nextErrors = { ...currentErrors }
              delete nextErrors[field]
              return nextErrors
            })
          }}
          onEmailAuth={handleEmailAuth}
          onSocialLogin={handleSocialLogin}
          socialProviders={socialProviders}
        />
        <ToastViewport toast={toast} />
      </>
    )
  }

  return (
    <>
      <SecureWorkspace
        account={session.user}
        key={session.user.id}
        onLogout={logout}
        showFeedback={showFeedback}
      />
      <ToastViewport toast={toast} />
    </>
  )
}

export default App
