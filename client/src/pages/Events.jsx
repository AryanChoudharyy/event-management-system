import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useProfileStore from '../store/profileStore.js';
import useEventStore from '../store/eventStore.js';
import * as api from '../services/api.js';
import Modal from '../components/common/Modal.jsx';
import EventForm from '../components/events/EventForm.jsx';
import EventCard from '../components/events/EventCard.jsx';
import EventHistory from '../components/events/EventHistory.jsx';
import { formatInTimezone, formatTimeInTimezone } from '../utils/timezone.js';

export default function Events() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const currentUser = useProfileStore((s) => s.currentUser);
  const activeProfile = profiles.find((p) => p._id === activeProfileId);
  const events = useEventStore((s) => s.events);
  const loading = useEventStore((s) => s.loading);
  const error = useEventStore((s) => s.error);
  const loadEvents = useEventStore((s) => s.loadEvents);
  const loadEvent = useEventStore((s) => s.loadEvent);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState('all');
  const [activeTab, setActiveTab] = useState('details'); // details | history
  const [filterProfiles, setFilterProfiles] = useState([]);

  const userTz = activeProfile?.timezone || currentUser?.timezone || 'UTC';

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load event-related profiles from server (role-scoped)
  useEffect(() => {
    let cancelled = false;
    api.fetchEventRelatedProfiles()
      .then((res) => {
        if (!cancelled) setFilterProfiles(res.data);
      })
      .catch(() => {
        // fallback: empty
        if (!cancelled) setFilterProfiles([]);
      });
    return () => { cancelled = true; };
  }, [events, activeProfileId]);

  // If navigated with an eventId, open that event's details directly
  useEffect(() => {
    if (!eventId || !activeProfileId) return;

    let cancelled = false;
    loadEvent(eventId)
      .then((event) => {
        if (!cancelled) {
          setViewingEvent(event);
          setActiveTab('details');
        }
      })
      .catch(() => {
        if (!cancelled) navigate('/events', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, activeProfileId, loadEvent, navigate]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by profile
    if (filterProfile !== 'all') {
      result = result.filter((evt) =>
        evt.profiles.some((p) => (typeof p === 'object' ? p._id : p) === filterProfile)
      );
    }

    // Search by title/description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (evt) =>
          evt.title.toLowerCase().includes(q) ||
          (evt.description && evt.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [events, filterProfile, searchQuery]);

  const handleCloseForm = useCallback(() => {
    setShowCreateModal(false);
    setEditingEvent(null);
  }, []);

  const handleEdit = useCallback((event) => {
    setEditingEvent(event);
    setViewingEvent(null);
  }, []);

  const handleView = useCallback((event) => {
    setViewingEvent(event);
    setActiveTab('details');
    navigate(`/events/${event._id}`);
  }, [navigate]);

  const handleCloseDetails = useCallback(() => {
    setViewingEvent(null);
    if (eventId) navigate('/events');
  }, [eventId, navigate]);

  return (
    <>
      <div className="page-header">
        <h1>Events</h1>
        <p>Manage events across profiles and timezones</p>
      </div>

      <div className="page-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
          >
            <option value="all">All profiles</option>
            {filterProfiles.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            + New Event
          </button>
        </div>

        {/* Event list */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Loading events…
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to load events</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => loadEvents()}>
              Try again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>{searchQuery || filterProfile !== 'all' ? 'No matching events' : 'No events yet'}</h3>
            <p>
              {searchQuery || filterProfile !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first event to get started'}
            </p>
            {!searchQuery && filterProfile === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="event-list">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                userTimezone={userTz}
                onEdit={handleEdit}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Event"
      >
        <EventForm onClose={() => setShowCreateModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingEvent}
        onClose={handleCloseForm}
        title="Edit Event"
      >
        {editingEvent && (
          <EventForm event={editingEvent} onClose={handleCloseForm} />
        )}
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewingEvent}
        onClose={handleCloseDetails}
        title="Event Details"
        footer={
          <button
            className="btn btn-primary"
            onClick={() => handleEdit(viewingEvent)}
          >
            Edit Event
          </button>
        }
      >
        {viewingEvent && (
          <div>
            <div className="event-detail-header">
              <div>
                <h2>{viewingEvent.title}</h2>
                {viewingEvent.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                    {viewingEvent.description}
                  </p>
                )}
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <label>Start</label>
                <div className="value">
                  {formatInTimezone(viewingEvent.startDateTime, userTz)}
                </div>
              </div>
              <div className="detail-item">
                <label>End</label>
                <div className="value">
                  {formatInTimezone(viewingEvent.endDateTime, userTz)}
                </div>
              </div>
              <div className="detail-item">
                <label>Event Timezone</label>
                <div className="value">{viewingEvent.timezone}</div>
              </div>
              <div className="detail-item">
                <label>Created By</label>
                <div className="value">
                  {viewingEvent.createdBy?.name || 'Unknown'}
                </div>
              </div>
              <div className="detail-item">
                <label>Your Timezone</label>
                <div className="value">{userTz}</div>
              </div>
              <div className="detail-item">
                <label>Created</label>
                <div className="value">
                  {formatInTimezone(viewingEvent.createdAt, userTz)}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Assigned Profiles
              </label>
              <div className="event-profiles" style={{ marginTop: 6 }}>
                {viewingEvent.profiles?.map((p) => (
                  <span key={p._id || p} className="profile-badge">
                    {typeof p === 'object' ? p.name : p}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs: Details / History */}
            <div className="tabs" style={{ marginTop: 24 }}>
              <button
                className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Update History
              </button>
            </div>

            {activeTab === 'history' && (
              <EventHistory eventId={viewingEvent._id} userTimezone={userTz} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
