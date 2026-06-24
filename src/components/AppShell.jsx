import {
  FileText,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Create Quotation', icon: FileText },
  { id: 'saved', label: 'Saved Quotations', icon: LibraryBig },
]

const utilityItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

const mobileUtilityItems = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  ...utilityItems,
]

function NavButton({ activeSection, item, onNavigate, onLogout }) {
  const Icon = item.icon
  const isLogout = item.id === 'logout'

  return (
    <button
      className={`nav-button ${activeSection === item.id ? 'active' : ''} ${isLogout ? 'logout-button' : ''}`}
      type="button"
      title={item.label}
      onClick={() => (isLogout ? onLogout() : onNavigate(item.id))}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  )
}

export default function AppShell({ account, activeSection, accentColor, children, onLogout, onNavigate }) {
  const profileName =
    account?.user_metadata?.full_name ||
    account?.user_metadata?.name ||
    account?.email ||
    'Profile'

  return (
    <div className="app-shell" style={{ '--brand-accent': accentColor }}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            Q
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
            className={`profile-rail-button ${activeSection === 'profile' ? 'active' : ''}`}
            type="button"
            title={profileName}
            onClick={() => onNavigate('profile')}
          >
            {profileName.slice(0, 1).toUpperCase()}
          </button>
          {utilityItems.map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
          ))}
          <NavButton
            activeSection={activeSection}
            item={{ id: 'logout', label: 'Log out', icon: LogOut }}
            onLogout={onLogout}
            onNavigate={onNavigate}
          />
        </nav>
      </aside>

      <header className="mobile-header">
        <div className="mobile-brand-row">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              Q
            </span>
            <div className="brand-text">
              <strong>Quotely</strong>
              <span>Quote workspace</span>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            title="Create quotation"
            onClick={() => onNavigate('create')}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Primary navigation">
          {[...navItems, ...mobileUtilityItems, { id: 'logout', label: 'Log out', icon: LogOut }].map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}
