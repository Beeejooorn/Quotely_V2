import { Download, Printer } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import LogoMark from './LogoMark.jsx'
import { formatDate, peso, splitLines, visibleAddOns } from '../utils/quotation.js'

export default function QuotePreview({ onDownload, onPrint, quote, settings, totals }) {
  const services = splitLines(quote.servicesIncluded)
  const addOns = visibleAddOns(quote.addOns)

  return (
    <section className="preview-panel" aria-labelledby="preview-heading">
      <div className="preview-actions">
        <div>
          <strong id="preview-heading">Quotation preview</strong>
          <span>Print or download this quote</span>
        </div>
        <div className="preview-action-buttons">
          <button className="button secondary" type="button" onClick={onPrint}>
            <Printer aria-hidden="true" />
            Print
          </button>
          <button className="button primary" type="button" onClick={onDownload}>
            <Download aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      <article className="quotation-document" id="print-document">
        <header className="document-header">
          <div className="document-brand">
            <span className="brand-mark" aria-hidden="true">
              <LogoMark />
            </span>
            <div>
              <h2>{settings.businessName || 'Quotely'}</h2>
              <p>{settings.businessEmail}</p>
              <p>
                {settings.businessPhone} | {settings.businessAddress}
              </p>
            </div>
          </div>
          <div className="document-meta">
            <span>Quotation</span>
            <strong>{quote.quotationNumber}</strong>
            <p>Created {formatDate(quote.createdAt)}</p>
            <StatusBadge status={quote.status} />
          </div>
        </header>

        <section className="document-section">
          <h3>Client and project</h3>
          <div className="document-details">
            <div className="detail-block">
              <span>Client</span>
              <strong>{quote.clientName || 'Client missing'}</strong>
              <p>{quote.clientEmail || 'Email missing'}</p>
            </div>
            <div className="detail-block">
              <span>Project</span>
              <strong>{quote.projectName || 'Project missing'}</strong>
              <p>
                {formatDate(quote.eventDate)} | {quote.location || 'Location missing'}
              </p>
            </div>
          </div>
        </section>

        <section className="document-section">
          <h3>Services/package details</h3>
          <ul className="service-list">
            {services.length ? (
              services.map((service) => <li key={service}>{service}</li>)
            ) : (
              <li>Add included services before saving.</li>
            )}
          </ul>
        </section>

        <section className="document-section">
          <h3>Amount breakdown</h3>
          <table className="document-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{quote.packageType} package</td>
                <td>{peso(totals.basePrice)}</td>
              </tr>
              {addOns.map((item) => (
                <tr key={`${item.name}-${item.price}`}>
                  <td>{item.name || 'Add-on'}</td>
                  <td>{peso(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="document-summary">
            <div className="total-line">
              <span>Subtotal</span>
              <strong>{peso(totals.subtotal)}</strong>
            </div>
            <div className="total-line">
              <span>Discount</span>
              <strong>-{peso(totals.discount)}</strong>
            </div>
            <div className="document-total">
              <span>Total amount</span>
              <strong>{peso(totals.total)}</strong>
            </div>
          </div>
        </section>

        <footer className="document-footer">
          <div>
            <h3>Payment terms</h3>
            <p>{quote.paymentTerms || 'Payment terms missing.'}</p>
          </div>
          <div>
            <h3>Notes and validity</h3>
            <p>{quote.notes || 'No additional notes.'}</p>
            <p>Valid until {formatDate(quote.validityDate)}</p>
          </div>
        </footer>
      </article>
    </section>
  )
}
