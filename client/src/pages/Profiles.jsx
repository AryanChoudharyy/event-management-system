import { useState, useMemo } from 'react';
import useProfileStore from '../store/profileStore.js';
import useEventStore from '../store/eventStore.js';
import Modal from '../components/common/Modal.jsx';
import TimezoneSelect from '../components/common/TimezoneSelect.jsx';
import { getTimezoneOffset } from '../utils/timezone.js';
import { addToast } from '../components/common/Toast.jsx';

export default function Profiles() {
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const currentUser = useProfileStore((s) => s.currentUser);
  const createProfile = useProfileStore((s) => s.createProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const events = useEventStore((s) => s.events);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const isAdmin = currentUser?.role === 'Admin';

  // Precompute event count per profile using a Map for efficiency
  const eventCountMap = useMemo(() => {
    const map = new Map();
    events.forEach((evt) => {
      evt.profiles.forEach((p) => {
        const id = typeof p === 'object' ? p._id : p;
        map.set(id, (map.get(id) || 0) + 1);
      });
    });
    return map;
  }, [events]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      await createProfile({ name: name.trim(), timezone });
      addToast('Profile created successfully');
      setShowCreateModal(false);
      setName('');
      setTimezone('UTC');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimezoneChange = async (profileId, newTz) => {
    try {
      await updateProfile(profileId, { timezone: newTz });
      addToast('Timezone updated');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Profiles</h1>
        <p>
          {isAdmin
            ? 'Manage user profiles and timezone preferences'
            : 'Your profile and timezone preference'}
        </p>
      </div>

      <div className="page-content">
        {isAdmin && (
          <div className="toolbar">
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + New Profile
            </button>
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No profiles yet</h3>
            <p>Create your first profile to start managing events</p>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Profile
              </button>
            )}
          </div>
        ) : (
          <div className="profile-grid">
            {profiles.map((profile) => {
              const isSelf = profile._id === activeProfileId;
              // Normal users can only change their own timezone
              const canChangeTimezone = isAdmin || isSelf;

              return (
                <div key={profile._id} className={`profile-card ${isSelf ? 'profile-card-active' : ''}`}>
                  <div className="profile-avatar">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-tz">
                    🌐 {profile.timezone} ({getTimezoneOffset(profile.timezone)})
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {eventCountMap.get(profile._id) || 0} events assigned
                  </div>

                  {canChangeTimezone && (
                    <div className="profile-tz-select">
                      <label>Change Timezone</label>
                      <TimezoneSelect
                        value={profile.timezone}
                        onChange={(tz) => handleTimezoneChange(profile._id, tz)}
                        id={`tz-${profile._id}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Profile Modal — Admin only */}
      <Modal
        isOpen={showCreateModal && isAdmin}
        onClose={() => {
          setShowCreateModal(false);
          setName('');
          setTimezone('UTC');
          setNameError('');
        }}
        title="Create Profile"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="profile-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="profile-name"
              className={`form-input ${nameError ? 'error' : ''}`}
              type="text"
              placeholder="Enter profile name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              maxLength={50}
              autoFocus
            />
            {nameError && <div className="form-error">{nameError}</div>}
          </div>
          <div className="form-group">
            <label>Timezone</label>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
