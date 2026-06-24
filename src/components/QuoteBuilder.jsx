import { Plus, Save, Trash2 } from 'lucide-react'
import {
  PACKAGE_OPTIONS,
  STATUS_OPTIONS,
  normalizeMoney,
  peso,
} from '../utils/quotation.js'

export default function QuoteBuilder({
  isEditing,
  onChange,
  onNew,
  onSave,
  quote,
  totals,
}) {
  const updateField = (field, value) => {
    onChange({ ...quote, [field]: value })
  }

  const updatePackage = (packageType) => {
    const selectedPackage = PACKAGE_OPTIONS.find((item) => item.label === packageType)
    onChange({
      ...quote,
      packageType,
      basePrice:
        packageType === 'Custom' ? quote.basePrice : selectedPackage?.price ?? quote.basePrice,
    })
  }

  const updateAddOn = (index, field, value) => {
    const addOns = quote.addOns.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    )
    onChange({ ...quote, addOns })
  }

  const addAddOn = () => {
    onChange({ ...quote, addOns: [...quote.addOns, { name: '', price: 0 }] })
  }

  const removeAddOn = (index) => {
    const addOns = quote.addOns.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...quote, addOns: addOns.length ? addOns : [{ name: '', price: 0 }] })
  }

  return (
    <section className="builder-panel" aria-labelledby="builder-heading">
      <div className="builder-header">
        <div>
          <h2 id="builder-heading">Quotation details</h2>
          <p>{isEditing ? 'Editing saved quotation' : 'Unsaved working draft'}</p>
        </div>
        <span className="quote-number-chip">{quote.quotationNumber}</span>
      </div>

      <form
        className="builder-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        <section className="form-section">
          <h3>Client and project</h3>
          <div className="form-grid">
            <label className="field">
              <span>Client name</span>
              <input
                value={quote.clientName}
                onChange={(event) => updateField('clientName', event.target.value)}
                placeholder="Alyssa Cruz"
              />
            </label>
            <label className="field">
              <span>Client email</span>
              <input
                type="email"
                value={quote.clientEmail}
                onChange={(event) => updateField('clientEmail', event.target.value)}
                placeholder="client@email.com"
              />
            </label>
            <label className="field span-2">
              <span>Business/project/event name</span>
              <input
                value={quote.projectName}
                onChange={(event) => updateField('projectName', event.target.value)}
                placeholder="Corporate Year-End Party"
              />
            </label>
            <label className="field">
              <span>Event/project date</span>
              <input
                type="date"
                value={quote.eventDate}
                onChange={(event) => updateField('eventDate', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                value={quote.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Pasig City"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>Package and pricing</h3>
          <div className="form-grid">
            <label className="field">
              <span>Package type</span>
              <select
                value={quote.packageType}
                onChange={(event) => updatePackage(event.target.value)}
              >
                {PACKAGE_OPTIONS.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Base package price</span>
              <input
                min="0"
                type="number"
                value={quote.basePrice}
                onChange={(event) => updateField('basePrice', normalizeMoney(event.target.value))}
              />
            </label>
            <label className="field span-2">
              <span>Services included</span>
              <textarea
                value={quote.servicesIncluded}
                onChange={(event) => updateField('servicesIncluded', event.target.value)}
                placeholder="One service per line"
              />
            </label>
          </div>

          <div className="addons-list">
            <span className="field-label">Add-ons</span>
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
          <h3>Terms and status</h3>
          <div className="form-grid">
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
              <span>Quotation validity date</span>
              <input
                type="date"
                value={quote.validityDate}
                onChange={(event) => updateField('validityDate', event.target.value)}
              />
            </label>
            <label className="field span-2">
              <span>Payment terms</span>
              <textarea
                value={quote.paymentTerms}
                onChange={(event) => updateField('paymentTerms', event.target.value)}
              />
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
        </section>

        <div className="total-strip" aria-live="polite">
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
          <button className="button primary" type="submit">
            <Save aria-hidden="true" />
            Save quotation
          </button>
          <button className="button secondary" type="button" onClick={onNew}>
            New quote
          </button>
        </div>
      </form>
    </section>
  )
}
