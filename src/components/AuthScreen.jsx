import { LogIn, Mail, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import LogoMark from './LogoMark.jsx'

export default function AuthScreen({
  error,
  fieldErrors = {},
  isConfigured,
  message,
  onEmailAuth,
  onFieldChange,
  onSocialLogin,
  socialProviders = {},
}) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
  })
  const isSignUp = mode === 'signup'
  const configMessage = !isConfigured ? 'Connect Supabase to enable live sign-in.' : ''
  const formError = isConfigured ? error : ''
  const isCheckingSocialProviders =
    isConfigured && (socialProviders.google === null || socialProviders.x === null)
  const disabledSocialProviders = [
    socialProviders.google === false ? 'Google' : '',
    socialProviders.x === false ? 'X' : '',
  ].filter(Boolean)
  const socialSetupMessage = isCheckingSocialProviders
    ? 'Checking social sign-in setup.'
    : disabledSocialProviders.length
      ? `Enable ${disabledSocialProviders.join(' and ')} in Supabase Auth providers to use social sign-in.`
      : ''

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    onFieldChange?.(field)
  }

  const toggleMode = () => {
    setMode(isSignUp ? 'login' : 'signup')
    onFieldChange?.('name')
    onFieldChange?.('email')
    onFieldChange?.('password')
  }

  const submitForm = async (event) => {
    event.preventDefault()
    await onEmailAuth({ ...form, mode })
  }

  return (
    <main className="auth-page" aria-labelledby="auth-heading">
      <section className="auth-panel">
        <div className="auth-mark-row">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark />
          </span>
        </div>

        <div className="auth-copy">
          <h1 id="auth-heading">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {isSignUp ? 'Create access for your quote workspace.' : 'Log in to open your quote workspace.'}
          </p>
          <button className="auth-mode-button" type="button" onClick={toggleMode}>
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <form className="auth-form" onSubmit={submitForm}>
          {isSignUp && (
            <label className="field">
              <span>Name</span>
              <input
                aria-invalid={Boolean(fieldErrors.name)}
                className={fieldErrors.name ? 'is-invalid' : undefined}
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Workspace owner"
              />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <span className="auth-input-wrap">
              <Mail aria-hidden="true" />
              <input
                aria-invalid={Boolean(fieldErrors.email)}
                className={fieldErrors.email ? 'is-invalid' : undefined}
                autoComplete="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="Email address"
              />
            </span>
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <span className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" />
              <input
                aria-invalid={Boolean(fieldErrors.password)}
                className={fieldErrors.password ? 'is-invalid' : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder={isSignUp ? 'Create password' : 'Password'}
              />
            </span>
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </label>

          {formError && <p className="auth-error">{formError}</p>}
          {configMessage && <p className="auth-config-message">{configMessage}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button className="button primary auth-submit" disabled={!isConfigured} type="submit">
            <LogIn aria-hidden="true" />
            {isSignUp ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <strong>or</strong>
          <span />
        </div>

        <div className="social-login-grid" aria-label="Other sign in options">
          <button
            className="social-login-button"
            disabled={!isConfigured || socialProviders.google !== true}
            type="button"
            onClick={() => onSocialLogin('google')}
          >
            <span className="google-mark" aria-hidden="true" />
            Google
          </button>
          <button
            className="social-login-button"
            disabled={!isConfigured || socialProviders.x !== true}
            type="button"
            onClick={() => onSocialLogin('x')}
          >
            <span className="x-mark" aria-hidden="true" />
            X
          </button>
        </div>
        {socialSetupMessage && <p className="auth-social-note">{socialSetupMessage}</p>}
      </section>
    </main>
  )
}
