import { Download, Printer } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import LogoMark from './LogoMark.jsx'
import { formatDate, formatMoney, splitLines, statusClass, visibleAddOns } from '../utils/quotation.js'

export default function QuotePreview({
  helperText = 'Review the client-facing quote before printing or downloading.',
  onDownload,
  onPrint,
  quote,
  settings,
  showActions = true,
  totals,
}) {
  const services = splitLines(quote.servicesIncluded)
  const addOns = visibleAddOns(quote.addOns)
  const businessContact = [settings.businessPhone, settings.businessAddress].filter(Boolean).join(' | ')
  const projectDate = quote.eventDate ? formatDate(quote.eventDate) : ''
  const projectMeta = [projectDate, quote.location].filter(Boolean).join(' | ')
  const paymentTerms = quote.paymentTerms || settings.defaultPaymentTerms
  const clientName = quote.clientName || 'Client name'
  const projectName = quote.projectName || 'Project name'
  const businessName = settings.businessName?.trim() || 'Quotely Studio'
  const preparedByName = settings.businessName?.trim() || 'Quotely Quotation Studio'
  const quoteStatusClass = statusClass(quote.status)
  const currency = quote.currency || 'PHP'
  const taxMode = quote.taxMode || 'none'
  const taxLabel = quote.taxLabel || 'VAT'

  return (
    <section className="preview-panel" aria-labelledby="preview-heading">
      <div className="preview-actions">
        <div>
          <strong id="preview-heading">Quotation preview</strong>
          <span>{helperText}</span>
        </div>
        {showActions && (
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
        )}
      </div>

      <article className="quotation-document" id="print-document">
        <header className="document-header">
          <div className="document-brand">
            {settings.businessLogo ? (
              <span className="document-logo" aria-hidden="true">
                <img alt="" src={settings.businessLogo} />
              </span>
            ) : (
              <span className="brand-mark" aria-hidden="true">
                <LogoMark />
              </span>
            )}
            <div className="document-brand-copy">
              <span className="document-brand-kicker">Quotation prepared by</span>
              <h2>{businessName}</h2>
              {settings.businessEmail && <p>{settings.businessEmail}</p>}
              {businessContact && <p>{businessContact}</p>}
              {settings.registrationNumber && <p>{settings.registrationNumber}</p>}
            </div>
          </div>
          <div className={`document-meta status-${quoteStatusClass}`}>
            <span className="document-eyebrow">Quotation</span>
            <strong>{quote.quotationNumber}</strong>
            <p>Issued {formatDate(quote.createdAt)}</p>
            <div className="document-status-row">
              <StatusBadge status={quote.status} />
            </div>
          </div>
        </header>

        <div className="document-reference-row" aria-label="Quotation reference details">
          <span>Client copy</span>
          <span>Quote ref: {quote.quotationNumber}</span>
          <span>Valid until {formatDate(quote.validityDate)}</span>
        </div>

        <section className="document-intro" aria-label="Quotation summary">
          <div>
            <span className="document-eyebrow">Prepared for</span>
            <h3>{clientName}</h3>
            <p>{projectName}</p>
          </div>
          <div className="document-hero-total">
            <span>Total amount</span>
            <strong>{formatMoney(totals.total, currency)}</strong>
          </div>
        </section>

        <section className="document-section">
          <h3>Client and project</h3>
          <div className="document-details">
            <div className="detail-block">
              <span>Client</span>
              <strong>{clientName}</strong>
              <p>{quote.clientEmail || 'Client email'}</p>
            </div>
            <div className="detail-block">
              <span>Project</span>
              <strong>{projectName}</strong>
              <p>{projectMeta || 'Date and location'}</p>
            </div>
          </div>
        </section>

        <section className="document-section">
          <div className="document-section-heading">
            <h3>Services and deliverables</h3>
            <span>Package: {quote.packageType || 'Custom'}</span>
          </div>
          <div className="document-package-card">
            <div>
              <span>Package</span>
              <strong>{quote.packageType || 'Custom package'}</strong>
            </div>
            <strong className="document-package-price">{formatMoney(totals.basePrice, currency)}</strong>
          </div>
          <ul className="service-list">
            {services.length ? (
              services.map((service) => <li key={service}>{service}</li>)
            ) : (
              <li>Add deliverables before saving.</li>
            )}
          </ul>
        </section>

        <section className="document-section">
          <h3>Investment breakdown</h3>
          <div className="document-table-wrap">
            <table className="document-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{quote.packageType || 'Custom'} package</td>
                  <td>{formatMoney(totals.basePrice, currency)}</td>
                </tr>
                {addOns.map((item) => (
                  <tr key={`${item.name}-${item.price}`}>
                    <td>{item.name || 'Add-on'}</td>
                    <td>{formatMoney(item.price, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="document-summary">
            <div className="total-line">
              <span>Subtotal</span>
              <strong>{formatMoney(totals.subtotal, currency)}</strong>
            </div>
            <div className="total-line">
              <span>Discount</span>
              <strong>-{formatMoney(totals.discount, currency)}</strong>
            </div>
            {taxMode !== 'none' && (
              <div className="total-line">
                <span>
                  {taxLabel} {totals.taxRate}%
                </span>
                <strong>{formatMoney(totals.taxAmount, currency)}</strong>
              </div>
            )}
            <div className="document-total">
              <span>Total amount</span>
              <strong>{formatMoney(totals.total, currency)}</strong>
            </div>
          </div>
        </section>

        <footer className="document-footer">
          <div>
            <h3>Payment terms</h3>
            {settings.paymentMethod && <p>Preferred method: {settings.paymentMethod}</p>}
            <p>{paymentTerms || 'Payment terms will appear here.'}</p>
            {settings.paymentDetails && <p>{settings.paymentDetails}</p>}
          </div>
          <div>
            <h3>Validity</h3>
            <p>Valid until {formatDate(quote.validityDate)}</p>
          </div>
          <div className="document-notes-card">
            <h3>Notes</h3>
            <p>{quote.notes || 'No extra notes for this quote.'}</p>
          </div>
        </footer>

        <section className="document-prepared" aria-label="Quotation prepared by">
          <div>
            <span>Issued by</span>
            <strong>{preparedByName}</strong>
            {(settings.businessEmail || settings.businessPhone) && (
              <p>{[settings.businessEmail, settings.businessPhone].filter(Boolean).join(' | ')}</p>
            )}
          </div>
          <div className="document-approval-note">
            <span>Acceptance note</span>
            <p>To approve this quotation, reply with confirmation before work begins.</p>
          </div>
        </section>

        <div className="document-closing">
          <p>
            Thank you for considering {businessName} for this work.
          </p>
        </div>
      </article>
    </section>
  )
}
