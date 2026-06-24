export default function LogoMark({ className = '' }) {
  return (
    <svg
      className={`quotely-logo ${className}`.trim()}
      viewBox="0 0 64 64"
      focusable="false"
      aria-hidden="true"
    >
      <path
        className="quotely-logo-main"
        fill="currentColor"
        fillRule="evenodd"
        d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24c3.5 0 6.8-.7 9.8-2.1l10.9 7.4c1.9 1.3 4.3-.9 3.1-2.9l-6.3-10.7A23.9 23.9 0 0 0 56 32c0-2.4-.3-4.7-1-6.8H42.4V12c-3.2-2.5-6.8-4-10.4-4Zm0 13.1c-6 0-10.9 4.9-10.9 10.9S26 42.9 32 42.9 42.9 38 42.9 32 38 21.1 32 21.1Z"
      />
      <path
        className="quotely-logo-fold"
        fill="currentColor"
        d="M45.6 14.4v8.4h8.9L45.6 14.4Z"
        opacity="0.86"
      />
      <path
        className="quotely-logo-lines"
        d="M25.2 30h14.4M25.2 35.6h10.8"
        fill="none"
        strokeLinecap="round"
        strokeWidth="3.6"
      />
    </svg>
  )
}
