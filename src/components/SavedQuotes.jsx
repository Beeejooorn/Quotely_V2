import { Eye, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge.jsx'
import {
  calculateQuote,
  formatDate,
  peso,
  STATUS_OPTIONS,
} from '../utils/quotation.js'

export default function SavedQuotes({
  onCreate,
  onDelete,
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

  return (
    <section className="saved-page" aria-labelledby="saved-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Saved quotations</p>
          <h1 id="saved-heading">Saved quotes and status updates.</h1>
        </div>
        <button className="button primary" type="button" onClick={onCreate}>
          <Plus aria-hidden="true" />
          New quotation
        </button>
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
                placeholder="Search client, project, or QLY number"
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
      </div>

      <article className="saved-panel">
        {filteredQuotes.length ? (
          <>
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Client</th>
                  <th>Project/event</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <span className="quote-id-chip">{quote.quotationNumber}</span>
                    </td>
                    <td>
                      <span className="quote-title">
                        {quote.clientName || 'No client yet'}
                      </span>
                      <span className="quote-meta">{quote.clientEmail}</span>
                    </td>
                    <td>{quote.projectName || 'No project yet'}</td>
                    <td>
                      <strong>{peso(calculateQuote(quote).total)}</strong>
                    </td>
                    <td>
                      <select
                        className="status-select"
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
                    <td>{formatDate(quote.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          type="button"
                          title="View quotation"
                          onClick={() => onView(quote)}
                        >
                          <Eye aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          title="Delete quotation"
                          onClick={() => onDelete(quote.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="quote-cards">
              {filteredQuotes.map((quote) => (
                <article className="quote-card" key={quote.id}>
                  <div className="quote-card-top">
                    <div>
                      <span className="quote-id-chip">{quote.quotationNumber}</span>
                      <span className="quote-meta">{formatDate(quote.createdAt)}</span>
                    </div>
                    <StatusBadge status={quote.status} />
                  </div>
                  <div className="quote-card-body">
                    <span className="quote-title">{quote.clientName || 'No client yet'}</span>
                    <span className="quote-meta">{quote.projectName || 'No project yet'}</span>
                    <strong className="quote-card-total">
                      {peso(calculateQuote(quote).total)}
                    </strong>
                  </div>
                  <label className="field quote-card-status">
                    <span>Update status</span>
                    <select
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
                      View
                    </button>
                    <button className="button danger" type="button" onClick={() => onDelete(quote.id)}>
                      <Trash2 aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            No quotes match these filters.
          </div>
        )}
      </article>
    </section>
  )
}
