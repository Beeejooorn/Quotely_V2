import { Building2, Palette } from 'lucide-react'
import QuotePreview from './QuotePreview.jsx'

export default function BrandSettings({ onChange, quote, settings, totals }) {
  const updateSetting = (field, value) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <section className="settings-page" aria-labelledby="settings-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Brand settings</p>
          <h1 id="settings-heading">Business details</h1>
          <p className="page-subtitle">
            Keep your company details and quote accent aligned before sending proposals.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <form className="settings-panel">
          <div className="settings-panel-top">
            <div className="settings-icon" aria-hidden="true">
              <Building2 />
            </div>
            <div>
              <h2>Business profile</h2>
              <p>These fields appear in the preview, print view, and downloaded HTML quote.</p>
            </div>
          </div>

          <div className="settings-accent-card">
            <div>
              <span>Current accent</span>
              <strong>{settings.accentColor}</strong>
            </div>
            <div
              className="settings-accent-swatch"
              aria-hidden="true"
              style={{ backgroundColor: settings.accentColor }}
            />
          </div>

          <div className="form-grid">
            <label className="field span-2">
              <span>Business name</span>
              <input
                value={settings.businessName}
                onChange={(event) => updateSetting('businessName', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(event) => updateSetting('businessEmail', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={settings.businessPhone}
                onChange={(event) => updateSetting('businessPhone', event.target.value)}
              />
            </label>
            <label className="field span-2">
              <span>Address</span>
              <input
                value={settings.businessAddress}
                onChange={(event) => updateSetting('businessAddress', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Accent color</span>
              <span className="color-row">
                <input
                  aria-label="Accent color"
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) => updateSetting('accentColor', event.target.value)}
                />
                <input
                  value={settings.accentColor}
                  onChange={(event) => updateSetting('accentColor', event.target.value)}
                />
              </span>
              <small className="field-hint">
                <Palette aria-hidden="true" />
                Used on buttons, quotation IDs, and key totals.
              </small>
            </label>
          </div>
        </form>

        <QuotePreview
          quote={quote}
          settings={settings}
          totals={totals}
          onDownload={() => {}}
          onPrint={() => {}}
        />
      </div>
    </section>
  )
}
