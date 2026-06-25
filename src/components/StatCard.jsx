export default function StatCard({ action, icon: Icon, label, note, tone = 'blue', value }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <p>{label}</p>
          {note ? <span className="stat-note">{note}</span> : null}
        </div>
      </div>
      <strong className="stat-value">{value}</strong>
      {action ? <span className="stat-action">{action}</span> : null}
      <span className="stat-sparkline" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    </article>
  )
}
