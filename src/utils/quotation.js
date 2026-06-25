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

export function createBlankQuote(quotationNumber = 'QLY-001', settings = {}) {
  const now = new Date()
  const validity = new Date(now)
  const validityDays = normalizeMoney(settings.defaultValidityDays || 14)
  validity.setDate(validity.getDate() + (validityDays || 14))

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
    paymentTerms: settings.defaultPaymentTerms || '',
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
  const businessContact = [settings.businessPhone, settings.businessAddress]
    .filter(Boolean)
    .join(' | ')
  const businessInfo = [
    settings.businessEmail,
    businessContact,
    settings.registrationNumber,
  ]
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
  const businessLogoHtml = settings.businessLogo
    ? `<img class="logo" alt="" src="${escapeHtml(settings.businessLogo)}" />`
    : '<span class="logo-fallback">Q</span>'
  const projectDate = quote.eventDate ? formatDate(quote.eventDate) : ''
  const projectMeta = [projectDate, quote.location].filter(Boolean).join(' | ')
  const paymentTerms = quote.paymentTerms || settings.defaultPaymentTerms
  const paymentDetails = settings.paymentDetails
    ? `<p>${escapeHtml(settings.paymentDetails)}</p>`
    : ''
  const paymentMethod = settings.paymentMethod
    ? `<p>Preferred method: ${escapeHtml(settings.paymentMethod)}</p>`
    : ''
  const clientName = quote.clientName || 'Client name'
  const projectName = quote.projectName || 'Project name'
  const packageName = quote.packageType || 'Custom'
  const lineItems = [
    `<tr><td>${escapeHtml(packageName)} package</td><td>${peso(totals.basePrice)}</td></tr>`,
    ...addOns.map(
      (item) =>
        `<tr><td>${escapeHtml(item.name || 'Add-on')}</td><td>${peso(item.price)}</td></tr>`,
    ),
  ].join('')
  const servicesHtml = services.length
    ? services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')
    : '<li>Add included services before saving.</li>'

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(quote.quotationNumber)} quotation</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      body { margin: 0; padding: 32px; color: #11131a; font-family: "Plus Jakarta Sans", Arial, sans-serif; background: #f3f4f6; }
      .document { max-width: 840px; margin: 0 auto; padding: 38px; background: linear-gradient(180deg, rgba(248, 249, 255, .72), transparent 150px), #fff; border: 1px solid #e2e4ea; border-radius: 8px; }
      .top { display: flex; justify-content: space-between; gap: 28px; border-bottom: 2px solid #11131a; padding-bottom: 24px; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-family: "Manrope", Arial, sans-serif; font-size: 28px; line-height: 1; }
      h2 { font-family: "Manrope", Arial, sans-serif; font-size: 22px; line-height: 1.05; }
      h3 { margin: 28px 0 10px; font-family: "Manrope", Arial, sans-serif; font-size: 13px; letter-spacing: 0; text-transform: uppercase; }
      p, li { color: #6f7280; line-height: 1.55; }
      .meta { min-width: 178px; border: 1px solid #e2e4ea; border-radius: 8px; padding: 14px; background: rgba(255, 255, 255, .86); text-align: right; }
      .meta .label { margin-bottom: 7px; }
      .meta p { margin-top: 8px; font-size: 13px; }
      .intro { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: stretch; border: 1px solid #e2e4ea; border-radius: 8px; margin-top: 22px; padding: 18px; background: #f8f9ff; }
      .intro h2 { margin-top: 8px; font-size: 24px; }
      .hero-total { display: grid; align-content: center; min-width: 190px; border-radius: 8px; padding: 16px; background: #fff; text-align: right; }
      .hero-total strong { display: block; margin-top: 6px; font-family: "Manrope", Arial, sans-serif; font-size: 28px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
      .box { border: 1px solid #e2e4ea; border-radius: 8px; padding: 16px; background: #fff; }
      .brand { display: flex; align-items: flex-start; gap: 14px; }
      .logo { width: 56px; height: 56px; border-radius: 999px; object-fit: cover; }
      .logo-fallback { display: grid; width: 56px; height: 56px; place-items: center; border-radius: 999px; color: #2927e8; background: #ececff; font-weight: 800; }
      .label { display: block; color: #6f7280; font-size: 12px; font-weight: 800; }
      strong { color: #11131a; }
      .section-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 28px; }
      .section-head h3 { margin: 0; }
      .pill { border-radius: 999px; padding: 6px 10px; color: #2927e8; background: #ececff; font-size: 12px; font-weight: 800; }
      .package { display: flex; align-items: center; justify-content: space-between; gap: 14px; border: 1px solid #e2e4ea; border-radius: 8px; margin: 10px 0 12px; padding: 14px 16px; background: #fff; }
      .package-price { font-family: "Manrope", Arial, sans-serif; font-size: 18px; white-space: nowrap; }
      ul { margin: 0; padding-left: 20px; }
      .table-wrap { overflow: hidden; border: 1px solid #e2e4ea; border-radius: 8px; background: #fff; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f8f9ff; color: #6f7280; font-size: 12px; text-transform: uppercase; }
      th, td { border-bottom: 1px solid #e2e4ea; padding: 13px 16px; text-align: left; }
      tbody tr:last-child td { border-bottom: 0; }
      th:last-child, td:last-child { text-align: right; }
      .summary { max-width: 320px; margin-left: auto; margin-top: 14px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; color: #6f7280; }
      .total { border: 1px solid #d9d9ff; border-radius: 8px; margin-top: 8px; padding: 14px; background: #f8f9ff; font-family: "Manrope", Arial, sans-serif; font-size: 20px; font-weight: 800; color: #2927e8; }
      .badge { display: inline-block; border-radius: 999px; padding: 6px 10px; color: #2927e8; background: #ececff; font-size: 12px; font-weight: 800; }
      .footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 28px; }
      .footer .box h3 { margin-top: 0; }
      .approval { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
      .signature { min-height: 38px; border-bottom: 1px solid #a5a9b8; margin-top: 14px; padding-bottom: 8px; }
      .closing { border-top: 1px solid #e2e4ea; margin-top: 22px; padding-top: 14px; text-align: center; font-size: 12px; }
      @page { margin: 14mm; }
      @media print {
        body { background: #fff; padding: 0; }
        .document { max-width: none; border: 0; border-radius: 0; padding: 0; }
        .intro, .grid, .table-wrap, .footer, .approval { break-inside: avoid; }
      }
      @media (max-width: 760px) {
        body { padding: 16px; }
        .document { padding: 22px; }
        .top, .package { flex-direction: column; }
        .meta { text-align: left; }
        .intro, .grid, .footer, .approval { grid-template-columns: 1fr; }
        .hero-total { min-width: 0; text-align: left; }
      }
    </style>
  </head>
  <body>
    <main class="document">
      <section class="top">
        <div class="brand">
          ${businessLogoHtml}
          <div>
            <h1>${escapeHtml(settings.businessName || 'Quotely')}</h1>
            ${businessInfo}
          </div>
        </div>
        <div class="meta">
          <span class="label">Quotation</span>
          <h2>${escapeHtml(quote.quotationNumber)}</h2>
          <p>Issued ${formatDate(quote.createdAt)}</p>
          <span class="badge">${escapeHtml(quote.status)}</span>
        </div>
      </section>
      <section class="intro">
        <div>
          <span class="label">Prepared for</span>
          <h2>${escapeHtml(clientName)}</h2>
          <p>${escapeHtml(projectName)}</p>
        </div>
        <div class="hero-total">
          <span class="label">Total amount</span>
          <strong>${peso(totals.total)}</strong>
        </div>
      </section>
      <section class="grid">
        <div class="box"><span class="label">Client</span><strong>${escapeHtml(clientName)}</strong><p>${escapeHtml(quote.clientEmail || 'Client email')}</p></div>
        <div class="box"><span class="label">Project</span><strong>${escapeHtml(projectName)}</strong><p>${escapeHtml(projectMeta || 'Date and location')}</p></div>
      </section>
      <section class="section-head"><h3>Services and deliverables</h3><span class="pill">${escapeHtml(packageName)} package</span></section>
      <div class="package"><div><span class="label">Package</span><strong>${escapeHtml(packageName)}</strong></div><strong class="package-price">${peso(totals.basePrice)}</strong></div>
      <ul>${servicesHtml}</ul>
      <h3>Investment</h3>
      <div class="table-wrap"><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>${lineItems}</tbody></table></div>
      <div class="summary">
        <div class="row"><span>Subtotal</span><strong>${peso(totals.subtotal)}</strong></div>
        <div class="row"><span>Discount</span><strong>-${peso(totals.discount)}</strong></div>
        <div class="row total"><span>Total</span><strong>${peso(totals.total)}</strong></div>
      </div>
      <section class="footer">
        <div class="box"><h3>Payment terms</h3>${paymentMethod}<p>${escapeHtml(paymentTerms || 'Payment terms will appear here.')}</p>${paymentDetails}</div>
        <div class="box"><h3>Validity</h3><p>Valid until ${escapeHtml(formatDate(quote.validityDate))}</p></div>
        <div class="box"><h3>Notes</h3><p>${escapeHtml(quote.notes || 'No additional notes.')}</p></div>
      </section>
      <section class="approval">
        <div class="box"><span class="label">Prepared by</span><div class="signature">${escapeHtml(settings.businessName || 'Quotely')}</div></div>
        <div class="box"><span class="label">Client approval</span><div class="signature">Signature and date</div></div>
      </section>
      <p class="closing">Thank you for considering ${escapeHtml(settings.businessName || 'Quotely')} for this project.</p>
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
