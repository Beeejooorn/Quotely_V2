export const STATUS_OPTIONS = ['Draft', 'Sent', 'Pending', 'Approved', 'Rejected']

export const PACKAGE_OPTIONS = [
  { label: 'Basic', price: 15000 },
  { label: 'Standard', price: 25000 },
  { label: 'Premium', price: 40000 },
  { label: 'Custom', price: 0 },
]

export const CURRENCY_OPTIONS = [
  { code: 'PHP', label: 'PHP - Philippine peso', locale: 'en-PH' },
  { code: 'USD', label: 'USD - US dollar', locale: 'en-US' },
  { code: 'HKD', label: 'HKD - Hong Kong dollar', locale: 'en-HK' },
  { code: 'SGD', label: 'SGD - Singapore dollar', locale: 'en-SG' },
  { code: 'AUD', label: 'AUD - Australian dollar', locale: 'en-AU' },
  { code: 'EUR', label: 'EUR - Euro', locale: 'en-IE' },
]

export const TAX_MODE_OPTIONS = [
  { value: 'none', label: 'No tax' },
  { value: 'exclusive', label: 'Add tax/VAT' },
]

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function normalizeMoney(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
}

export function normalizeRate(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 0), 100) : 0
}

export function normalizeCurrency(value) {
  return CURRENCY_OPTIONS.some((option) => option.code === value) ? value : 'PHP'
}

export function formatMoney(value, currency = 'PHP') {
  const currencyCode = normalizeCurrency(currency)
  const option = CURRENCY_OPTIONS.find((item) => item.code === currencyCode)
  const formatter = new Intl.NumberFormat(option?.locale || 'en-PH', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  })

  return formatter.format(normalizeMoney(value))
}

export function peso(value) {
  return formatMoney(value, 'PHP')
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

function paragraphLinesHtml(value, fallback = '') {
  const lines = splitLines(value)

  if (!lines.length && fallback) {
    return `<p>${escapeHtml(fallback)}</p>`
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
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
  const netSubtotal = Math.max(0, subtotal - discount)
  const taxRate = normalizeRate(quote.taxRate)
  const taxMode = quote.taxMode === 'exclusive' ? 'exclusive' : 'none'
  const taxAmount = taxMode === 'exclusive' ? netSubtotal * (taxRate / 100) : 0
  const taxableAmount = netSubtotal
  const total = taxMode === 'exclusive' ? netSubtotal + taxAmount : netSubtotal

  return { basePrice, addOnsTotal, subtotal, discount, netSubtotal, taxableAmount, taxAmount, taxRate, taxMode, total }
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
    currency: 'PHP',
    taxMode: 'none',
    taxLabel: 'VAT',
    taxRate: 0,
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

function buildQuotelyLogoSvg() {
  return `<svg class="quotely-logo" viewBox="0 0 64 64" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path class="quotely-logo-main" fill="currentColor" fill-rule="evenodd" d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24c3.5 0 6.8-.7 9.8-2.1l10.9 7.4c1.9 1.3 4.3-.9 3.1-2.9l-6.3-10.7A23.9 23.9 0 0 0 56 32c0-2.4-.3-4.7-1-6.8H42.4V12c-3.2-2.5-6.8-4-10.4-4Zm0 13.1c-6 0-10.9 4.9-10.9 10.9S26 42.9 32 42.9 42.9 38 42.9 32 38 21.1 32 21.1Z" />
    <path class="quotely-logo-fold" fill="currentColor" d="M45.6 14.4v8.4h8.9L45.6 14.4Z" opacity="0.86" />
    <path class="quotely-logo-lines" d="M25.2 30h14.4M25.2 35.6h10.8" fill="none" stroke="#081f63" stroke-linecap="round" stroke-width="3.6" />
  </svg>`
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
  const businessLogoHtml = `<span class="logo-fallback">${buildQuotelyLogoSvg()}</span>`
  const projectDate = quote.eventDate ? formatDate(quote.eventDate) : ''
  const projectMeta = [projectDate, quote.location].filter(Boolean).join(' | ')
  const paymentTerms = quote.paymentTerms || settings.defaultPaymentTerms
  const paymentDetails = paragraphLinesHtml(settings.paymentDetails)
  const paymentTermsHtml = paragraphLinesHtml(paymentTerms, 'Payment terms will appear here.')
  const paymentMethod = settings.paymentMethod
    ? `<div><dt>Preferred payment method</dt><dd>${escapeHtml(settings.paymentMethod)}</dd></div>`
    : ''
  const paymentDetailsHtml = paymentDetails
    ? `<div><dt>Payment details</dt><dd>${paymentDetails}</dd></div>`
    : ''
  const clientName = quote.clientName || 'Client name'
  const projectName = quote.projectName || 'Project name'
  const packageName = quote.packageType || 'Custom'
  const businessName = settings.businessName?.trim() || 'Quotely Studio'
  const preparedByName = settings.businessName?.trim() || 'Quotely Quotation Studio'
  const quoteStatusClass = statusClass(quote.status)
  const currency = normalizeCurrency(quote.currency)
  const taxMode = quote.taxMode || 'none'
  const taxLabel = quote.taxLabel || 'VAT'
  const lineItems = [
    `<tr><td>${escapeHtml(packageName)} package</td><td>${formatMoney(totals.basePrice, currency)}</td></tr>`,
    ...addOns.map(
      (item) =>
        `<tr><td>${escapeHtml(item.name || 'Add-on')}</td><td>${formatMoney(item.price, currency)}</td></tr>`,
    ),
  ].join('')
  const servicesHtml = services.length
    ? services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')
    : '<li>Add included services before saving.</li>'
  const taxLineHtml = taxMode !== 'none'
    ? `<div class="row"><span>${escapeHtml(taxLabel)} ${totals.taxRate}%</span><strong>${formatMoney(totals.taxAmount, currency)}</strong></div>`
    : ''

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(quote.quotationNumber)} quotation</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      body { margin: 0; padding: 32px; color: #111827; font-family: "Plus Jakarta Sans", Arial, sans-serif; font-size: 14px; background: #f7f6f2; }
      .document { max-width: 840px; margin: 0 auto; padding: 40px; background: #fffbf3; border: 1px solid #e5e7eb; border-radius: 8px; }
      .document::before { content: "CLIENT COPY"; display: block; width: fit-content; margin: -14px auto 18px 0; border: 1px solid #e5e7eb; border-radius: 999px; padding: 5px 9px; color: #64748b; background: #f3f4f6; font-size: 11px; font-weight: 800; letter-spacing: .08em; }
      .top { display: flex; justify-content: space-between; gap: 30px; border-bottom: 1.5px solid #111827; padding-bottom: 26px; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-family: "Manrope", Arial, sans-serif; font-size: 30px; line-height: 1; }
      h2 { font-family: "Manrope", Arial, sans-serif; font-size: 22px; line-height: 1.05; }
      h3 { margin: 28px 0 10px; font-family: "Manrope", Arial, sans-serif; font-size: 13.5px; letter-spacing: 0; text-transform: uppercase; }
      p, li { color: #475569; font-size: 13.5px; line-height: 1.58; }
      .meta { position: relative; display: grid; justify-items: end; gap: 8px; min-width: 194px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: rgba(255, 251, 243, .96); text-align: right; box-shadow: 0 12px 26px rgba(17, 19, 26, .055), 0 0 0 3px var(--meta-glow, rgba(55, 48, 163, .06)); }
      .meta::before { content: ""; position: absolute; top: 13px; right: 13px; width: 7px; height: 7px; border-radius: 999px; background: var(--meta-dot, #3730a3); box-shadow: 0 0 0 4px var(--meta-glow, rgba(55, 48, 163, .08)); }
      .meta .label { margin-bottom: 0; padding-right: 16px; }
      .meta p { margin-top: 0; font-size: 13px; }
      .meta.status-draft { --meta-dot: #8a8f9e; --meta-glow: rgba(138, 143, 158, .12); }
      .meta.status-sent { --meta-dot: #64748b; --meta-glow: rgba(100, 116, 139, .12); }
      .meta.status-pending { --meta-dot: #d97706; --meta-glow: rgba(217, 119, 6, .16); }
      .meta.status-approved { --meta-dot: #059669; --meta-glow: rgba(5, 150, 105, .14); }
      .meta.status-rejected { --meta-dot: #dc2626; --meta-glow: rgba(220, 38, 38, .13); }
      .reference-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px 28px; border-bottom: 1px solid #e5e7eb; padding: 12px 0; color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .reference-row span:first-child { margin-right: auto; }
      .intro { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; border-bottom: 1px solid #e5e7eb; margin-top: 28px; padding: 0 0 24px; background: transparent; }
      .intro h2 { margin-top: 8px; font-size: 24px; }
      .hero-total { display: grid; align-content: center; min-width: 206px; border-left: 1px solid #e5e7eb; padding: 4px 0 4px 24px; background: transparent; text-align: right; }
      .hero-total strong { display: block; margin-top: 6px; font-family: "Manrope", Arial, sans-serif; font-size: 30px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; border-bottom: 1px solid #e5e7eb; margin-top: 24px; padding-bottom: 22px; }
      .box { border: 0; border-radius: 0; padding: 0; background: transparent; }
      .brand { display: flex; align-items: flex-start; gap: 14px; }
      .logo { width: 58px; height: 58px; border-radius: 999px; object-fit: cover; }
      .logo-fallback { display: grid; width: 58px; height: 58px; place-items: center; color: #3730a3; }
      .quotely-logo { display: block; width: 100%; height: 100%; }
      .brand-kicker { display: block; margin-bottom: 7px; color: #b45309; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .label { display: block; color: #475569; font-size: 12.5px; font-weight: 800; }
      strong { color: #111827; }
      .section-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 28px; }
      .section-head h3 { margin: 0; }
      .pill { color: #475569; font-size: 12.5px; font-weight: 800; }
      .package { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin: 10px 0 14px; padding: 14px 0; background: transparent; }
      .package-price { font-family: "Manrope", Arial, sans-serif; font-size: 18px; white-space: nowrap; }
      ul { margin: 0; padding-left: 20px; }
      .table-wrap { overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f6f1e8; color: #64748b; font-size: 12.5px; text-transform: uppercase; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 13px 16px; text-align: left; }
      tbody tr:last-child td { border-bottom: 0; }
      th:last-child, td:last-child { text-align: right; }
      .summary { max-width: 320px; margin-left: auto; margin-top: 14px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; }
      .total { border: 1px solid #efe1bd; border-radius: 8px; margin-top: 8px; padding: 14px; background: #f6f1e8; font-family: "Manrope", Arial, sans-serif; font-size: 20px; font-weight: 800; color: #b45309; }
      .badge { display: inline-block; border-radius: 999px; padding: 6px 10px; color: #3730a3; background: #f3f4f6; font-size: 12.5px; font-weight: 800; }
      .footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; }
      .footer .box h3 { margin-top: 0; }
      .detail-list { display: grid; gap: 12px; margin: 0; }
      .detail-list div { display: grid; gap: 3px; }
      .detail-list dt { color: #475569; font-size: 12.5px; font-weight: 800; line-height: 1.3; }
      .detail-list dd { margin: 0; }
      .detail-list dd p + p { margin-top: 4px; }
      .prepared { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; border-top: 1px solid #e5e7eb; margin-top: 22px; padding-top: 18px; }
      .prepared-name { margin-top: 7px; font-size: 14.5px; font-weight: 800; color: #111827; }
      .prepared-note { margin-top: 7px; font-size: 13px; line-height: 1.58; }
      .approval-note p { margin-top: 7px; color: #475569; }
      .closing { border-top: 1px solid #e5e7eb; margin-top: 22px; padding-top: 14px; text-align: center; font-size: 13px; line-height: 1.5; }
      @page { margin: 14mm; }
      @media print {
        body { background: #fff; padding: 0; }
        .document { max-width: none; border: 0; border-radius: 0; padding: 0; font-size: 14px; }
        .intro, .grid, .table-wrap, .footer, .prepared { break-inside: avoid; }
      }
      @media (max-width: 760px) {
        body { padding: 16px; }
        .document { padding: 22px; }
        .top, .package { flex-direction: column; }
        .meta { text-align: left; }
        .intro, .grid, .footer, .prepared { grid-template-columns: 1fr; }
        .hero-total { min-width: 0; border-left: 0; border-top: 1px solid #e5e7eb; padding: 16px 0 0; text-align: left; }
      }
    </style>
  </head>
  <body>
    <main class="document">
      <section class="top">
        <div class="brand">
          ${businessLogoHtml}
          <div>
            <span class="brand-kicker">Quotation prepared by</span>
            <h1>${escapeHtml(businessName)}</h1>
            ${businessInfo}
          </div>
        </div>
        <div class="meta status-${escapeHtml(quoteStatusClass)}">
          <span class="label">Quotation</span>
          <h2>${escapeHtml(quote.quotationNumber)}</h2>
          <p>Issued ${formatDate(quote.createdAt)}</p>
          <span class="badge">${escapeHtml(quote.status)}</span>
        </div>
      </section>
      <div class="reference-row">
        <span>Client copy</span>
        <span>Quote ref: ${escapeHtml(quote.quotationNumber)}</span>
        <span>Valid until ${escapeHtml(formatDate(quote.validityDate))}</span>
      </div>
      <section class="intro">
        <div>
          <span class="label">Prepared for</span>
          <h2>${escapeHtml(clientName)}</h2>
          <p>${escapeHtml(projectName)}</p>
        </div>
        <div class="hero-total">
          <span class="label">Total amount</span>
          <strong>${formatMoney(totals.total, currency)}</strong>
        </div>
      </section>
      <section class="grid">
        <div class="box"><span class="label">Client</span><strong>${escapeHtml(clientName)}</strong><p>${escapeHtml(quote.clientEmail || 'Client email')}</p></div>
        <div class="box"><span class="label">Project</span><strong>${escapeHtml(projectName)}</strong><p>${escapeHtml(projectMeta || 'Date and location')}</p></div>
      </section>
      <section class="section-head"><h3>Services and deliverables</h3><span class="pill">Package: ${escapeHtml(packageName)}</span></section>
      <div class="package"><div><span class="label">Package</span><strong>${escapeHtml(packageName)}</strong></div><strong class="package-price">${formatMoney(totals.basePrice, currency)}</strong></div>
      <ul>${servicesHtml}</ul>
      <h3>Investment</h3>
      <div class="table-wrap"><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>${lineItems}</tbody></table></div>
      <div class="summary">
        <div class="row"><span>Subtotal</span><strong>${formatMoney(totals.subtotal, currency)}</strong></div>
        <div class="row"><span>Discount</span><strong>-${formatMoney(totals.discount, currency)}</strong></div>
        ${taxLineHtml}
        <div class="row total"><span>Total</span><strong>${formatMoney(totals.total, currency)}</strong></div>
      </div>
      <section class="footer">
        <div class="box"><h3>Payment terms</h3><dl class="detail-list">${paymentMethod}<div><dt>Payment note</dt><dd>${paymentTermsHtml}</dd></div>${paymentDetailsHtml}</dl></div>
        <div class="box"><h3>Validity</h3><p>Valid until ${escapeHtml(formatDate(quote.validityDate))}</p></div>
        <div class="box"><h3>Notes</h3><p>${escapeHtml(quote.notes || 'No additional notes.')}</p></div>
      </section>
      <section class="prepared">
        <div class="box"><span class="label">Issued by</span><div class="prepared-name">${escapeHtml(preparedByName)}</div>${settings.businessEmail || settings.businessPhone ? `<p class="prepared-note">${escapeHtml([settings.businessEmail, settings.businessPhone].filter(Boolean).join(' | '))}</p>` : ''}</div>
        <div class="box approval-note"><span class="label">Acceptance note</span><p>To approve this quotation, reply with confirmation before work begins.</p></div>
      </section>
      <p class="closing">Thank you for considering ${escapeHtml(businessName)} for this project.</p>
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

function safeDownloadName(value) {
  return String(value || 'quotely-quotation')
    .trim()
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function toRgbChannel(value) {
  const trimmedValue = value.trim()

  if (trimmedValue.endsWith('%')) {
    return Math.round((Number(trimmedValue.slice(0, -1)) / 100) * 255)
  }

  const numericValue = Number(trimmedValue)

  return Math.round(numericValue <= 1 ? numericValue * 255 : numericValue)
}

function normalizeCssColor(value) {
  const trimmedValue = String(value || '').trim()

  if (!trimmedValue.startsWith('color(')) {
    return trimmedValue
  }

  const colorMatch = trimmedValue.match(/^color\(\s*[\w-]+\s+([^/)\s]+)\s+([^/)\s]+)\s+([^/)\s]+)(?:\s*\/\s*([^)]+))?\)$/i)

  if (!colorMatch) {
    return trimmedValue
  }

  const [, red, green, blue, alpha = '1'] = colorMatch
  const normalizedAlpha = alpha.trim().endsWith('%')
    ? Number(alpha.trim().slice(0, -1)) / 100
    : Number(alpha.trim())

  return `rgba(${toRgbChannel(red)}, ${toRgbChannel(green)}, ${toRgbChannel(blue)}, ${Number.isFinite(normalizedAlpha) ? normalizedAlpha : 1})`
}

function normalizeCssColorFunctions(value) {
  return String(value || '').replace(
    /color\(\s*[\w-]+\s+[^)]+\)/gi,
    (colorValue) => normalizeCssColor(colorValue),
  )
}

const PDF_COLOR_PROPERTIES = [
  'background-color',
  'border-bottom-color',
  'border-left-color',
  'border-right-color',
  'border-top-color',
  'caret-color',
  'color',
  'column-rule-color',
  'outline-color',
  'text-decoration-color',
]

function copyPdfSafeColors(sourceElement, targetElement) {
  const computedStyle = window.getComputedStyle(sourceElement)

  for (const property of PDF_COLOR_PROPERTIES) {
    const value = normalizeCssColor(computedStyle.getPropertyValue(property))

    if (value) {
      targetElement.style.setProperty(property, value, 'important')
    }
  }

  const boxShadow = normalizeCssColorFunctions(computedStyle.getPropertyValue('box-shadow'))
  const textShadow = normalizeCssColorFunctions(computedStyle.getPropertyValue('text-shadow'))

  if (boxShadow && boxShadow !== 'none') {
    targetElement.style.setProperty('box-shadow', boxShadow, 'important')
  }

  if (textShadow && textShadow !== 'none') {
    targetElement.style.setProperty('text-shadow', textShadow, 'important')
  }
}

function sanitizePdfCloneColors(sourceRoot, clonedRoot) {
  copyPdfSafeColors(sourceRoot, clonedRoot)

  const sourceElements = sourceRoot.querySelectorAll('*')
  const clonedElements = clonedRoot.querySelectorAll('*')

  sourceElements.forEach((sourceElement, index) => {
    const clonedElement = clonedElements[index]

    if (clonedElement) {
      copyPdfSafeColors(sourceElement, clonedElement)
    }
  })
}

export async function downloadQuotationElementPdf(documentElement, quotationNumber = 'quotely') {
  if (!documentElement) {
    throw new Error('Could not find the quotation preview to export.')
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  await document.fonts?.ready

  const bounds = documentElement.getBoundingClientRect()
  const pagePixelWidth = Math.ceil(bounds.width || documentElement.scrollWidth)
  const pagePixelHeight = Math.ceil(Math.max(bounds.height, documentElement.scrollHeight))
  const exportToken = `quote-pdf-${Date.now()}`
  let canvas

  documentElement.dataset.pdfExportRoot = exportToken

  try {
    canvas = await html2canvas(documentElement, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      width: pagePixelWidth,
      height: pagePixelHeight,
      windowHeight: Math.max(window.innerHeight || 0, pagePixelHeight),
      windowWidth: Math.max(window.innerWidth || 0, pagePixelWidth),
      onclone: (clonedDocument) => {
        const clonedElement = clonedDocument.querySelector(`[data-pdf-export-root="${exportToken}"]`)

        if (clonedElement) {
          sanitizePdfCloneColors(documentElement, clonedElement)
        }
      },
    })
  } finally {
    delete documentElement.dataset.pdfExportRoot
  }

  const pdf = new jsPDF({
    format: [pagePixelWidth, pagePixelHeight],
    orientation: 'portrait',
    unit: 'px',
  })
  const imageData = canvas.toDataURL('image/png', 1)

  pdf.addImage(imageData, 'PNG', 0, 0, pagePixelWidth, pagePixelHeight, undefined, 'FAST')

  pdf.save(`${safeDownloadName(quotationNumber)}-quotation.pdf`)
}

function waitForFrameLoad(frame) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Quotation preview took too long to prepare.'))
    }, 8000)

    frame.addEventListener(
      'load',
      () => {
        window.clearTimeout(timeout)
        resolve()
      },
      { once: true },
    )
  })
}

export async function downloadQuotationPdf(quote, settings) {
  const html = buildQuotationHtml(quote, settings)
  const frame = document.createElement('iframe')

  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  frame.style.position = 'fixed'
  frame.style.left = '-12000px'
  frame.style.top = '0'
  frame.style.width = '980px'
  frame.style.height = '1400px'
  frame.style.border = '0'

  document.body.appendChild(frame)
  const loaded = waitForFrameLoad(frame)
  frame.srcdoc = html
  await loaded

  try {
    const frameDocument = frame.contentDocument
    const frameWindow = frame.contentWindow
    const documentNode = frameDocument?.querySelector('.document')

    if (!documentNode || !frameWindow) {
      throw new Error('Could not prepare the quotation PDF.')
    }

    await frameDocument.fonts?.ready

    const documentHeight = Math.max(
      documentNode.scrollHeight,
      documentNode.getBoundingClientRect().height,
    )
    frame.style.height = `${Math.ceil(documentHeight + 80)}px`

    await downloadQuotationElementPdf(documentNode, quote.quotationNumber)
  } finally {
    frame.remove()
  }
}
