export default function StatCard({ icon: Icon, label, note, tone = 'blue', value }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <div>
          <p>{label}</p>
          {note ? <span className="stat-note">{note}</span> : null}
        </div>
        <span className="stat-icon" aria-hidden="true">
          <Icon />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-sparkline" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    </article>
  )
}
