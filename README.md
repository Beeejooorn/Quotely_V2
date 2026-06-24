# Quotely

Quotely is a quotation management MVP for freelancers, event suppliers, and
small businesses. It lets users create client quotations, calculate totals,
preview a printable document, save quotations, and track status from draft
through approval.

## Run locally

```bash
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd run dev` if script execution policy blocks
the `npm` shim.

## MVP features

- Dashboard summary metrics and quotation pipeline.
- Create quotations with client, project, package, service, add-on,
  discount, notes, terms, validity, and status fields.
- Automatic Philippine peso total calculation.
- Printable quotation preview with downloadable HTML export.
- Saved quotations table with search, filtering, view, delete, and status update.
- Branding settings persisted locally with the quotations.
- Responsive desktop and mobile layouts.

Data is currently stored in `localStorage`, which keeps the MVP lightweight for
demo use. A production version could add authentication, a database, PDF
generation, email sending, analytics, and client portals.
