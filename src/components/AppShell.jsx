import {
  BriefcaseBusiness,
  Menu,
  FileText,
  FilePenLine,
  LayoutDashboard,
  PackageCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import LogoMark from './LogoMark.jsx'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Create quotation', icon: FilePenLine },
  { id: 'saved', label: 'Quotations', icon: FileText },
  { id: 'services', label: 'Service Library', icon: PackageCheck },
]

const utilityItems = [
  { id: 'settings', label: 'Business Details', icon: BriefcaseBusiness },
]

const mobileUtilityItems = [
  { id: 'profile', label: 'Account', icon: UserRound },
  ...utilityItems,
]

function NavButton({ activeSection, item, onNavigate, tooltipScope = 'nav' }) {
  const Icon = item.icon
  const isActive = activeSection === item.id
  const tooltipId = `${tooltipScope}-tooltip-${item.id}`

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      aria-describedby={tooltipId}
      aria-label={item.label}
      className={`nav-button ${isActive ? 'active' : ''}`}
      type="button"
      title={item.label}
      onClick={() => onNavigate(item.id)}
    >
      <Icon aria-hidden="true" />
      <span id={tooltipId} role="tooltip">{item.label}</span>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileHeaderRef = useRef(null)
  const profileName =
    account?.user_metadata?.full_name ||
    account?.user_metadata?.name ||
    account?.email ||
    'Profile'
  const uploadedProfileImage = profileImage && !profileImage.startsWith('preset:')
  const navigateFromMobile = (section) => {
    onNavigate(section)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        window.requestAnimationFrame(() => {
          mobileHeaderRef.current?.querySelector('.mobile-menu-button')?.focus()
        })
      }
    }

    const handlePointerDown = (event) => {
      if (!mobileHeaderRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isMobileMenuOpen])

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
            aria-describedby="nav-tooltip-profile"
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
            <span className="rail-tooltip" id="nav-tooltip-profile" role="tooltip">
              Profile and account
            </span>
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

      <header className={`mobile-header ${isMobileMenuOpen ? 'is-open' : ''}`} ref={mobileHeaderRef}>
        <div className="mobile-brand-row">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <LogoMark />
            </span>
            <div className="brand-text">
              <strong>Quotely</strong>
            </div>
          </div>
          <button
            className="mobile-menu-button"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span>{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
        <nav
          className={`mobile-nav ${isMobileMenuOpen ? 'is-open' : ''}`}
          id="mobile-navigation"
          aria-label="Primary navigation"
          aria-hidden={!isMobileMenuOpen}
        >
          {[...navItems, ...mobileUtilityItems].map((item) => (
            <NavButton
              activeSection={activeSection}
              item={item}
              key={item.id}
              onNavigate={navigateFromMobile}
              tooltipScope="mobile-nav"
            />
          ))}
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}
