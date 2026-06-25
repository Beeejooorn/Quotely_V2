import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import {
  STATUS_OPTIONS,
  normalizeMoney,
  peso,
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
            <h3><span>1</span> Client details</h3>
            <p>Client, project, date, and location for this quotation.</p>
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
              <small className="field-help">This appears as the main project line in the preview.</small>
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
            <h3><span>2</span> Package and pricing</h3>
            <p>Apply a reusable package or price a custom service for this client.</p>
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
                      {template.name} - {peso(template.price)}
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
              <small className="field-help">Add one deliverable per line so the preview stays easy to scan.</small>
              {errors.servicesIncluded && (
                <small className="field-error">{errors.servicesIncluded}</small>
              )}
            </label>
          </div>

          <div className="addons-list">
            <div className="addons-heading">
              <span className="field-label">Add-ons</span>
              <small>Optional extras listed after the main package.</small>
            </div>
            {quote.addOns.map((item, index) => (
              <div className="addon-row" key={`${index}-${item.name}`}>
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
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <h3><span>3</span> Terms and validity</h3>
            <p>Set payment expectations, quote status, and expiry date.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Discount</span>
              <input
                min="0"
                type="number"
                value={quote.discount}
                onChange={(event) => updateField('discount', normalizeMoney(event.target.value))}
              />
              <small className="field-help">Shown as a deduction in the amount breakdown.</small>
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
              <small className="field-help">Use Draft while preparing, then Sent or Pending after sharing.</small>
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
              <small className="field-help">This date powers follow-ups, attention cards, and the calendar.</small>
              {errors.validityDate && <small className="field-error">{errors.validityDate}</small>}
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
              <small className="field-help">Keep it short so clients understand the payment step.</small>
              {errors.paymentTerms && <small className="field-error">{errors.paymentTerms}</small>}
            </label>
            <label className="field span-2">
              <span>Notes</span>
              <textarea
                value={quote.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Add delivery notes, exclusions, or approval reminders."
              />
              <small className="field-help">Optional notes, exclusions, or approval reminders for this quote.</small>
            </label>
          </div>
        </section>

        <section className="form-section preview-export-section">
          <div className="form-section-heading">
            <h3><span>4</span> Preview and export</h3>
            <p>Review the client-facing document, then save before printing or downloading.</p>
          </div>
          <div className="preview-export-card">
            <span>{quote.quotationNumber}</span>
            <strong>{peso(totals.total)}</strong>
            <p>Live quote total</p>
          </div>
        </section>

        <div className="total-strip" aria-live="polite">
          <div className="total-strip-header">
            <div>
              <h3>Quotation total</h3>
              <p>Calculated from package price, add-ons, and discount.</p>
            </div>
            <span>{quote.quotationNumber}</span>
          </div>
          <div className="total-line">
            <span>Base package</span>
            <strong>{peso(totals.basePrice)}</strong>
          </div>
          <div className="total-line">
            <span>Add-ons</span>
            <strong>{peso(totals.addOnsTotal)}</strong>
          </div>
          <div className="total-line">
            <span>Discount</span>
            <strong>-{peso(totals.discount)}</strong>
          </div>
          <div className="total-line final">
            <span>Final total</span>
            <strong>{peso(totals.total)}</strong>
          </div>
        </div>

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
