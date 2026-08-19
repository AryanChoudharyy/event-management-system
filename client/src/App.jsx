import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Events from './pages/Events.jsx';
import Profiles from './pages/Profiles.jsx';
import ToastContainer from './components/common/Toast.jsx';
import useProfileStore from './store/profileStore.js';
import useEventStore from './store/eventStore.js';

export default function App() {
  const identities = useProfileStore((s) => s.identities);
  const currentUser = useProfileStore((s) => s.currentUser);
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const loadIdentities = useProfileStore((s) => s.loadIdentities);
  const selectProfile = useProfileStore((s) => s.selectProfile);
  const loadCurrentUser = useProfileStore((s) => s.loadCurrentUser);
  const loadEvents = useEventStore((s) => s.loadEvents);
  
  const [initializing, setInitializing] = useState(true);

  // Initialize: check if user is logged in
  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        const user = await loadCurrentUser();
        if (user && isMounted) {
          Promise.all([loadIdentities(), loadProfiles(), loadEvents()]).catch(() => {});
        }
      } catch {
        if (isMounted) {
          await loadIdentities().catch(() => {});
        }
      } finally {
        if (isMounted) setInitializing(false);
      }
    };
    initialize();
    return () => { isMounted = false; };
  }, [loadCurrentUser, loadIdentities, loadProfiles, loadEvents]);

  const handleSelectProfile = async (id) => {
    try {
      await selectProfile(id);
    } catch (err) {
      console.error('Failed to select profile:', err);
    }
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Render Select Profile / Login Screen if no active session
  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">📅</div>
          <h2>Welcome to EventFlow</h2>
          <p>Select a profile to access your event dashboard</p>
          <div className="login-grid">
            {identities.map((p) => (
              <div
                key={p._id}
                className="login-profile-card"
                onClick={() => handleSelectProfile(p._id)}
              >
                <div className="login-avatar">
                  {p.name.charAt(0)}
                </div>
                <div className="login-name">{p.name}</div>
                <div className={`login-role ${p.role.toLowerCase()}`}>
                  {p.role}
                </div>
                <div className="login-tz">{p.timezone}</div>
              </div>
            ))}
            {identities.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '24px', color: 'var(--text-tertiary)' }}>
                No profiles found. Database might be empty.
              </div>
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventId" element={<Events />} />
          <Route path="/profiles" element={<Profiles />} />
        </Routes>
      </AppLayout>
      <ToastContainer />
    </BrowserRouter>
  );
}
