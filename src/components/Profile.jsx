import { ImagePlus, LogOut, ShieldCheck, Trash2, UserRound } from 'lucide-react'

const maxProfileImageSize = 1024 * 1024

export default function Profile({
  account,
  onFeedback,
  onLogout,
  onProfileImageChange,
  onProfileImageRemove,
  profileImage,
}) {
  const profileName =
    account?.user_metadata?.full_name ||
    account?.user_metadata?.name ||
    'Workspace owner'
  const uploadedProfileImage = profileImage && !profileImage.startsWith('preset:')

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      onFeedback?.('Image file required', 'Choose a PNG, JPG, or other image file.', 'error')
      return
    }

    if (file.size > maxProfileImageSize) {
      onFeedback?.('Image is too large', 'Choose an image under 1 MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        onProfileImageChange(reader.result)
      }
    })
    reader.readAsDataURL(file)
  }

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
          <div className="profile-identity-row">
            <span className="profile-avatar" aria-hidden="true">
              {uploadedProfileImage ? (
                <img alt="" src={profileImage} />
              ) : (
                <UserRound />
              )}
            </span>
            <div>
              <h2>{profileName}</h2>
              <p>{account?.email}</p>
            </div>
          </div>
          <div className="profile-avatar-stack">
            <div className="profile-image-actions">
              <label className="button secondary profile-image-button">
                <ImagePlus aria-hidden="true" />
                Choose image
                <input accept="image/*" type="file" onChange={handleProfileImage} />
              </label>
              {uploadedProfileImage && (
                <button
                  className="icon-button danger"
                  type="button"
                  title="Remove profile image"
                  onClick={onProfileImageRemove}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              )}
            </div>
            <small>Upload a PNG/JPG up to 1 MB.</small>
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
              Supabase Auth manages this session. Keep this account signed out on shared devices.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
