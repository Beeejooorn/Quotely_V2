import {
  FileText,
  LayoutDashboard,
  LibraryBig,
  PackageCheck,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react'
import LogoMark from './LogoMark.jsx'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'New Quote', icon: FileText },
  { id: 'saved', label: 'Quotations', icon: LibraryBig },
  { id: 'services', label: 'Service Library', icon: PackageCheck },
]

const utilityItems = [
  { id: 'settings', label: 'Business Settings', icon: Settings },
]

const mobileUtilityItems = [
  { id: 'profile', label: 'Account', icon: UserRound },
  ...utilityItems,
]

function NavButton({ activeSection, item, onNavigate }) {
  const Icon = item.icon
  const isActive = activeSection === item.id

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
      className={`nav-button ${isActive ? 'active' : ''}`}
      type="button"
      title={item.label}
      onClick={() => onNavigate(item.id)}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  )
}

export default function AppShell({
  account,
  activeSection,
  accentColor,
  children,
  onNavigate,
  profileImage,
}) {
  const profileName =
    account?.user_metadata?.full_name ||
    account?.user_metadata?.name ||
    account?.email ||
    'Profile'
  const uploadedProfileImage = profileImage && !profileImage.startsWith('preset:')

  return (
    <div className="app-shell" style={{ '--brand-accent': accentColor }}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark />
          </span>
          <div className="brand-text">
            <strong>Quotely</strong>
            <span>Quote workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <nav className="nav-list nav-list-bottom" aria-label="Workspace settings">
          <button
            aria-current={activeSection === 'profile' ? 'page' : undefined}
            aria-label="Profile and account"
            className={`profile-rail-button ${uploadedProfileImage ? 'has-image' : ''} ${
              activeSection === 'profile' ? 'active' : ''
            }`}
            type="button"
            title="Profile and account"
            onClick={() => onNavigate('profile')}
          >
            <span className="profile-rail-avatar" aria-hidden="true">
              {uploadedProfileImage ? (
                <img alt="" src={profileImage} />
              ) : (
                <span className="profile-initial">{profileName.slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <span className="rail-tooltip">Profile and account</span>
          </button>
          {utilityItems.map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </aside>

      <header className="mobile-header">
        <div className="mobile-brand-row">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <LogoMark />
            </span>
            <div className="brand-text">
              <strong>Quotely</strong>
              <span>Quote workspace</span>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label="Create quotation"
            type="button"
            title="Create quotation"
            onClick={() => onNavigate('create')}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Primary navigation">
          {[...navItems, ...mobileUtilityItems].map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}
