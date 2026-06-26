import { CheckCircle2, Clock3, FileText, Send, XCircle } from 'lucide-react'
import { statusClass } from '../utils/quotation.js'

const statusIcons = {
  Approved: CheckCircle2,
  Draft: FileText,
  Pending: Clock3,
  Rejected: XCircle,
  Sent: Send,
}

export default function StatusBadge({ status }) {
  const Icon = statusIcons[status] || FileText

  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <Icon aria-hidden="true" />
      {status}
    </span>
  )
}
