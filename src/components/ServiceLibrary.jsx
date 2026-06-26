import {
  CalendarClock,
  CircleDollarSign,
  Edit3,
  Layers3,
  ListChecks,
  PackageCheck,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate, peso, splitLines } from '../utils/quotation.js'

const emptyService = {
  id: null,
  name: '',
  description: '',
  price: 0,
}

function getServiceCategory(service) {
  const text = `${service.name || ''} ${service.description || ''}`.toLowerCase()

  if (/brand|logo|identity|visual/.test(text)) {
    return 'Branding'
  }

  if (/event|wedding|coordination|party/.test(text)) {
    return 'Events'
  }

  if (/retainer|monthly|support|maintenance/.test(text)) {
    return 'Retainer'
  }

  if (/consult|strategy|audit|workshop/.test(text)) {
    return 'Consulting'
  }

  if (/website|web|cms|landing|development|design/.test(text)) {
    return 'Website'
  }

  return 'Service'
}

function getServiceLines(service) {
  return splitLines(service.description)
}

export default function ServiceLibrary({ onDelete, onSave, services }) {
  const [draftService, setDraftService] = useState(emptyService)
  const serviceStats = useMemo(() => {
    const totalValue = services.reduce((sum, service) => sum + Number(service.price || 0), 0)
    const averagePrice = services.length ? totalValue / services.length : 0
    const includedLines = services.reduce(
      (sum, service) => sum + splitLines(service.description).length,
      0,
    )

    return { averagePrice, includedLines, totalValue }
  }, [services])

  const updateDraft = (field, value) => {
    setDraftService((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  const resetDraft = () => {
    setDraftService(emptyService)
  }

  const submitService = (event) => {
    event.preventDefault()

    const didSave = onSave(draftService)

    if (didSave) {
      resetDraft()
    }
  }

  return (
    <section className="services-page" aria-labelledby="services-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Services</p>
          <h1 id="services-heading">Service library</h1>
          <p className="page-subtitle">
            Save reusable packages and apply them instantly when creating a quotation.
          </p>
        </div>
      </div>

      <div className="page-insight-grid services-insights" aria-label="Service library summary">
        <article className="insight-card accent">
          <PackageCheck aria-hidden="true" />
          <span>Reusable packages</span>
          <strong>{services.length}</strong>
        </article>
        <article className="insight-card mint">
          <Layers3 aria-hidden="true" />
          <span>Deliverable lines</span>
          <strong>{serviceStats.includedLines}</strong>
        </article>
        <article className="insight-card amber">
          <CircleDollarSign aria-hidden="true" />
          <span>Average price</span>
          <strong>{peso(serviceStats.averagePrice)}</strong>
        </article>
      </div>

      <div className="services-grid">
        <form className="services-form panel" onSubmit={submitService}>
          <div className="panel-header compact">
            <div>
              <h2>{draftService.id ? 'Edit reusable package' : 'Create reusable package'}</h2>
              <p>Build a reusable offer for future quotations.</p>
            </div>
            <PackageCheck aria-hidden="true" />
          </div>

          <div className="service-form-body">
            <div className="service-form-grid">
              <label className="field span-2">
                <span>Package name</span>
                <input
                  value={draftService.name}
                  onChange={(event) => updateDraft('name', event.target.value)}
                  placeholder="Website launch package"
                />
                <small className="field-help">
                  This name appears in client quotations.
                </small>
              </label>

              <label className="field span-2">
                <span>Package price</span>
                <input
                  min="0"
                  type="number"
                  value={draftService.price}
                  onChange={(event) => updateDraft('price', event.target.value)}
                  placeholder="25000"
                />
              </label>
            </div>

            <label className="field">
              <span>Included deliverables</span>
              <textarea
                value={draftService.description}
                onChange={(event) => updateDraft('description', event.target.value)}
                placeholder="Discovery call&#10;Homepage design&#10;Responsive development"
              />
              <small className="field-help">
                One deliverable per line.
              </small>
            </label>

            <div className="form-actions">
              <button className="button primary" type="submit">
                <Save aria-hidden="true" />
                {draftService.id ? 'Update package' : 'Save package'}
              </button>
              {draftService.id && (
                <button className="button secondary" type="button" onClick={resetDraft}>
                  <Plus aria-hidden="true" />
                  New package
                </button>
              )}
            </div>
          </div>
        </form>

        <article className="services-list panel">
          <div className="panel-header">
            <div>
              <h2>Saved packages</h2>
              <p>Reusable packages available inside the quotation builder.</p>
            </div>
          </div>

          <div className="service-template-list">
            {services.length ? (
              services.map((service) => {
                const includedItems = getServiceLines(service)
                const visibleItems = includedItems.slice(0, 2)
                const extraItemCount = Math.max(includedItems.length - visibleItems.length, 0)

                return (
                  <article className="service-template-card" key={service.id}>
                    <div className="service-card-main">
                      <div className="service-card-meta">
                        <span className="service-template-tag">
                          {getServiceCategory(service)}
                        </span>
                        {service.updatedAt && (
                          <span className="service-updated">
                            <CalendarClock aria-hidden="true" />
                            Updated {formatDate(service.updatedAt)}
                          </span>
                        )}
                      </div>

                      <div className="service-card-title">
                        <strong>{service.name}</strong>
                      </div>

                      <div className="service-card-includes">
                        <div className="service-card-count">
                          <ListChecks aria-hidden="true" />
                          <span>{includedItems.length} deliverable{includedItems.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul>
                          {visibleItems.length ? (
                            visibleItems.map((item) => <li key={item}>{item}</li>)
                          ) : (
                            <li>No deliverables added yet.</li>
                          )}
                        </ul>
                        {extraItemCount > 0 && (
                          <small>+{extraItemCount} more deliverable{extraItemCount === 1 ? '' : 's'}</small>
                        )}
                      </div>
                    </div>

                    <div className="service-card-side">
                      <span className="service-card-price">{peso(service.price)}</span>
                      <div className="service-card-actions">
                        <button
                          className="button secondary compact-button"
                          type="button"
                          onClick={() => setDraftService(service)}
                        >
                          <Edit3 aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${service.name}`}
                          type="button"
                          title="Delete service"
                          onClick={() => onDelete(service.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="empty-state service-empty-state">
                <PackageCheck aria-hidden="true" />
                <strong>No reusable packages yet</strong>
                <p>
                  Add your repeatable services here so every new quotation starts faster.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
