import { statusClass } from '../utils/quotation.js'

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClass(status)}`}>{status}</span>
}
