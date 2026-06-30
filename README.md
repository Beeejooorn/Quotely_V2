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

## Supabase Auth redirect setup

Set these variables locally and in Vercel:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
VITE_APP_URL=https://your-vercel-domain.vercel.app
```

In Supabase, open **Authentication > URL Configuration** and set:

- **Site URL**: your Vercel production URL.
- **Redirect URLs**: your Vercel production URL, any Vercel preview URLs you use, and `http://localhost:5173` for local development.

This keeps Google sign-in and email confirmation links returning to the correct
Quotely site instead of localhost.

## MVP features

- Dashboard summary metrics and quotation pipeline.
- Create quotations with client, project, package, service, add-on,
  discount, notes, terms, validity, and status fields.
- Automatic Philippine peso total calculation.
- Printable quotation preview with downloadable HTML export.
- Saved quotations table with search, filtering, view, delete, and status update.
- Branding settings persisted locally with the quotations.
- Responsive desktop and mobile layouts.

Quotely uses Supabase Auth for workspace access. Quotation, service, and
business-detail records are currently stored per account in browser storage,
which keeps the MVP lightweight for demo use. A production version could add a
database, PDF generation, email sending, analytics, and client portals.
