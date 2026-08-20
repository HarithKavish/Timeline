import { NavLink } from 'react-router-dom';
import './navigation.css';

const LINKS = [
  { to: '/music', label: 'Overview', end: true },
  { to: '/music/timeline', label: 'Timeline', end: false },
  { to: '/music/creators', label: 'Creators', end: false },
];

/** Section navigation for the music domain. */
export function MusicNav() {
  return (
    <nav className="section-nav" aria-label="Music sections">
      <ul>
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `section-nav__link${isActive ? ' section-nav__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
