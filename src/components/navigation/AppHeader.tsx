import { NavLink, Link } from 'react-router-dom';
import { domains } from '../../data/domains';
import { useTheme } from '../../hooks/useTheme';
import { SearchLauncher } from '../search/SearchLauncher';
import { MoonIcon, SunIcon, SystemIcon } from '../ui/Icon';
import './navigation.css';

/** The wordmark: a chronological rule with three ticks of unequal weight. */
export function TimelineMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M7 8.5v7M13 6.5v11M18.5 10v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function AppHeader() {
  const { preference, cycle } = useTheme();

  const ThemeIcon =
    preference === 'light' ? SunIcon : preference === 'dark' ? MoonIcon : SystemIcon;

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="brand" aria-label="Timeline — home">
          <TimelineMark />
          <span className="brand__word display">Timeline</span>
        </Link>

        <nav className="app-nav" aria-label="Domains">
          <ul>
            {domains.map((domain) => (
              <li key={domain.id}>
                <NavLink
                  to={domain.path}
                  className={({ isActive }) =>
                    `app-nav__link${isActive ? ' app-nav__link--active' : ''}${
                      domain.status === 'planned' ? ' app-nav__link--planned' : ''
                    }`
                  }
                  title={
                    domain.status === 'planned'
                      ? `${domain.label} — planned, not yet catalogued`
                      : domain.blurb
                  }
                >
                  {domain.label}
                  {domain.status === 'planned' ? (
                    <span className="app-nav__soon" aria-label="planned">
                      ·
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="app-header__actions">
          <SearchLauncher size="compact" placeholder="Search…" />
          <button
            type="button"
            className="icon-button"
            onClick={cycle}
            aria-label={`Theme: ${preference}. Switch theme.`}
            title={`Theme: ${preference}`}
          >
            <ThemeIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
