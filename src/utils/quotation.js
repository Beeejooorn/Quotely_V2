export const STATUS_OPTIONS = ['Draft', 'Sent', 'Pending', 'Approved', 'Rejected']

export const PACKAGE_OPTIONS = [
  { label: 'Basic', price: 15000 },
  { label: 'Standard', price: 25000 },
  { label: 'Premium', price: 40000 },
  { label: 'Custom', price: 0 },
]

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function normalizeMoney(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
}

export function peso(value) {
  return currencyFormatter.format(normalizeMoney(value))
}

export function formatDate(value) {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not set' : dateFormatter.format(date)
}

export function splitLines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function visibleAddOns(addOns = []) {
  return addOns.filter((item) => item.name.trim() || normalizeMoney(item.price) > 0)
}

export function calculateQuote(quote) {
  const basePrice = normalizeMoney(quote.basePrice)
  const addOnsTotal = visibleAddOns(quote.addOns).reduce(
    (total, item) => total + normalizeMoney(item.price),
    0,
  )
  const subtotal = basePrice + addOnsTotal
  const discount = Math.min(normalizeMoney(quote.discount), subtotal)
  const total = Math.max(0, subtotal - discount)

  return { basePrice, addOnsTotal, subtotal, discount, total }
}

export function createBlankQuote(quotationNumber = 'QLY-001') {
  const now = new Date()
  const validity = new Date(now)
  validity.setDate(validity.getDate() + 14)

  return {
    id: null,
    quotationNumber,
    clientName: '',
    clientEmail: '',
    projectName: '',
    eventDate: '',
    location: '',
    packageType: 'Custom',
    basePrice: 0,
    servicesIncluded: '',
    addOns: [{ name: '', price: 0 }],
    discount: 0,
    notes: '',
    paymentTerms: '',
    validityDate: validity.toISOString().slice(0, 10),
    status: 'Draft',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export function nextQuoteNumber(quotes) {
  const maxNumber = quotes.reduce((maxValue, quote) => {
    const [, quoteNumber] = /QLY-(\d+)/.exec(quote.quotationNumber || '') || []
    return Math.max(maxValue, Number(quoteNumber || 0))
  }, 0)

  return `QLY-${String(maxNumber + 1).padStart(3, '0')}`
}

export function statusClass(status) {
  return String(status || 'Draft').toLowerCase()
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function buildQuotationHtml(quote, settings) {
  const totals = calculateQuote(quote)
  const services = splitLines(quote.servicesIncluded)
  const addOns = visibleAddOns(quote.addOns)
  const lineItems = [
    `<tr><td>${escapeHtml(quote.packageType)} package</td><td>${peso(totals.basePrice)}</td></tr>`,
    ...addOns.map(
      (item) =>
        `<tr><td>${escapeHtml(item.name || 'Add-on')}</td><td>${peso(item.price)}</td></tr>`,
    ),
  ].join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(quote.quotationNumber)} quotation</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      body { margin: 0; padding: 32px; color: #11131a; font-family: "Plus Jakarta Sans", Arial, sans-serif; background: #f3f4f6; }
      .document { max-width: 820px; margin: 0 auto; padding: 36px; background: #fff; border: 1px solid #e2e4ea; border-radius: 8px; }
      .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #11131a; padding-bottom: 22px; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-family: "Manrope", Arial, sans-serif; font-size: 28px; }
      h2 { font-family: "Manrope", Arial, sans-serif; font-size: 20px; }
      h3 { margin: 28px 0 10px; font-family: "Manrope", Arial, sans-serif; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
      p, li { color: #6f7280; line-height: 1.55; }
      .meta { text-align: right; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
      .box { border: 1px solid #e2e4ea; border-radius: 8px; padding: 14px; background: #f8f9fb; }
      .label { display: block; color: #6f7280; font-size: 12px; font-weight: 700; }
      strong { color: #11131a; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border-bottom: 1px solid #e2e4ea; padding: 12px 0; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
      .summary { max-width: 320px; margin-left: auto; margin-top: 14px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; color: #6f7280; }
      .total { border-top: 2px solid #11131a; margin-top: 8px; padding-top: 12px; font-family: "Manrope", Arial, sans-serif; font-size: 20px; font-weight: 800; color: #2927e8; }
      .badge { display: inline-block; border-radius: 999px; padding: 6px 10px; color: #2927e8; background: #ececff; font-size: 12px; font-weight: 800; }
      @media print { body { background: #fff; padding: 0; } .document { border: 0; } }
    </style>
  </head>
  <body>
    <main class="document">
      <section class="top">
        <div>
          <h1>${escapeHtml(settings.businessName || 'Quotely')}</h1>
          <p>${escapeHtml(settings.businessEmail)} · ${escapeHtml(settings.businessPhone)}</p>
          <p>${escapeHtml(settings.businessAddress)}</p>
        </div>
        <div class="meta">
          <h2>${escapeHtml(quote.quotationNumber)}</h2>
          <p>${formatDate(quote.createdAt)}</p>
          <span class="badge">${escapeHtml(quote.status)}</span>
        </div>
      </section>
      <section class="grid">
        <div class="box"><span class="label">Client</span><strong>${escapeHtml(quote.clientName || 'Client name')}</strong><p>${escapeHtml(quote.clientEmail)}</p></div>
        <div class="box"><span class="label">Project</span><strong>${escapeHtml(quote.projectName || 'Project name')}</strong><p>${escapeHtml(formatDate(quote.eventDate))} · ${escapeHtml(quote.location)}</p></div>
      </section>
      <h3>Services included</h3>
      <ul>${services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')}</ul>
      <h3>Investment</h3>
      <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>${lineItems}</tbody></table>
      <div class="summary">
        <div class="row"><span>Subtotal</span><strong>${peso(totals.subtotal)}</strong></div>
        <div class="row"><span>Discount</span><strong>${peso(totals.discount)}</strong></div>
        <div class="row total"><span>Total</span><strong>${peso(totals.total)}</strong></div>
      </div>
      <h3>Terms and notes</h3>
      <p><strong>Payment terms:</strong> ${escapeHtml(quote.paymentTerms)}</p>
      <p><strong>Valid until:</strong> ${escapeHtml(formatDate(quote.validityDate))}</p>
      <p>${escapeHtml(quote.notes)}</p>
    </main>
  </body>
</html>`
}

export function downloadQuotationHtml(quote, settings) {
  const html = buildQuotationHtml(quote, settings)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${quote.quotationNumber || 'quotely'}-quotation.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
