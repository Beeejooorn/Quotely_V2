import {
  CheckCircle2,
  ImagePlus,
  LogOut,
  Mail,
  MonitorCheck,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'

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
  const signInProvider = account?.app_metadata?.provider
    ? `${account.app_metadata.provider.slice(0, 1).toUpperCase()}${account.app_metadata.provider.slice(1)}`
    : 'Email'

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      onFeedback?.('Profile image needed', 'Choose an image file for your account photo.', 'error')
      return
    }

    if (file.size > maxProfileImageSize) {
      onFeedback?.('Profile image is too large', 'Choose an image under 1 MB.', 'error')
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
          <p className="section-label">Account</p>
          <h1 id="profile-heading">Account settings</h1>
          <p className="page-subtitle">
            Manage your profile image, sign-in details, and session safety.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="profile-card panel">
          <div className="profile-card-top">
            <div className="profile-identity-row">
              <span className="profile-avatar" aria-hidden="true">
                {uploadedProfileImage ? (
                  <img alt="" src={profileImage} />
                ) : (
                  <UserRound />
                )}
              </span>
              <div>
                <span className="profile-card-label">Current account</span>
                <h2>{profileName}</h2>
                <p>{account?.email}</p>
              </div>
            </div>
            <span className="profile-status-pill">
              <CheckCircle2 aria-hidden="true" />
              Active
            </span>
          </div>

          <div className="profile-detail-grid" aria-label="Account details">
            <div>
              <Mail aria-hidden="true" />
              <span>Email</span>
              <strong>{account?.email || 'Not available'}</strong>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" />
              <span>Sign-in method</span>
              <strong>{signInProvider}</strong>
            </div>
          </div>

          <div className="profile-upload-panel">
            <div>
              <strong>Profile image</strong>
              <p>Shown in the sidebar so you can recognize the active account quickly.</p>
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
                    aria-label="Remove profile image"
                    type="button"
                    title="Remove profile image"
                    onClick={onProfileImageRemove}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                )}
              </div>
              <small>PNG or JPG, up to 1 MB. Square images crop best inside the circle.</small>
            </div>
          </div>
        </article>

        <article className="profile-security panel">
          <div className="panel-header">
            <div>
              <h2>Account protection</h2>
              <p>Your quotation workspace is tied to this signed-in account.</p>
            </div>
            <ShieldCheck aria-hidden="true" />
          </div>
          <div className="profile-security-body">
            <div className="security-status-row">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <strong>Signed in</strong>
                <p>This browser can access your saved quotations while this session is active.</p>
              </div>
            </div>
            <div className="security-status-row">
              <MonitorCheck aria-hidden="true" />
              <div>
                <strong>Shared device reminder</strong>
                <p>Log out after using a shared, office, or borrowed computer.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="profile-logout panel">
          <div>
            <span className="profile-card-label">Session</span>
            <h2>Log out of Quotely</h2>
            <p>
              End this session when you are finished so client names, prices, and quotation
              drafts are not visible to the next person using this browser.
            </p>
          </div>
          <button className="button danger" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Log out
          </button>
        </article>
      </div>
    </section>
  )
}
