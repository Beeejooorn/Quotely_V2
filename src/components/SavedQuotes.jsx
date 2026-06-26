import { CircleDollarSign, Clock3, Download, Eye, FileText, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge.jsx'
import {
  calculateQuote,
  formatMoney,
  formatDate,
  peso,
  STATUS_OPTIONS,
} from '../utils/quotation.js'

function parseDateOnly(value) {
  const [year, month, day] = String(value || '')
    .split('-')
    .map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function getValidityState(value, status) {
  if (status === 'Approved') {
    return { label: 'Approved', tone: 'good' }
  }

  if (status === 'Rejected') {
    return { label: 'Closed', tone: 'muted' }
  }

  const targetDate = parseDateOnly(value)

  if (!targetDate) {
    return { label: 'No expiry date', tone: 'muted' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((targetDate - today) / 86400000)

  if (days < 0) {
    return { label: `Expired ${Math.abs(days)}d ago`, tone: 'danger' }
  }

  if (days === 0) {
    return { label: 'Expires today', tone: 'urgent' }
  }

  if (days <= 3) {
    return { label: `Follow up in ${days}d`, tone: 'urgent' }
  }

  return { label: `${days}d left`, tone: 'calm' }
}

export default function SavedQuotes({
  onCreate,
  onDelete,
  onDownload,
  onStatusChange,
  onView,
  quotes,
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredQuotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === 'All' || quote.status === statusFilter
      const searchable = [
        quote.quotationNumber,
        quote.clientName,
        quote.projectName,
        quote.clientEmail,
      ]
        .join(' ')
        .toLowerCase()

      return matchesStatus && searchable.includes(normalizedQuery)
    })
  }, [query, quotes, statusFilter])

  const quoteStats = useMemo(() => {
    const totalValue = quotes.reduce((sum, quote) => sum + calculateQuote(quote).total, 0)
    const activeCount = quotes.filter((quote) => quote.status !== 'Rejected').length
    const pendingCount = quotes.filter((quote) => quote.status === 'Pending').length

    return {
      activeCount,
      pendingCount,
      totalValue,
    }
  }, [quotes])

  return (
    <section className="saved-page" aria-labelledby="saved-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Saved quotations</p>
          <h1 id="saved-heading">Saved quotations</h1>
          <p className="page-subtitle">
            Find client quotations, update status, and reopen drafts when work changes.
          </p>
        </div>
        <button className="button primary" type="button" onClick={onCreate}>
          <Plus aria-hidden="true" />
          New quotation
        </button>
      </div>

      <div className="page-insight-grid saved-insights" aria-label="Quotation summary">
        <article className="insight-card">
          <FileText aria-hidden="true" />
          <span>Total quotations</span>
          <strong>{quotes.length}</strong>
        </article>
        <article className="insight-card accent">
          <CircleDollarSign aria-hidden="true" />
          <span>Quoted value</span>
          <strong>{peso(quoteStats.totalValue)}</strong>
        </article>
        <article className="insight-card amber">
          <Clock3 aria-hidden="true" />
          <span>Pending follow-ups</span>
          <strong>{quoteStats.pendingCount}</strong>
        </article>
        <article className="insight-card mint">
          <Eye aria-hidden="true" />
          <span>Active records</span>
          <strong>{quoteStats.activeCount}</strong>
        </article>
      </div>

      <div className="saved-toolbar">
        <div className="saved-filters">
          <label className="field">
            <span>Search</span>
            <div className="search-field">
              <Search aria-hidden="true" />
              <input
                className="toolbar-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search client, project, email, or QLY number"
              />
            </div>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              className="status-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="saved-toolbar-summary">
          Showing <strong>{filteredQuotes.length}</strong> of {quotes.length} quotation
          {quotes.length === 1 ? '' : 's'}
        </p>
      </div>

      <article className="saved-panel">
        {filteredQuotes.length ? (
          <>
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Next step</th>
                  <th>Dates</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => {
                  const validityState = getValidityState(quote.validityDate, quote.status)

                  return (
                    <tr key={quote.id}>
                      <td>
                        <div className="quote-table-identity">
                          <span className="quote-id-chip">{quote.quotationNumber}</span>
                          <span className="quote-title">
                            {quote.clientName || 'Unnamed client'}
                          </span>
                          <span className="quote-meta">{quote.projectName || 'Untitled project'}</span>
                          {quote.clientEmail ? (
                            <span className="quote-meta subtle">{quote.clientEmail}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <strong className="quote-table-amount">
                          {formatMoney(calculateQuote(quote).total, quote.currency)}
                        </strong>
                      </td>
                      <td>
                        <select
                          className="status-select quote-status-select"
                          value={quote.status}
                          onChange={(event) => onStatusChange(quote.id, event.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`follow-up-pill tone-${validityState.tone}`}>
                          {validityState.label}
                        </span>
                      </td>
                      <td>
                        <div className="quote-date-stack">
                          <span>Exp {formatDate(quote.validityDate)}</span>
                          <small>Updated {formatDate(quote.updatedAt || quote.createdAt)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="table-open-button"
                            aria-label={`Open ${quote.quotationNumber}`}
                            type="button"
                            onClick={() => onView(quote)}
                          >
                            <Eye aria-hidden="true" />
                            Open
                          </button>
                          <button
                            className="icon-button quiet"
                            aria-label={`Download ${quote.quotationNumber}`}
                            type="button"
                            title="Download quotation"
                            onClick={() => onDownload(quote)}
                          >
                            <Download aria-hidden="true" />
                          </button>
                          <button
                            className="icon-button danger quiet"
                            aria-label={`Delete ${quote.quotationNumber}`}
                            type="button"
                            title="Delete quotation"
                            onClick={() => onDelete(quote.id)}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="quote-cards">
              {filteredQuotes.map((quote) => {
                const validityState = getValidityState(quote.validityDate, quote.status)

                return (
                  <article className="quote-card" key={quote.id}>
                    <div className="quote-card-top">
                      <div>
                        <span className="quote-id-chip">{quote.quotationNumber}</span>
                        <span className="quote-meta">Updated {formatDate(quote.updatedAt || quote.createdAt)}</span>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="quote-card-body">
                      <span className="quote-title">{quote.clientName || 'Unnamed client'}</span>
                      <span className="quote-meta">{quote.projectName || 'Untitled project'}</span>
                      <span className={`follow-up-pill tone-${validityState.tone}`}>
                        {validityState.label}
                      </span>
                      <span className="quote-meta">Expires {formatDate(quote.validityDate)}</span>
                      <strong className="quote-card-total">
                        {formatMoney(calculateQuote(quote).total, quote.currency)}
                      </strong>
                    </div>
                    <label className="field quote-card-status">
                      <span>Update status</span>
                      <select
                        aria-label={`Update status for ${quote.quotationNumber}`}
                        value={quote.status}
                        onChange={(event) => onStatusChange(quote.id, event.target.value)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="quote-card-actions">
                      <button className="button secondary" type="button" onClick={() => onView(quote)}>
                        <Eye aria-hidden="true" />
                        Open
                      </button>
                      <button className="button secondary" type="button" onClick={() => onDownload(quote)}>
                        <Download aria-hidden="true" />
                        Download
                      </button>
                      <button className="button danger" type="button" onClick={() => onDelete(quote.id)}>
                        <Trash2 aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className="empty-state elevated-empty">
            <FileText aria-hidden="true" />
            <strong>No matching quotations</strong>
            <p>
              {quotes.length
                ? 'Adjust the search or status filter to find the quote you need.'
                : 'Create your first quotation and it will be saved here for follow-up.'}
            </p>
            {!quotes.length && (
              <button className="button primary" type="button" onClick={onCreate}>
                <Plus aria-hidden="true" />
                Create quotation
              </button>
            )}
          </div>
        )}
      </article>
    </section>
  )
}
