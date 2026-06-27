import { ChevronDown, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CURRENCY_OPTIONS,
  STATUS_OPTIONS,
  TAX_MODE_OPTIONS,
  formatMoney,
  normalizeMoney,
  normalizeRate,
} from '../utils/quotation.js'

export default function QuoteBuilder({
  errors = {},
  isEditing,
  onApplyService,
  onChange,
  onNew,
  onSave,
  quote,
  serviceTemplates = [],
  totals,
}) {
  const errorMessages = Object.values(errors)
  const meaningfulAddOns = quote.addOns.filter(
    (item) => item.name?.trim() || Number(item.price || 0) > 0,
  )
  const addOnSummary =
    meaningfulAddOns.length > 0
      ? `${meaningfulAddOns.length} add-on${meaningfulAddOns.length === 1 ? '' : 's'} added`
      : 'No add-ons added'
  const termsSummary = [
    quote.status || 'Draft',
    quote.validityDate ? `Valid until ${quote.validityDate}` : 'No validity date',
    Number(quote.discount || 0) > 0
      ? `${formatMoney(quote.discount, quote.currency)} discount`
      : 'No discount',
  ]
  const taxSummary =
    (quote.taxMode || 'none') === 'none'
      ? 'No tax'
      : `${quote.taxLabel || 'VAT'} ${totals.taxRate}%`
  const [expandedSections, setExpandedSections] = useState({
    addOns: meaningfulAddOns.length > 0,
    terms: false,
    total: false,
  })

  useEffect(() => {
    if (meaningfulAddOns.length > 0) {
      setExpandedSections((currentSections) => ({ ...currentSections, addOns: true }))
    }
  }, [meaningfulAddOns.length])

  const toggleSection = (section) => {
    setExpandedSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }))
  }

  const updateField = (field, value) => {
    onChange({ ...quote, [field]: value }, [field])
  }

  const updateAddOn = (index, field, value) => {
    const addOns = quote.addOns.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    )
    onChange({ ...quote, addOns }, ['addOns'])
  }

  const addAddOn = () => {
    setExpandedSections((currentSections) => ({ ...currentSections, addOns: true }))
    onChange({ ...quote, addOns: [...quote.addOns, { name: '', price: 0 }] }, ['addOns'])
  }

  const removeAddOn = (index) => {
    const addOns = quote.addOns.filter((_, itemIndex) => itemIndex !== index)
    onChange(
      { ...quote, addOns: addOns.length ? addOns : [{ name: '', price: 0 }] },
      ['addOns'],
    )
  }

  return (
    <section className="builder-panel" aria-labelledby="builder-heading">
      <div className="builder-header">
        <div>
          <h2 id="builder-heading">Quotation details</h2>
          <p>
            {isEditing
              ? 'Update this client quote and keep the preview aligned as you edit.'
              : 'Add the quote details once, then review the client-ready preview beside it.'}
          </p>
        </div>
        <div className="builder-header-meta">
          <span className="quote-mode-chip">{isEditing ? 'Editing quote' : 'Draft quote'}</span>
          <span className="quote-number-chip">{quote.quotationNumber}</span>
        </div>
      </div>

      <form
        className="builder-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        {errorMessages.length > 0 && (
          <div className="builder-error-summary" role="alert">
            <strong>Complete the required quote details</strong>
            <p>{errorMessages[0]}</p>
          </div>
        )}

        <section className="form-section">
          <div className="form-section-heading">
            <h3>
              <span>1</span> Client details
            </h3>
            <p>Who the quotation is for.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Client name</span>
              <input
                aria-invalid={Boolean(errors.clientName)}
                className={errors.clientName ? 'is-invalid' : undefined}
                value={quote.clientName}
                onChange={(event) => updateField('clientName', event.target.value)}
                placeholder="Alyssa Cruz"
              />
              {errors.clientName && <small className="field-error">{errors.clientName}</small>}
            </label>
            <label className="field">
              <span>Client email</span>
              <input
                aria-invalid={Boolean(errors.clientEmail)}
                className={errors.clientEmail ? 'is-invalid' : undefined}
                type="email"
                value={quote.clientEmail}
                onChange={(event) => updateField('clientEmail', event.target.value)}
                placeholder="client@email.com"
              />
              {errors.clientEmail && <small className="field-error">{errors.clientEmail}</small>}
            </label>
            <label className="field span-2">
              <span>Project or event name</span>
              <input
                aria-invalid={Boolean(errors.projectName)}
                className={errors.projectName ? 'is-invalid' : undefined}
                value={quote.projectName}
                onChange={(event) => updateField('projectName', event.target.value)}
                placeholder="Corporate Year-End Party"
              />
              {errors.projectName && <small className="field-error">{errors.projectName}</small>}
            </label>
            <label className="field">
              <span>Event/project date</span>
              <input
                aria-invalid={Boolean(errors.eventDate)}
                className={errors.eventDate ? 'is-invalid' : undefined}
                type="date"
                value={quote.eventDate}
                onChange={(event) => updateField('eventDate', event.target.value)}
              />
              {errors.eventDate && <small className="field-error">{errors.eventDate}</small>}
            </label>
            <label className="field">
              <span>Location</span>
              <input
                aria-invalid={Boolean(errors.location)}
                className={errors.location ? 'is-invalid' : undefined}
                value={quote.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Pasig City"
              />
              {errors.location && <small className="field-error">{errors.location}</small>}
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <h3>
              <span>2</span> Package and pricing
            </h3>
            <p>Package, deliverables, currency, and tax.</p>
          </div>
          <div className="form-grid">
            {serviceTemplates.length > 0 && (
              <label className="field span-2">
                <span>Saved service</span>
                <select
                  value=""
                  onChange={(event) => event.target.value && onApplyService(event.target.value)}
                >
                  <option value="">Choose a reusable package</option>
                  {serviceTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {formatMoney(template.price, quote.currency)}
                    </option>
                  ))}
                </select>
                <small className="field-help">
                  Applying a package fills the name, price, and deliverables.
                </small>
              </label>
            )}
            <label className="field">
              <span>Package or service name</span>
              <input
                aria-invalid={Boolean(errors.packageType)}
                className={errors.packageType ? 'is-invalid' : undefined}
                value={quote.packageType}
                onChange={(event) => updateField('packageType', event.target.value)}
                placeholder="Standard coordination"
              />
              {errors.packageType && <small className="field-error">{errors.packageType}</small>}
            </label>
            <label className="field">
              <span>Base package price</span>
              <input
                aria-invalid={Boolean(errors.basePrice)}
                className={errors.basePrice ? 'is-invalid' : undefined}
                min="0"
                type="number"
                value={quote.basePrice}
                onChange={(event) => updateField('basePrice', normalizeMoney(event.target.value))}
              />
              {errors.basePrice && <small className="field-error">{errors.basePrice}</small>}
            </label>
            <label className="field span-2">
              <span>Services included</span>
              <textarea
                aria-invalid={Boolean(errors.servicesIncluded)}
                className={errors.servicesIncluded ? 'is-invalid' : undefined}
                value={quote.servicesIncluded}
                onChange={(event) => updateField('servicesIncluded', event.target.value)}
                placeholder="One service per line"
              />
              <small className="field-help">
                Add one deliverable per line so the preview stays easy to scan.
              </small>
              {errors.servicesIncluded && (
                <small className="field-error">{errors.servicesIncluded}</small>
              )}
            </label>
            <label className="field">
              <span>Currency</span>
              <select
                value={quote.currency || 'PHP'}
                onChange={(event) => updateField('currency', event.target.value)}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>
              <small className="field-help">
                Choose the currency shown on the client quotation.
              </small>
            </label>
            <label className="field">
              <span>Tax/VAT</span>
              <select
                value={quote.taxMode || 'none'}
                onChange={(event) => updateField('taxMode', event.target.value)}
              >
                {TAX_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small className="field-help">
                Choose no tax or add tax/VAT to the final client total.
              </small>
            </label>
            {(quote.taxMode || 'none') !== 'none' && (
              <>
                <label className="field">
                  <span>Tax label</span>
                  <input
                    value={quote.taxLabel || 'VAT'}
                    onChange={(event) => updateField('taxLabel', event.target.value)}
                    placeholder="VAT"
                  />
                </label>
                <label className="field">
                  <span>Tax rate (%)</span>
                  <input
                    aria-invalid={Boolean(errors.taxRate)}
                    className={errors.taxRate ? 'is-invalid' : undefined}
                    min="0"
                    max="100"
                    type="number"
                    value={quote.taxRate || 0}
                    onChange={(event) => updateField('taxRate', normalizeRate(event.target.value))}
                  />
                  <small className="field-help">Philippine VAT is commonly 12% when applicable.</small>
                  {errors.taxRate && <small className="field-error">{errors.taxRate}</small>}
                </label>
              </>
            )}
          </div>

          <div className="addons-list collapsible-block">
            <button
              className="collapsible-heading"
              type="button"
              aria-expanded={expandedSections.addOns}
              aria-controls="quote-addons-panel"
              onClick={() => toggleSection('addOns')}
            >
              <span>
                <strong>Add-ons</strong>
                <small>{addOnSummary}</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </button>
            {expandedSections.addOns && (
              <div className="collapsible-content" id="quote-addons-panel">
                {quote.addOns.map((item, index) => (
                  <div className="addon-row" key={item.id || `addon-${index}`}>
                    <input
                      aria-label={`Add-on ${index + 1} name`}
                      value={item.name}
                      onChange={(event) => updateAddOn(index, 'name', event.target.value)}
                      placeholder="Additional setup hour"
                    />
                    <input
                      aria-label={`Add-on ${index + 1} price`}
                      min="0"
                      type="number"
                      value={item.price}
                      onChange={(event) =>
                        updateAddOn(index, 'price', normalizeMoney(event.target.value))
                      }
                    />
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Remove add-on"
                      onClick={() => removeAddOn(index)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button className="button secondary" type="button" onClick={addAddOn}>
                  <Plus aria-hidden="true" />
                  Add add-on
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading collapsible-section-heading">
            <div>
              <h3>
                <span>3</span> Terms and validity
              </h3>
              <p>Payment, status, and expiry.</p>
            </div>
            <button
              className="section-toggle"
              type="button"
              aria-expanded={expandedSections.terms}
              aria-controls="quote-terms-panel"
              onClick={() => toggleSection('terms')}
            >
              {expandedSections.terms ? 'Hide details' : 'Edit details'}
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
          <div className="section-summary-list" aria-label="Terms summary">
            {termsSummary.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {expandedSections.terms && (
            <div className="form-grid collapsible-content" id="quote-terms-panel">
              <label className="field">
                <span>Discount</span>
                <input
                  min="0"
                  type="number"
                  value={quote.discount}
                  onChange={(event) => updateField('discount', normalizeMoney(event.target.value))}
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={quote.status}
                  onChange={(event) => updateField('status', event.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Valid until</span>
                <input
                  aria-invalid={Boolean(errors.validityDate)}
                  className={errors.validityDate ? 'is-invalid' : undefined}
                  type="date"
                  value={quote.validityDate}
                  onChange={(event) => updateField('validityDate', event.target.value)}
                />
                <small className="field-help">Used for follow-ups and expiry dates.</small>
                {errors.validityDate && (
                  <small className="field-error">{errors.validityDate}</small>
                )}
              </label>
              <label className="field span-2">
                <span>Payment terms</span>
                <textarea
                  aria-invalid={Boolean(errors.paymentTerms)}
                  className={errors.paymentTerms ? 'is-invalid' : undefined}
                  value={quote.paymentTerms}
                  onChange={(event) => updateField('paymentTerms', event.target.value)}
                  placeholder="Example: 50% down payment, balance due before delivery."
                />
                {errors.paymentTerms && (
                  <small className="field-error">{errors.paymentTerms}</small>
                )}
              </label>
              <label className="field span-2">
                <span>Notes</span>
                <textarea
                  value={quote.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Add delivery notes, exclusions, or approval reminders."
                />
              </label>
            </div>
          )}
        </section>

        <section className="form-section preview-export-section">
          <div className="form-section-heading collapsible-section-heading">
            <div>
              <h3>
                <span>4</span> Preview and export
              </h3>
              <p>Check the calculated total before saving.</p>
            </div>
            <button
              className="section-toggle"
              type="button"
              aria-expanded={expandedSections.total}
              aria-controls="quote-total-panel"
              onClick={() => toggleSection('total')}
            >
              {expandedSections.total ? 'Hide breakdown' : 'View breakdown'}
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
          <div className="compact-total-summary" aria-live="polite">
            <span>{quote.quotationNumber}</span>
            <strong>{formatMoney(totals.total, quote.currency)}</strong>
            <small>{taxSummary}</small>
          </div>
          {expandedSections.total && (
            <div className="total-strip" id="quote-total-panel">
              <div className="total-strip-header">
                <div>
                  <h3>Quotation total</h3>
                  <p>Package price, add-ons, discount, and tax.</p>
                </div>
                <span>{quote.quotationNumber}</span>
              </div>
              <div className="total-line">
                <span>Base package</span>
                <strong>{formatMoney(totals.basePrice, quote.currency)}</strong>
              </div>
              <div className="total-line">
                <span>Add-ons</span>
                <strong>{formatMoney(totals.addOnsTotal, quote.currency)}</strong>
              </div>
              <div className="total-line">
                <span>Discount</span>
                <strong>-{formatMoney(totals.discount, quote.currency)}</strong>
              </div>
              {(quote.taxMode || 'none') !== 'none' && (
                <div className="total-line">
                  <span>
                    {quote.taxLabel || 'VAT'} {totals.taxRate}%
                  </span>
                  <strong>{formatMoney(totals.taxAmount, quote.currency)}</strong>
                </div>
              )}
              <div className="total-line final">
                <span>Final total</span>
                <strong>{formatMoney(totals.total, quote.currency)}</strong>
              </div>
            </div>
          )}
        </section>

        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onNew}>
            <RotateCcw aria-hidden="true" />
            New quote
          </button>
          <button className="button primary" type="submit">
            <Save aria-hidden="true" />
            Save quotation
          </button>
        </div>
      </form>
    </section>
  )
}
