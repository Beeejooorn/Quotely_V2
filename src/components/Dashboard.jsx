import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  FileText,
  Users,
} from 'lucide-react'
import StatCard from './StatCard.jsx'
import StatusBadge from './StatusBadge.jsx'
import { calculateQuote, formatDate, peso, STATUS_OPTIONS } from '../utils/quotation.js'

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
        .slice(0, 2),
    }
  })
}

export default function Dashboard({ onCreate, onNavigate, onView, quotes }) {
  const stats = buildStats(quotes)
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
  const followUpQuotes = getFollowUpQuotes(quotes)
  const calendarMonth = getCalendarMonth(quotes)
  const calendarCells = getCalendarCells(calendarMonth, quotes)
  const calendarLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Dashboard</p>
          <h1 id="dashboard-heading">Dashboard</h1>
          <p className="page-subtitle">Quote activity and follow-ups for today.</p>
        </div>
        <button className="button primary" type="button" onClick={onCreate}>
          <FilePenLine aria-hidden="true" />
          Create quotation
        </button>
      </div>

      <div className="summary-grid" aria-label="Quotation summary">
        <StatCard icon={FileText} label="Total quotations" note="Saved quotes" tone="blue" value={quotes.length} />
        <StatCard icon={Clock3} label="Awaiting reply" note="Waiting for response" tone="coral" value={stats.counts.Pending} />
        <StatCard
          icon={CheckCircle2}
          label="Approved value"
          note={`${stats.counts.Approved} approved`}
          tone="green"
          value={peso(stats.approvedValue)}
        />
        <StatCard icon={Users} label="Active clients" note="With saved quotes" tone="violet" value={stats.activeClients} />
      </div>

      <div className="dashboard-main-grid">
        <article className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Recent activity</h2>
              <p>Latest quote updates, sorted by creation date.</p>
            </div>
            <button className="button secondary" type="button" onClick={onCreate}>
              New quotation
            </button>
          </div>

          <div className="activity-list">
            {recentQuotes.length ? (
              recentQuotes.map((quote) => (
                <button className="activity-row" key={quote.id} type="button" onClick={() => onView(quote)}>
                  <span className="activity-main">
                    <span>
                      <span className="activity-type">Quotation</span>
                      <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                    </span>
                    <strong>{quote.clientName || 'No client yet'}</strong>
                    <small>{quote.projectName || 'No project yet'}</small>
                  </span>
                  <span className="activity-side">
                    <strong>{peso(calculateQuote(quote).total)}</strong>
                    <span>
                      <StatusBadge status={quote.status} />
                      <small>{formatDate(quote.createdAt)}</small>
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-state">No quotations yet. Create your first quote.</div>
            )}
          </div>
        </article>

        <article className="panel attention-panel">
          <div className="panel-header">
            <div>
              <h2>Needs attention</h2>
              <p>Sent and pending quotes by validity date.</p>
            </div>
          </div>
          <div className="attention-list">
            {followUpQuotes.length ? (
              followUpQuotes.map((quote) => (
                <button className="attention-row" key={quote.id} type="button" onClick={() => onView(quote)}>
                  <span>
                    <strong>{quote.clientName || 'No client yet'}</strong>
                    <small>
                      <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                      <span>Valid until {formatDate(quote.validityDate)}</span>
                    </small>
                  </span>
                  <StatusBadge status={quote.status} />
                </button>
              ))
            ) : (
              <div className="attention-empty">No sent or pending quotes need follow-up.</div>
            )}
          </div>
          <div className="attention-footer">
            <span>
              <strong>{peso(stats.estimatedSales)}</strong>
              <small>Quoted value excluding rejected quotes</small>
            </span>
            <button className="button secondary" type="button" onClick={() => onNavigate('saved')}>
              View all
            </button>
          </div>
        </article>
      </div>

      <div className="dashboard-status-strip panel">
        {STATUS_OPTIONS.map((status) => (
          <div className="status-count" key={status}>
            <StatusBadge status={status} />
            <strong>{stats.counts[status]}</strong>
          </div>
        ))}
      </div>

      <article className="panel calendar-panel">
        <div className="panel-header">
          <div>
            <h2>Quotation calendar</h2>
            <p>Validity dates for active quotations.</p>
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
            {calendarCells.map((cell) => (
              <button
                className={`calendar-day ${cell.isCurrentMonth ? '' : 'muted'} ${cell.quotes.length ? 'has-quotes' : ''}`}
                disabled={!cell.quotes.length}
                key={cell.isoDate}
                type="button"
                onClick={() => cell.quotes[0] && onView(cell.quotes[0])}
              >
                <span className="calendar-date">{cell.date.getDate()}</span>
                <span className="calendar-deadlines">
                  {cell.quotes.map((quote) => (
                    <span className="calendar-quote" key={quote.id}>
                      <span className="quote-id-chip compact">{quote.quotationNumber}</span>
                      <span>{quote.clientName || 'No client yet'}</span>
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}
