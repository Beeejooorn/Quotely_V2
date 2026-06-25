import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FilePenLine,
  FileText,
  Send,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import StatCard from './StatCard.jsx'
import StatusBadge from './StatusBadge.jsx'
import { calculateQuote, formatDate, peso, splitLines, STATUS_OPTIONS } from '../utils/quotation.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseDateOnly(value) {
  const [year, month, day] = String(value || '')
    .split('-')
    .map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildStats(quotes) {
  const counts = STATUS_OPTIONS.reduce((total, status) => {
    total[status] = quotes.filter((quote) => quote.status === status).length
    return total
  }, {})
  const estimatedSales = quotes
    .filter((quote) => quote.status !== 'Rejected')
    .reduce((sum, quote) => sum + calculateQuote(quote).total, 0)
  const approvedValue = quotes
    .filter((quote) => quote.status === 'Approved')
    .reduce((sum, quote) => sum + calculateQuote(quote).total, 0)
  const activeClients = new Set(quotes.map((quote) => quote.clientName).filter(Boolean)).size

  return { activeClients, approvedValue, counts, estimatedSales }
}

function getFollowUpQuotes(quotes) {
  return [...quotes]
    .filter((quote) => ['Sent', 'Pending'].includes(quote.status))
    .sort((a, b) => new Date(a.validityDate) - new Date(b.validityDate))
    .slice(0, 3)
}

function getCalendarMonth(quotes) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextDeadline = quotes
    .filter((quote) => quote.status !== 'Rejected')
    .map((quote) => parseDateOnly(quote.validityDate))
    .filter((date) => date && date >= today)
    .sort((a, b) => a - b)[0]

  const baseDate = nextDeadline || today

  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
}

function getCalendarCells(monthDate, quotes) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const isoDate = toDateKey(date)

    return {
      date,
      isoDate,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      quotes: quotes
        .filter((quote) => quote.status !== 'Rejected' && quote.validityDate === isoDate)
        .sort((a, b) => calculateQuote(b).total - calculateQuote(a).total),
    }
  })
}

function getDaysUntil(value) {
  const targetDate = parseDateOnly(value)

  if (!targetDate) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil((targetDate - today) / 86400000)
}

function getDeadlineLabel(value) {
  const days = getDaysUntil(value)

  if (days === null) {
    return 'No expiry date set'
  }

  if (days < 0) {
    return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  }

  if (days === 0) {
    return 'Expires today'
  }

  if (days === 1) {
    return 'Expires tomorrow'
  }

  return `Expires in ${days} days`
}

export default function Dashboard({ onCreate, onNavigate, onView, quotes }) {
  const [selectedCalendarQuote, setSelectedCalendarQuote] = useState(null)
  const [selectedCalendarCell, setSelectedCalendarCell] = useState(null)
  const [isCalendarPreviewClosing, setIsCalendarPreviewClosing] = useState(false)
  const calendarCloseTimerRef = useRef(null)
  const calendarPreviewRef = useRef(null)
  const stats = buildStats(quotes)
  const latestQuote = [...quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
  const followUpQuotes = getFollowUpQuotes(quotes)
  const focusQuote = followUpQuotes[0]
  const focusDays = focusQuote ? getDaysUntil(focusQuote.validityDate) : null
  const calendarMonth = getCalendarMonth(quotes)
  const calendarCells = getCalendarCells(calendarMonth, quotes)
  const calendarLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const selectedCalendarTotal = selectedCalendarQuote
    ? calculateQuote(selectedCalendarQuote).total
    : 0
  const selectedCalendarServices = selectedCalendarQuote
    ? splitLines(selectedCalendarQuote.servicesIncluded).slice(0, 3)
    : []

  useEffect(
    () => () => {
      if (calendarCloseTimerRef.current) {
        window.clearTimeout(calendarCloseTimerRef.current)
      }
    },
    [],
  )

  const closeCalendarQuote = useCallback(() => {
    if (!selectedCalendarQuote) {
      return
    }

    setIsCalendarPreviewClosing(true)

    if (calendarCloseTimerRef.current) {
      window.clearTimeout(calendarCloseTimerRef.current)
    }

    calendarCloseTimerRef.current = window.setTimeout(() => {
      setSelectedCalendarQuote(null)
      setSelectedCalendarCell(null)
      setIsCalendarPreviewClosing(false)
    }, 150)
  }, [selectedCalendarQuote])

  useEffect(() => {
    if (!selectedCalendarQuote) {
      return undefined
    }

    const handleCalendarPreviewKeydown = (event) => {
      if (event.key === 'Escape') {
        closeCalendarQuote()
      }
    }

    const handleOutsideCalendarPreview = (event) => {
      if (calendarPreviewRef.current?.contains(event.target)) {
        return
      }

      closeCalendarQuote()
    }

    document.addEventListener('keydown', handleCalendarPreviewKeydown)
    document.addEventListener('pointerdown', handleOutsideCalendarPreview)

    return () => {
      document.removeEventListener('keydown', handleCalendarPreviewKeydown)
      document.removeEventListener('pointerdown', handleOutsideCalendarPreview)
    }
  }, [closeCalendarQuote, selectedCalendarQuote])

  const openCalendarQuote = (quote, cell) => {
    if (calendarCloseTimerRef.current) {
      window.clearTimeout(calendarCloseTimerRef.current)
    }

    setIsCalendarPreviewClosing(false)
    setSelectedCalendarQuote(quote)
    setSelectedCalendarCell({
      isoDate: cell.isoDate,
      side: cell.column > 4 ? 'left' : 'right',
    })
  }

  const viewCalendarQuote = () => {
    if (selectedCalendarQuote) {
      onView(selectedCalendarQuote)
      setSelectedCalendarQuote(null)
    }
  }

  const renderCalendarPopover = () => {
    if (!selectedCalendarQuote) {
      return null
    }

    return (
      <aside
        className={`calendar-popover popover-${selectedCalendarCell?.side || 'right'} ${
          isCalendarPreviewClosing ? 'is-closing' : ''
        }`}
        ref={calendarPreviewRef}
        aria-live="polite"
        aria-label="Calendar quotation preview"
        role="dialog"
      >
        <div className="calendar-popover-top">
          <div>
            <span className="quote-id-chip">{selectedCalendarQuote.quotationNumber}</span>
            <h3>{selectedCalendarQuote.clientName || 'Unnamed client'}</h3>
            <p>{selectedCalendarQuote.clientEmail || 'Client email'}</p>
          </div>
          <StatusBadge status={selectedCalendarQuote.status} />
        </div>

        <div className="calendar-popover-total">
          <span>Total amount</span>
          <strong>{peso(selectedCalendarTotal)}</strong>
        </div>

        <dl className="calendar-popover-details">
          <div>
            <dt>Project</dt>
            <dd>{selectedCalendarQuote.projectName || 'Untitled project'}</dd>
          </div>
          <div>
            <dt>Valid until</dt>
            <dd>{formatDate(selectedCalendarQuote.validityDate)}</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{selectedCalendarQuote.packageType || 'Custom package'}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{selectedCalendarQuote.location || 'Location'}</dd>
          </div>
        </dl>

        <div className="calendar-popover-services">
          <span>Included services</span>
          {selectedCalendarServices.length ? (
            <ul>
              {selectedCalendarServices.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          ) : (
            <p>No service lines added.</p>
          )}
        </div>

        <div className="calendar-popover-actions">
          <button className="button secondary" type="button" onClick={closeCalendarQuote}>
            Close
          </button>
          <button className="button primary" type="button" onClick={viewCalendarQuote}>
            View full quotation
          </button>
        </div>
      </aside>
    )
  }

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Dashboard</p>
          <h1 id="dashboard-heading">Dashboard</h1>
          <p className="page-subtitle">
            Track active quotations, pending replies, and upcoming expiry dates.
          </p>
        </div>
        <button className="button primary" type="button" onClick={onCreate}>
          <FilePenLine aria-hidden="true" />
          Create quotation
        </button>
      </div>

      <article className="dashboard-focus panel">
        <div>
          <span className="focus-label">Today&apos;s focus</span>
          {focusQuote ? (
            <>
              <h2>{focusQuote.clientName || 'Client follow-up'}</h2>
              <p>
                {focusDays === null
                  ? 'This quote needs a check-in before it moves forward.'
                  : focusDays < 0
                    ? `Expired ${Math.abs(focusDays)} day${Math.abs(focusDays) === 1 ? '' : 's'} ago.`
                    : focusDays === 0
                      ? 'Valid until today. Follow up before the quote expires.'
                    : `Quote expires in ${focusDays} day${focusDays === 1 ? '' : 's'}. Keep the conversation moving.`}
              </p>
              <div className="focus-meta" aria-label="Focused quotation details">
                <span>{focusQuote.quotationNumber}</span>
                <span>{focusQuote.projectName || 'Untitled project'}</span>
                <span>{peso(calculateQuote(focusQuote).total)}</span>
              </div>
            </>
          ) : (
            <>
              <h2>No urgent follow-ups</h2>
              <p>No sent or pending quotations need attention right now.</p>
            </>
          )}
        </div>
        <div className="dashboard-focus-actions">
          {focusQuote?.clientEmail && (
            <a
              className="button secondary"
              href={`mailto:${focusQuote.clientEmail}?subject=Following up on ${focusQuote.quotationNumber}`}
            >
              <Send aria-hidden="true" />
              Send follow-up
            </a>
          )}
          <button
            className="button primary"
            type="button"
            onClick={() => (focusQuote ? onView(focusQuote) : onNavigate('saved'))}
          >
            {focusQuote ? 'View quote' : 'Review quotes'}
          </button>
        </div>
      </article>

      <div className="summary-grid" aria-label="Quotation summary">
        <StatCard
          icon={FileText}
          label="Total quotations"
          note={latestQuote ? `Latest ${latestQuote.quotationNumber}` : 'No quotes yet'}
          action="View workspace"
          tone="blue"
          value={quotes.length}
        />
        <StatCard
          icon={Clock3}
          label="Waiting on clients"
          note={followUpQuotes[0] ? getDeadlineLabel(followUpQuotes[0].validityDate) : 'No pending replies'}
          action="Needs reply"
          tone="amber"
          value={stats.counts.Pending}
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved value"
          note={`${stats.counts.Approved} approved quotation${stats.counts.Approved === 1 ? '' : 's'}`}
          action="Won work"
          tone="green"
          value={peso(stats.approvedValue)}
        />
        <StatCard
          icon={Users}
          label="Quoted clients"
          note="Unique clients quoted"
          action="Client count"
          tone="mint"
          value={stats.activeClients}
        />
      </div>

      <div className="dashboard-main-grid">
        <article className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Recent activity</h2>
              <p>Recent quotation changes and client-ready records.</p>
            </div>
            <button className="button secondary" type="button" onClick={onCreate}>
              New quotation
            </button>
          </div>

          <div className="activity-list">
            {recentQuotes.length ? (
              recentQuotes.map((quote) => (
                <button className="activity-row" key={quote.id} type="button" onClick={() => onView(quote)}>
                  <span className="activity-marker" aria-hidden="true" />
                  <span className="activity-main">
                    <span>
                      <span className="activity-type">Quotation</span>
                      <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                    </span>
                    <strong>{quote.clientName || 'Unnamed client'}</strong>
                    <small>{quote.projectName || 'Untitled project'}</small>
                  </span>
                  <span className="activity-side">
                    <strong>{peso(calculateQuote(quote).total)}</strong>
                    <span>
                      <StatusBadge status={quote.status} />
                      <small>{formatDate(quote.createdAt)}</small>
                      <small className="activity-action">
                        Open
                        <ExternalLink aria-hidden="true" />
                      </small>
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-state">No quotations yet. Start with a client and package.</div>
            )}
          </div>
        </article>

        <article className="panel attention-panel">
          <div className="panel-header">
            <div>
              <h2>Needs attention</h2>
              <p>Sent and pending quotations closest to expiry.</p>
            </div>
          </div>
          <div className="attention-list">
            {followUpQuotes.length ? (
              followUpQuotes.map((quote) => (
                <button className="attention-row" key={quote.id} type="button" onClick={() => onView(quote)}>
                  <span>
                    <strong>{quote.clientName || 'Unnamed client'}</strong>
                    <small>
                      <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                      <span>{getDeadlineLabel(quote.validityDate)}</span>
                    </small>
                    <em>{quote.projectName || 'Untitled project'}</em>
                  </span>
                  <span className="attention-action">
                    <StatusBadge status={quote.status} />
                    <small>View quote</small>
                  </span>
                </button>
              ))
            ) : (
              <div className="attention-empty">Nothing needs a follow-up right now.</div>
            )}
          </div>
          <div className="attention-footer">
            <span>
              <strong>{peso(stats.estimatedSales)}</strong>
              <small>Open quotation value</small>
            </span>
            <button className="button secondary" type="button" onClick={() => onNavigate('saved')}>
              View all
            </button>
          </div>
        </article>
      </div>

      <article className="panel status-panel">
        <div className="panel-header compact">
          <div>
            <h2>Status summary</h2>
            <p>Quick count of every quote by status.</p>
          </div>
        </div>
        <div className="dashboard-status-strip">
          {STATUS_OPTIONS.map((status) => (
            <div className="status-count" key={status}>
              <StatusBadge status={status} />
              <strong>{stats.counts[status]}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="panel calendar-panel">
        <div className="panel-header">
          <div>
            <h2>Upcoming expiry dates</h2>
            <p>Calendar view of quote validity dates.</p>
          </div>
          <span className="calendar-month">
            <CalendarDays aria-hidden="true" />
            {calendarLabel}
          </span>
        </div>

        <div className="quotation-calendar" aria-label={`${calendarLabel} quotation deadlines`}>
          <div className="calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((cell, index) => {
              const cellWithColumn = { ...cell, column: (index % 7) + 1 }
              const isSelected = selectedCalendarQuote
                && cell.quotes.some((quote) => quote.id === selectedCalendarQuote.id)

              return (
                <div
                  className={`calendar-cell ${isSelected ? 'has-popover' : ''}`}
                  key={cell.isoDate}
                >
                  <button
                    className={`calendar-day ${cell.isCurrentMonth ? '' : 'muted'} ${
                      cell.quotes.length ? 'has-quotes' : ''
                    } ${isSelected ? 'is-selected' : ''}`}
                    disabled={!cell.quotes.length}
                    aria-label={
                      cell.quotes.length
                        ? `${cell.quotes.length} quotation${cell.quotes.length === 1 ? '' : 's'} expiring on ${formatDate(cell.isoDate)}`
                        : `${formatDate(cell.isoDate)} has no quotation expiry`
                    }
                    type="button"
                    onClick={() => cell.quotes[0] && openCalendarQuote(cell.quotes[0], cellWithColumn)}
                  >
                    <span className="calendar-date-row">
                      <span className="calendar-date">{cell.date.getDate()}</span>
                      {cell.quotes.length ? (
                        <span className="calendar-count">{cell.quotes.length}</span>
                      ) : null}
                    </span>
                    <span className="calendar-deadlines">
                      {cell.quotes.slice(0, 2).map((quote) => (
                        <span className="calendar-quote" key={quote.id}>
                          <span className="calendar-quote-top">
                            <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                            <span className={`calendar-status-dot status-${quote.status.toLowerCase()}`} />
                          </span>
                          <span className="calendar-client">{quote.clientName || 'Unnamed client'}</span>
                          <span className="calendar-amount">{peso(calculateQuote(quote).total)}</span>
                        </span>
                      ))}
                      {cell.quotes.length > 2 ? (
                        <span className="calendar-more">+{cell.quotes.length - 2} more</span>
                      ) : null}
                      {!cell.quotes.length && cell.isCurrentMonth ? (
                        <span className="calendar-empty-note">No expiry</span>
                      ) : null}
                    </span>
                  </button>
                  {isSelected ? renderCalendarPopover() : null}
                </div>
              )
            })}
          </div>
        </div>
      </article>
    </section>
  )
}
