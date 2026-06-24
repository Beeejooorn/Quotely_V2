import { CircleDollarSign, Edit3, Layers3, PackageCheck, Plus, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { peso, splitLines } from '../utils/quotation.js'

const emptyService = {
  id: null,
  name: '',
  description: '',
  price: 0,
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
            Save common offers once, then apply them while creating a quote.
          </p>
        </div>
      </div>

      <div className="page-insight-grid services-insights" aria-label="Service library summary">
        <article className="insight-card accent">
          <PackageCheck aria-hidden="true" />
          <span>Saved offers</span>
          <strong>{services.length}</strong>
        </article>
        <article className="insight-card mint">
          <Layers3 aria-hidden="true" />
          <span>Included lines</span>
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
              <h2>{draftService.id ? 'Edit service' : 'New service'}</h2>
              <p>Name the offer, set the price, and list what is included.</p>
            </div>
            <PackageCheck aria-hidden="true" />
          </div>

          <div className="service-form-body">
            <label className="field">
              <span>Service or package name</span>
              <input
                value={draftService.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                placeholder="Wedding coordination package"
              />
            </label>

            <label className="field">
              <span>Price</span>
              <input
                min="0"
                type="number"
                value={draftService.price}
                onChange={(event) => updateDraft('price', event.target.value)}
                placeholder="25000"
              />
            </label>

            <label className="field">
              <span>Included services</span>
              <textarea
                value={draftService.description}
                onChange={(event) => updateDraft('description', event.target.value)}
                placeholder="One included service per line"
              />
            </label>

            <div className="form-actions">
              <button className="button primary" type="submit">
                <Save aria-hidden="true" />
                {draftService.id ? 'Update service' : 'Save service'}
              </button>
              {draftService.id && (
                <button className="button secondary" type="button" onClick={resetDraft}>
                  <Plus aria-hidden="true" />
                  New service
                </button>
              )}
            </div>
          </div>
        </form>

        <article className="services-list panel">
          <div className="panel-header">
            <div>
              <h2>Saved services</h2>
              <p>These appear in the quotation builder.</p>
            </div>
          </div>

          <div className="service-template-list">
            {services.length ? (
              services.map((service) => (
                <article className="service-template-card" key={service.id}>
                  <div>
                    <div className="service-card-title">
                      <strong>{service.name}</strong>
                      <span>{peso(service.price)}</span>
                    </div>
                    <p>{service.description || 'Included services missing.'}</p>
                    <small>{splitLines(service.description).length} included line(s)</small>
                  </div>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Edit service"
                      onClick={() => setDraftService(service)}
                    >
                      <Edit3 aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Delete service"
                      onClick={() => onDelete(service.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                No saved services yet. Add the offers you quote most often.
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
