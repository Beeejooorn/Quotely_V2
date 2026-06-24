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
          <h1 id="settings-heading">Business details used on quotes.</h1>
        </div>
      </div>

      <div className="settings-grid">
        <form className="settings-panel">
          <h2>Business profile</h2>
          <p>These fields appear in the preview, print view, and downloaded HTML quote.</p>

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
