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
  clearAuthSessionStorage,
  getAuthRedirectUrl,
  isSupabaseConfigured,
  setAuthPersistence,
  shouldPersistAuthSession,
  supabase,
  supabaseKey,
  supabaseUrl,
} from './lib/supabaseClient.js'
import {
  deleteWorkspaceQuotation,
  deleteWorkspaceServiceTemplate,
  loadWorkspaceData,
  saveWorkspaceProfileImage,
  saveWorkspaceQuotations,
  saveWorkspaceServiceTemplates,
  saveWorkspaceSettings,
} from './lib/workspaceData.js'
import {
  calculateQuote,
  createBlankQuote,
  downloadQuotationPdf,
  formatMoney,
  nextQuoteNumber,
  normalizeMoney,
  normalizeCurrency,
  normalizeRate,
  splitLines,
} from './utils/quotation.js'
import './App.css'

const STORAGE_VERSION = 'v2'
const EMPTY_SERVICE_TEMPLATES = []
const SECTION_IDS = ['dashboard', 'create', 'saved', 'services', 'settings', 'profile']

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getStorageKey(key, accountId) {
  return accountId
    ? `quotely:${accountId}:${key}:${STORAGE_VERSION}`
    : `quotely:${key}:${STORAGE_VERSION}`
}

function normalizeStoredValue(key, value, fallback) {
  if (key === 'quotes' && Array.isArray(value)) {
    return value.filter((quote) => !String(quote.id || '').startsWith('seed-'))
  }

  if (key === 'service-templates' && Array.isArray(value)) {
    return value
  }

  if (key === 'active-section') {
    return SECTION_IDS.includes(value) ? value : fallback
  }

  if (
    key === 'brand-settings'
    && ['#0f9f82', '#2927e8'].includes(String(value?.accentColor || '').toLowerCase())
  ) {
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

  if ((quote.taxMode || 'none') !== 'none' && normalizeRate(quote.taxRate) <= 0) {
    errors.taxRate = 'Add a tax rate or set tax to no tax.'
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
    currency: normalizeCurrency(draft.currency),
    taxMode: draft.taxMode === 'exclusive' ? 'exclusive' : 'none',
    taxLabel: String(draft.taxLabel || 'VAT').trim() || 'VAT',
    taxRate: normalizeRate(draft.taxRate),
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
  const [activeSection, setActiveSection] = usePersistedState(
    'active-section',
    'dashboard',
    accountId,
  )
  const [builderView, setBuilderView] = useState('edit')
  const [selectedQuoteId, setSelectedQuoteId] = useState(null)
  const [quoteErrors, setQuoteErrors] = useState({})
  const [isRemoteWorkspaceReady, setIsRemoteWorkspaceReady] = useState(false)
  const settingsFeedbackRef = useRef(null)
  const remoteSyncFeedbackRef = useRef(false)
  const showFeedbackRef = useRef(showFeedback)
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

  const handleBuilderTabsKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return
    }

    event.preventDefault()

    if (event.key === 'Home') {
      setBuilderView('edit')
      return
    }

    if (event.key === 'End') {
      setBuilderView('preview')
      return
    }

    setBuilderView((currentView) => (currentView === 'edit' ? 'preview' : 'edit'))
  }

  useEffect(
    () => () => {
      if (settingsFeedbackRef.current) {
        window.clearTimeout(settingsFeedbackRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    showFeedbackRef.current = showFeedback
  }, [showFeedback])

  useEffect(() => {
    if (!accountId || !supabase) {
      setIsRemoteWorkspaceReady(false)
      return undefined
    }

    let isMounted = true

    const hydrateWorkspace = async () => {
      setIsRemoteWorkspaceReady(false)

      const localQuotes = readStoredValue('quotes', initialQuotes, accountId)
      const localSettings = readStoredValue('brand-settings', defaultSettings, accountId)
      const localServices = readStoredValue(
        'service-templates',
        EMPTY_SERVICE_TEMPLATES,
        accountId,
      )
      const localProfileImage = readStoredValue('profile-image', '', accountId)

      try {
        const remoteWorkspace = await loadWorkspaceData(accountId)

        if (!isMounted) {
          return
        }

        const shouldMigrateSettings =
          !remoteWorkspace.settings
          && JSON.stringify(localSettings) !== JSON.stringify(defaultSettings)

        const shouldMigrateProfileImage =
          remoteWorkspace.profileImage === null && Boolean(localProfileImage)

        setQuotes(remoteWorkspace.quotes.length ? remoteWorkspace.quotes : localQuotes)
        setServiceTemplates(
          remoteWorkspace.serviceTemplates.length
            ? remoteWorkspace.serviceTemplates
            : localServices,
        )
        setSettings(remoteWorkspace.settings || localSettings)
        setProfileImage(remoteWorkspace.profileImage ?? localProfileImage)

        await Promise.all([
          remoteWorkspace.quotes.length || !localQuotes.length
            ? Promise.resolve()
            : saveWorkspaceQuotations(accountId, localQuotes),
          remoteWorkspace.serviceTemplates.length || !localServices.length
            ? Promise.resolve()
            : saveWorkspaceServiceTemplates(accountId, localServices),
          shouldMigrateSettings
            ? saveWorkspaceSettings(accountId, localSettings)
            : Promise.resolve(),
          shouldMigrateProfileImage
            ? saveWorkspaceProfileImage(accountId, localProfileImage)
            : Promise.resolve(),
        ])

        if (isMounted) {
          setIsRemoteWorkspaceReady(true)
          remoteSyncFeedbackRef.current = false
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setQuotes(localQuotes)
        setServiceTemplates(localServices)
        setSettings(localSettings)
        setProfileImage(localProfileImage)
        setIsRemoteWorkspaceReady(false)
        showFeedbackRef.current(
          'Database setup needed',
          error?.message || 'Create the Quotely Supabase tables to save data online.',
          'error',
        )
      }
    }

    hydrateWorkspace()

    return () => {
      isMounted = false
    }
  }, [accountId, setProfileImage, setQuotes, setServiceTemplates, setSettings])

  const showRemoteSyncError = (error) => {
    if (remoteSyncFeedbackRef.current) {
      return
    }

    remoteSyncFeedbackRef.current = true
    showFeedbackRef.current(
      'Could not save online',
      error?.message || 'Your changes remain in this browser until Supabase is ready.',
      'error',
    )
  }

  useEffect(() => {
    if (!accountId || !isRemoteWorkspaceReady) {
      return undefined
    }

    const syncTimeout = window.setTimeout(() => {
      saveWorkspaceQuotations(accountId, quotes).catch(showRemoteSyncError)
    }, 450)

    return () => window.clearTimeout(syncTimeout)
  }, [accountId, isRemoteWorkspaceReady, quotes])

  useEffect(() => {
    if (!accountId || !isRemoteWorkspaceReady) {
      return undefined
    }

    const syncTimeout = window.setTimeout(() => {
      saveWorkspaceServiceTemplates(accountId, serviceTemplates).catch(showRemoteSyncError)
    }, 450)

    return () => window.clearTimeout(syncTimeout)
  }, [accountId, isRemoteWorkspaceReady, serviceTemplates])

  useEffect(() => {
    if (!accountId || !isRemoteWorkspaceReady) {
      return undefined
    }

    const syncTimeout = window.setTimeout(() => {
      saveWorkspaceSettings(accountId, settings).catch(showRemoteSyncError)
    }, 650)

    return () => window.clearTimeout(syncTimeout)
  }, [accountId, isRemoteWorkspaceReady, settings])

  useEffect(() => {
    if (!accountId || !isRemoteWorkspaceReady) {
      return undefined
    }

    const syncTimeout = window.setTimeout(() => {
      saveWorkspaceProfileImage(accountId, profileImage).catch(showRemoteSyncError)
    }, 450)

    return () => window.clearTimeout(syncTimeout)
  }, [accountId, isRemoteWorkspaceReady, profileImage])

  const startNewQuote = (nextQuotes = quotes, shouldNotify = true) => {
    setSelectedQuoteId(null)
    setDraftQuote(createBlankQuote(nextQuoteNumber(nextQuotes), settings))
    setQuoteErrors({})
    setBuilderView('edit')
    setActiveSection('create')

    if (shouldNotify) {
      showFeedback('New quote draft ready', 'Add the client, package, and terms when ready.')
    }
  }

  const saveQuote = () => {
    const validationErrors = validateQuoteDraft(draftQuote)

    if (Object.keys(validationErrors).length) {
      setQuoteErrors(validationErrors)
      setBuilderView('edit')
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
      currency: normalizeCurrency(quote.currency),
      taxMode: quote.taxMode === 'exclusive' ? 'exclusive' : 'none',
      taxLabel: quote.taxLabel || 'VAT',
      taxRate: normalizeRate(quote.taxRate),
    })
    setBuilderView('edit')
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

    if (isRemoteWorkspaceReady) {
      deleteWorkspaceQuotation(accountId, quoteId).catch(showRemoteSyncError)
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

  const downloadQuotePdf = async (quote) => {
    try {
      await downloadQuotationPdf(quote, settings)
      showFeedback('Quotation downloaded', `${quote.quotationNumber} was saved as a PDF file.`)
    } catch (error) {
      showFeedback(
        'Download failed',
        error?.message || 'Could not create the quotation PDF. Try printing to PDF instead.',
        'error',
      )
    }
  }

  const downloadQuote = () => {
    downloadQuotePdf(draftQuote)
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

    if (isRemoteWorkspaceReady) {
      deleteWorkspaceServiceTemplate(accountId, templateId).catch(showRemoteSyncError)
    }

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
            downloadQuotePdf(quote)
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
            <div className="heading-actions quote-heading-actions">
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

          <div className="builder-view-switcher" aria-label="Quotation workspace view">
            <div
              className="builder-tabs"
              role="tablist"
              aria-label="Create quotation sections"
              onKeyDown={handleBuilderTabsKeyDown}
            >
              <button
                className={builderView === 'edit' ? 'active' : ''}
                type="button"
                role="tab"
                id="quote-edit-tab"
                aria-selected={builderView === 'edit'}
                aria-controls="quote-edit-panel"
                tabIndex={builderView === 'edit' ? 0 : -1}
                onClick={() => setBuilderView('edit')}
              >
                Edit details
              </button>
              <button
                className={builderView === 'preview' ? 'active' : ''}
                type="button"
                role="tab"
                id="quote-preview-tab"
                aria-selected={builderView === 'preview'}
                aria-controls="quote-preview-panel"
                tabIndex={builderView === 'preview' ? 0 : -1}
                onClick={() => setBuilderView('preview')}
              >
                Preview quotation
              </button>
            </div>
            <span className="builder-tabs-total">
              Total: {formatMoney(draftTotals.total, draftQuote.currency)}
            </span>
          </div>

          <div className={`quote-workspace is-${builderView}-view`}>
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
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('')
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
      setPendingConfirmationEmail('')

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

  const handleEmailAuth = async ({
    confirmPassword = '',
    email,
    keepSignedIn = true,
    mode,
    name,
    password,
  }) => {
    if (!supabase) {
      setAuthError('Sign-in is not ready yet.')
      showFeedback('Sign-in is not ready', 'Finish sign-in setup before launching Quotely.', 'error')
      return
    }

    setAuthPersistence(keepSignedIn)

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

    if (mode === 'signup') {
      if (!confirmPassword) {
        fieldErrors.confirmPassword = 'Confirm your password.'
      } else if (password && confirmPassword !== password) {
        fieldErrors.confirmPassword = 'Passwords do not match.'
      }
    }

    if (Object.keys(fieldErrors).length) {
      const firstError = Object.values(fieldErrors)[0]
      setAuthFieldErrors(fieldErrors)
      setAuthError(firstError)
      showFeedback('Check the sign-in details', firstError, 'error')
      return
    }

    setAuthFieldErrors({})
    setPendingConfirmationEmail('')

    const response =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: { full_name: trimmedName },
              emailRedirectTo: getAuthRedirectUrl(),
            },
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })

    if (response.error) {
      setAuthError(response.error.message)
      setPendingConfirmationEmail('')
      showFeedback('Sign-in failed', response.error.message, 'error')
      return
    }

    const identities = response.data.user?.identities
    const mayAlreadyHaveAccount =
      mode === 'signup' && !response.data.session && Array.isArray(identities) && identities.length === 0

    if (mayAlreadyHaveAccount) {
      const existingAccountMessage =
        'This email may already have a Quotely account. Log in or use Google sign-in instead.'

      setAuthError(existingAccountMessage)
      setAuthFieldErrors({ email: existingAccountMessage })
      setPendingConfirmationEmail('')
      setAuthMessage('')
      showFeedback('Account may already exist', existingAccountMessage, 'error')
      return
    }

    setAuthError('')
    setAuthFieldErrors({})
    setAuthMessage(
      mode === 'signup' && !response.data.session
        ? 'Check your inbox, spam, and promotions folders to confirm your Quotely account.'
        : '',
    )
    if (mode === 'signup' && !response.data.session) {
      setPendingConfirmationEmail(trimmedEmail)
      showFeedback('Account created', 'Check your inbox, spam, and promotions folders for the confirmation email.')
    } else {
      setPendingConfirmationEmail('')
    }
  }

  const resendConfirmationEmail = async (email) => {
    if (!supabase) {
      setAuthError('Sign-in is not ready yet.')
      showFeedback('Sign-in is not ready', 'Finish sign-in setup before launching Quotely.', 'error')
      return
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!isValidEmail(trimmedEmail)) {
      setAuthError('Use a valid email address before resending confirmation.')
      showFeedback('Check the email address', 'Use a valid email address before resending confirmation.', 'error')
      return
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmedEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    if (error) {
      setAuthError(error.message)
      showFeedback('Could not resend confirmation', error.message, 'error')
      return
    }

    setAuthError('')
    setAuthMessage(
      'Confirmation email requested. If it still does not arrive, this email may already be confirmed or registered.',
    )
    showFeedback(
      'Confirmation email requested',
      'Check your inbox, spam, and promotions folders. If nothing arrives, try logging in or use Google sign-in.',
    )
  }

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()

      if (error) {
        showFeedback('Session ended locally', 'Could not reach the sign-out server, so this browser was cleared.', 'error')
      }
    }

    clearAuthSessionStorage()
    setSession(null)
    setAuthError('')
    setAuthFieldErrors({})
    setPendingConfirmationEmail('')
    setAuthMessage("Signed out. Log in again when you're ready.")
    showFeedback('Logged out', 'This browser no longer has access to your workspace.')
  }

  const handleSocialLogin = async (provider, keepSignedIn = true) => {
    if (!supabase) {
      setAuthError('Sign-in is not ready yet.')
      showFeedback('Sign-in is not ready', 'Finish sign-in setup before launching Quotely.', 'error')
      return
    }

    setAuthPersistence(keepSignedIn)

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
        redirectTo: getAuthRedirectUrl(),
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
          defaultKeepSignedIn={shouldPersistAuthSession()}
          recentlySignedOut={authMessage.startsWith('Signed out.')}
          onFieldChange={(field) => {
            setAuthError('')
            setAuthMessage('')
            if (field === 'email') {
              setPendingConfirmationEmail('')
            }
            setAuthFieldErrors((currentErrors) => {
              const nextErrors = { ...currentErrors }
              delete nextErrors[field]
              return nextErrors
            })
          }}
          onEmailAuth={handleEmailAuth}
          onResendConfirmation={resendConfirmationEmail}
          onSocialLogin={handleSocialLogin}
          pendingConfirmationEmail={pendingConfirmationEmail}
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
