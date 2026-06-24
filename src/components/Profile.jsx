import { LogOut, ShieldCheck, UserRound } from 'lucide-react'

export default function Profile({ account, onLogout }) {
  const profileName =
    account?.user_metadata?.full_name ||
    account?.user_metadata?.name ||
    'Workspace owner'

  return (
    <section className="profile-page" aria-labelledby="profile-heading">
      <div className="page-heading">
        <div>
          <p className="section-label">Profile</p>
          <h1 id="profile-heading">Workspace profile</h1>
          <p className="page-subtitle">Supabase account access for Quotely.</p>
        </div>
        <button className="button danger" type="button" onClick={onLogout}>
          <LogOut aria-hidden="true" />
          Log out
        </button>
      </div>

      <div className="profile-grid">
        <article className="profile-card panel">
          <span className="profile-avatar" aria-hidden="true">
            <UserRound />
          </span>
          <div>
            <h2>{profileName}</h2>
            <p>{account?.email}</p>
          </div>
        </article>

        <article className="profile-security panel">
          <div className="panel-header">
            <div>
              <h2>Access status</h2>
              <p>Quotations are hidden when the session ends.</p>
            </div>
            <ShieldCheck aria-hidden="true" />
          </div>
          <div className="profile-security-body">
            <strong>Signed in</strong>
            <p>
              Supabase Auth manages this session. Quotation data should move behind Supabase row-level
              security before production launch.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
