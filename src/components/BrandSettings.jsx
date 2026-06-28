import {
  BadgeCheck,
  Building2,
  Clock3,
  CreditCard,
  FileText,
  ImagePlus,
  Info,
  ReceiptText,
  Trash2,
} from 'lucide-react'

const maxBusinessLogoSize = 1024 * 1024

function settingValue(value, fallback = 'Not set') {
  return String(value || '').trim() || fallback
}

function BusinessDocumentPreview({ settings }) {
  const businessName = settingValue(settings.businessName, 'Your business name')
  const businessEmail = settingValue(settings.businessEmail, 'Email not set')
  const businessPhone = settingValue(settings.businessPhone, 'Phone not set')
  const businessAddress = settingValue(settings.businessAddress, 'Address not set')
  const registrationNumber = settingValue(settings.registrationNumber, 'Not included')
  const paymentMethod = settingValue(settings.paymentMethod, 'Payment method not set')
  const paymentDetails = settingValue(settings.paymentDetails, 'Payment details not set')
  const defaultPaymentTerms = settingValue(
    settings.defaultPaymentTerms,
    'Default payment note not set',
  )
  const validityDays = Number(settings.defaultValidityDays || 14)
  const footerContact = [settings.businessEmail, settings.businessPhone].filter(Boolean).join(' | ')

  return (
    <aside className="business-preview-panel" aria-labelledby="business-preview-heading">
      <div className="preview-actions">
        <div>
          <strong id="business-preview-heading">Business document preview</strong>
          <span>Preview how your business details appear on client-ready quotations.</span>
        </div>
      </div>

      <article className="business-document-sample">
        <header className="business-document-header">
          <div className="business-document-brand">
            <span className="business-document-logo" aria-hidden="true">
              {settings.businessLogo ? <img alt="" src={settings.businessLogo} /> : <Building2 />}
            </span>
            <div>
              <span>Quotation prepared by</span>
              <h2>{businessName}</h2>
              <p>{businessEmail}</p>
              <p>{[settings.businessPhone, settings.businessAddress].filter(Boolean).join(' | ') || 'Phone and address not set'}</p>
              {settings.registrationNumber && <p>{settings.registrationNumber}</p>}
            </div>
          </div>
          <div className="business-document-mark">
            <span>Document identity</span>
            <strong>Ready for quotations</strong>
          </div>
        </header>

        <div className="business-preview-note">
          <Info aria-hidden="true" />
          <span>These details will appear on generated quotations.</span>
        </div>

        <section className="business-preview-section">
          <h3>Business identity</h3>
          <dl className="business-preview-grid">
            <div>
              <dt>Business name</dt>
              <dd>{businessName}</dd>
            </div>
            <div>
              <dt>Contact email</dt>
              <dd>{businessEmail}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{businessPhone}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{businessAddress}</dd>
            </div>
            <div className="span-2">
              <dt>Registration / tax number</dt>
              <dd>{registrationNumber}</dd>
            </div>
          </dl>
        </section>

        <section className="business-preview-section">
          <h3>Payment defaults</h3>
          <div className="business-preview-stack">
            <div>
              <span>Preferred payment method</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div>
              <span>Payment details</span>
              <p>{paymentDetails}</p>
            </div>
            <div>
              <span>Default payment note</span>
              <p>{defaultPaymentTerms}</p>
            </div>
          </div>
        </section>

        <section className="business-preview-section business-preview-defaults">
          <div>
            <h3>Quotation defaults</h3>
            <p>New quotations will use this expiry window by default.</p>
          </div>
          <strong>{validityDays || 14} days</strong>
        </section>

        <footer className="business-preview-footer">
          <span>Footer preview</span>
          <p>Thank you for considering {businessName} for this work.</p>
          {footerContact && <small>{footerContact}</small>}
        </footer>
      </article>
    </aside>
  )
}

export default function BrandSettings({ onChange, onFeedback, settings }) {
  const updateSetting = (field, value) => {
    onChange({ ...settings, [field]: value })
  }

  const readinessItems = [
    {
      icon: ImagePlus,
      label: 'Logo',
      value: settings.businessLogo ? 'Added' : 'Optional',
    },
    {
      icon: ReceiptText,
      label: 'Registration',
      value: settings.registrationNumber ? 'Included' : 'Not set',
    },
    {
      icon: CreditCard,
      label: 'Payment',
      value: settings.paymentDetails || settings.paymentMethod ? 'Ready' : 'Not set',
    },
    {
      icon: Clock3,
      label: 'Expiry',
      value: `${settings.defaultValidityDays || 14} days`,
    },
  ]

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      onFeedback?.('Logo file needed', 'Choose an image file for your business logo.', 'error')
      return
    }

    if (file.size > maxBusinessLogoSize) {
      onFeedback?.('Logo is too large', 'Choose a logo image under 1 MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        updateSetting('businessLogo', reader.result)
      }
    })
    reader.readAsDataURL(file)
  }

  return (
    <section className="settings-page" aria-labelledby="settings-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Business settings</p>
          <h1 id="settings-heading">Business details</h1>
          <p className="page-subtitle">
            Set your business details once and keep every quotation client-ready.
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
              <p>These details appear on client-facing quotation documents.</p>
            </div>
          </div>

          <div className="settings-form-stack">
            <div className="business-logo-field span-2">
              <span className="business-logo-preview" aria-hidden="true">
                {settings.businessLogo ? (
                  <img alt="" src={settings.businessLogo} />
                ) : (
                  <Building2 />
                )}
              </span>
              <div>
                <strong>Business logo</strong>
                <p>Add a logo to make exported quotations feel more official.</p>
              </div>
              <div className="business-logo-actions">
                <label className="button secondary profile-image-button">
                  <ImagePlus aria-hidden="true" />
                  Choose logo
                  <input accept="image/*" type="file" onChange={handleLogoUpload} />
                </label>
                {settings.businessLogo && (
                  <button
                    className="icon-button danger"
                    aria-label="Remove business logo"
                    type="button"
                    title="Remove business logo"
                    onClick={() => updateSetting('businessLogo', '')}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <section className="settings-form-section" aria-labelledby="identity-heading">
              <div className="settings-section-heading">
                <FileText aria-hidden="true" />
                <div>
                  <h3 id="identity-heading">Identity and contact</h3>
                  <p>Shown in the document header so clients know who prepared the quotation.</p>
                </div>
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
                <label className="field span-2">
                  <span>Tax or registration number</span>
                  <input
                    value={settings.registrationNumber || ''}
                    onChange={(event) => updateSetting('registrationNumber', event.target.value)}
                    placeholder="Optional"
                  />
                  <small className="field-help">
                    Leave blank if this does not need to appear on client quotations.
                  </small>
                </label>
              </div>
            </section>

            <section className="settings-form-section" aria-labelledby="payment-heading">
              <div className="settings-section-heading">
                <CreditCard aria-hidden="true" />
                <div>
                  <h3 id="payment-heading">Payment defaults</h3>
                  <p>Saved once and reused in new quotations.</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="field span-2">
                  <span>Preferred payment method</span>
                  <input
                    value={settings.paymentMethod || ''}
                    onChange={(event) => updateSetting('paymentMethod', event.target.value)}
                    placeholder="Bank transfer, GCash, PayPal, cash"
                  />
                </label>
                <label className="field span-2">
                  <span>Payment details</span>
                  <textarea
                    value={settings.paymentDetails || ''}
                    onChange={(event) => updateSetting('paymentDetails', event.target.value)}
                    placeholder="Account name, bank, GCash number, or payment instructions"
                  />
                </label>
                <label className="field span-2">
                  <span>Default payment note</span>
                  <textarea
                    value={settings.defaultPaymentTerms || ''}
                    onChange={(event) => updateSetting('defaultPaymentTerms', event.target.value)}
                    placeholder="Example: 50% down payment, balance before turnover."
                  />
                </label>
                <label className="field">
                  <span>Default validity period</span>
                  <input
                    min="1"
                    type="number"
                    value={settings.defaultValidityDays || 14}
                    onChange={(event) => updateSetting('defaultValidityDays', event.target.value)}
                  />
                  <small className="field-help">Used as the expiry window for new quotations.</small>
                </label>
              </div>
            </section>

            <div className="settings-readiness" aria-label="Quotation readiness summary">
              <div className="settings-readiness-header">
                <BadgeCheck aria-hidden="true" />
                <div>
                  <strong>Quotation readiness</strong>
                  <p>Quick check of what clients will see before you send a quotation.</p>
                </div>
              </div>
              <div className="settings-readiness-grid">
                {readinessItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div className="settings-readiness-item" key={item.label}>
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </form>

        <BusinessDocumentPreview settings={settings} />
      </div>
    </section>
  )
}
