import { Clock3, FileText, LogIn, Mail, LockKeyhole, Users } from 'lucide-react'
import { useState } from 'react'
import LogoMark from './LogoMark.jsx'

export default function AuthScreen({
  defaultKeepSignedIn = true,
  error,
  fieldErrors = {},
  isConfigured,
  message,
  onEmailAuth,
  onFieldChange,
  onResendConfirmation,
  onSocialLogin,
  pendingConfirmationEmail = '',
  recentlySignedOut = false,
  socialProviders = {},
}) {
  const [mode, setMode] = useState('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [form, setForm] = useState({
    email: '',
    keepSignedIn: defaultKeepSignedIn,
    name: '',
    password: '',
    confirmPassword: '',
  })
  const isSignUp = mode === 'signup'
  const configMessage = !isConfigured ? 'Sign-in is not ready yet.' : ''
  const formError = isConfigured ? error : ''
  const isCheckingSocialProviders =
    isConfigured && (socialProviders.google === null || socialProviders.x === null)
  const shouldShowGoogle = isConfigured && socialProviders.google !== false
  const shouldShowX = isConfigured && socialProviders.x === true
  const hasSocialOptions = shouldShowGoogle || shouldShowX
  const socialSetupMessage = isCheckingSocialProviders
    ? 'Checking available sign-in options...'
    : isConfigured && socialProviders.google === false
      ? 'Google sign-in is not available for this workspace yet.'
      : ''
  const authTitle = isSignUp
    ? 'Create your Quotely account'
    : recentlySignedOut
      ? 'Welcome back to Quotely'
      : 'Start your Quotely workspace'
  const authSubtitle = isSignUp
    ? 'Create a private workspace for quotations, clients, and reusable packages.'
    : recentlySignedOut
      ? 'Manage quotations, clients, and follow-ups in one focused workspace.'
      : 'Set up a focused place for quotations, clients, and follow-ups.'

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    onFieldChange?.(field)
  }

  const toggleMode = () => {
    setMode(isSignUp ? 'login' : 'signup')
    onFieldChange?.('name')
    onFieldChange?.('email')
    onFieldChange?.('password')
    onFieldChange?.('confirmPassword')
  }

  const submitForm = async (event) => {
    event.preventDefault()
    if (isSubmitting || !isConfigured) {
      return
    }

    setIsSubmitting(true)
    try {
      await onEmailAuth({ ...form, mode })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendConfirmation = async () => {
    if (isResending || !pendingConfirmationEmail || !onResendConfirmation) {
      return
    }

    setIsResending(true)
    try {
      await onResendConfirmation(pendingConfirmationEmail)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="auth-page" aria-labelledby="auth-heading">
      <section className="auth-panel">
        <div className="auth-mark-row">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark />
          </span>
          <span>Quote workspace</span>
        </div>

        <div className="auth-copy">
          <h1 id="auth-heading">{authTitle}</h1>
          <p>{authSubtitle}</p>
        </div>

        <div className="auth-product-row" aria-label="Quotely workspace tools">
          <span>
            <FileText aria-hidden="true" />
            Quotations
          </span>
          <span>
            <Users aria-hidden="true" />
            Clients
          </span>
          <span>
            <Clock3 aria-hidden="true" />
            Follow-ups
          </span>
        </div>

        <form className="auth-form" aria-busy={isSubmitting} noValidate onSubmit={submitForm}>
          {isSignUp && (
            <label className="field">
              <span>Name</span>
              <input
                aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined}
                aria-invalid={Boolean(fieldErrors.name)}
                className={fieldErrors.name ? 'is-invalid' : undefined}
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Your name"
              />
              {fieldErrors.name && (
                <small className="field-error" id="auth-name-error">
                  {fieldErrors.name}
                </small>
              )}
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <span className="auth-input-wrap">
              <Mail aria-hidden="true" />
              <input
                aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                aria-invalid={Boolean(fieldErrors.email)}
                className={fieldErrors.email ? 'is-invalid' : undefined}
                autoComplete="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="Email address"
              />
            </span>
            {fieldErrors.email && (
              <small className="field-error" id="auth-email-error">
                {fieldErrors.email}
              </small>
            )}
          </label>

          <label className="field">
            <span>Password</span>
            <span className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" />
              <input
                aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                className={fieldErrors.password ? 'is-invalid' : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder={isSignUp ? 'Create password' : 'Password'}
              />
            </span>
            {fieldErrors.password && (
              <small className="field-error" id="auth-password-error">
                {fieldErrors.password}
              </small>
            )}
          </label>

          {isSignUp && (
            <label className="field">
              <span>Confirm password</span>
              <span className="auth-input-wrap">
                <LockKeyhole aria-hidden="true" />
                <input
                  aria-describedby={fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  className={fieldErrors.confirmPassword ? 'is-invalid' : undefined}
                  autoComplete="new-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="Re-enter password"
                />
              </span>
              {fieldErrors.confirmPassword && (
                <small className="field-error" id="auth-confirm-password-error">
                  {fieldErrors.confirmPassword}
                </small>
              )}
            </label>
          )}

          {formError && <p className="auth-error">{formError}</p>}
          {configMessage && <p className="auth-config-message">{configMessage}</p>}
          {message && <p className="auth-message">{message}</p>}
          {pendingConfirmationEmail && isSignUp && (
            <div className="auth-resend">
              <span>No email yet?</span>
              <button
                className="auth-mode-button"
                disabled={isSubmitting || isResending}
                type="button"
                onClick={resendConfirmation}
              >
                {isResending ? 'Sending...' : 'Resend confirmation email'}
              </button>
            </div>
          )}

          <label className="auth-remember">
            <input
              checked={form.keepSignedIn}
              type="checkbox"
              onChange={(event) => updateField('keepSignedIn', event.target.checked)}
            />
            <span>
              <strong>Keep me signed in</strong>
              <small>Use this on devices you trust.</small>
            </span>
          </label>

          <button
            className="button primary auth-submit"
            disabled={!isConfigured || isSubmitting}
            type="submit"
          >
            <LogIn aria-hidden="true" />
            {isSubmitting
              ? isSignUp
                ? 'Creating account...'
                : 'Logging in...'
              : isSignUp
                ? 'Create account'
                : 'Log in to workspace'}
          </button>
        </form>

        {hasSocialOptions && (
          <>
            <div className="auth-divider">
              <span />
              <strong>or</strong>
              <span />
            </div>
            <div className="social-login-grid" aria-label="Other sign in options">
              {shouldShowGoogle && (
                <button
                  className="social-login-button"
                  disabled={isSubmitting || socialProviders.google !== true}
                  type="button"
                  onClick={() => onSocialLogin('google', form.keepSignedIn)}
                >
                  <span className="google-mark" aria-hidden="true" />
                  Sign in with Google
                </button>
              )}
              {shouldShowX && (
                <button
                  className="social-login-button"
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => onSocialLogin('x', form.keepSignedIn)}
                >
                  <span className="x-mark" aria-hidden="true" />
                  Sign in with X
                </button>
              )}
            </div>
          </>
        )}
        {socialSetupMessage && <p className="auth-social-note">{socialSetupMessage}</p>}
        <div className="auth-secondary-action">
          <span>{isSignUp ? 'Already have an account?' : 'New to Quotely?'}</span>
          <button className="auth-mode-button" type="button" onClick={toggleMode}>
            {isSignUp ? 'Log in' : 'Create an account'}
          </button>
        </div>
      </section>
    </main>
  )
}
