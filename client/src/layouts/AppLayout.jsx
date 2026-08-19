import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useProfileStore from '../store/profileStore.js';
import useEventStore from '../store/eventStore.js';
import { getTimezoneOffset } from '../utils/timezone.js';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const identities = useProfileStore((s) => s.identities);
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const currentUser = useProfileStore((s) => s.currentUser);
  const selectProfile = useProfileStore((s) => s.selectProfile);
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const loadIdentities = useProfileStore((s) => s.loadIdentities);
  const logout = useProfileStore((s) => s.logout);
  const loadEvents = useEventStore((s) => s.loadEvents);

  const isAdmin = currentUser?.role === 'Admin';

  const activeProfile =
    profiles.find((p) => p._id === activeProfileId) ||
    identities.find((p) => p._id === activeProfileId);

  const handleProfileChange = async (profileId) => {
    await selectProfile(profileId);
    // Reload identities (they are role-scoped on the server)
    await loadIdentities();
    await loadProfiles();
    await loadEvents();
  };

  return (
    <div className="app-layout">
      {/* Mobile hamburger */}
      <button className="hamburger" onClick={() => setSidebarOpen(true)}>
        ☰
      </button>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>
            <span className="brand-icon">E</span>
            EventFlow
          </h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📅</span>
            Events
          </NavLink>
          <NavLink
            to="/profiles"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">👤</span>
            Profiles
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-selector">
            <label>Active Profile</label>
            <div className="profile-name-display">
              {activeProfile?.name || 'Loading…'}
            </div>
          </div>
          {activeProfile && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)', paddingLeft: 4 }}>
              🌐 {activeProfile.timezone} ({getTimezoneOffset(activeProfile.timezone)})
            </div>
          )}
          <button className="sidebar-switch-btn" onClick={logout}>
            <span>🔄</span> Switch Profile
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
