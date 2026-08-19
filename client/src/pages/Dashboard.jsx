import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useProfileStore from '../store/profileStore.js';
import useEventStore from '../store/eventStore.js';
import EventCard from '../components/events/EventCard.jsx';
import { dayjs } from '../utils/timezone.js';

export default function Dashboard() {
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const currentUser = useProfileStore((s) => s.currentUser);
  const activeProfile = profiles.find((p) => p._id === activeProfileId);
  const events = useEventStore((s) => s.events);
  const loading = useEventStore((s) => s.loading);
  const loadEvents = useEventStore((s) => s.loadEvents);
  const navigate = useNavigate();

  const userTz = activeProfile?.timezone || currentUser?.timezone || 'UTC';

  // Click an event on the dashboard → go directly to event details
  const openEvent = (event) => navigate(`/events/${event._id}`);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /**
   * Compute today's and upcoming events using proper timezone-aware logic.
   *
   * Upcoming: events whose start time is AFTER the current moment.
   * Today: events whose start date falls on the current calendar day in the user's timezone.
   *
   * An event CAN appear in both (e.g., starts later today).
   */
  const { myEvents, todayEvents, upcomingEvents } = useMemo(() => {
    if (!activeProfileId) return { myEvents: [], todayEvents: [], upcomingEvents: [] };

    const now = dayjs();
    const todayStart = dayjs().tz(userTz).startOf('day');
    const todayEnd = dayjs().tz(userTz).endOf('day');

    // Filter to user's own events (backend already does this, but be safe)
    const mine = events.filter((evt) =>
      evt.profiles.some((p) => (typeof p === 'object' ? p._id : p) === activeProfileId)
    );

    // Today: event start OR end falls within today in user's timezone
    const today = mine.filter((evt) => {
      const eventStart = dayjs.utc(evt.startDateTime).tz(userTz);
      const eventEnd = dayjs.utc(evt.endDateTime).tz(userTz);
      // Event overlaps with today if it starts before end of today AND ends after start of today
      return eventStart.isBefore(todayEnd) && eventEnd.isAfter(todayStart);
    });

    // Upcoming: start time is strictly after right now
    const upcoming = mine.filter((evt) => {
      const eventStart = dayjs.utc(evt.startDateTime);
      return eventStart.isAfter(now);
    });

    return { myEvents: mine, todayEvents: today, upcomingEvents: upcoming };
  }, [events, activeProfileId, userTz]);

  // Greeting based on time of day in user's timezone
  const greeting = useMemo(() => {
    const hour = dayjs().tz(userTz).hour();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [userTz]);

  return (
    <>
      <div className="page-header">
        <div className="greeting">
          <h1>{greeting}, {activeProfile?.name || currentUser?.name || 'there'}</h1>
          <p>Here's your event overview</p>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">My Events</div>
            <div className="stat-value">{myEvents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today</div>
            <div className="stat-value">{todayEvents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value">{upcomingEvents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Profiles</div>
            <div className="stat-value">{profiles.length}</div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>
              View all
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              Loading events…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No upcoming events</h3>
              <p>Create an event to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/events')}>
                Go to Events
              </button>
            </div>
          ) : (
            <div className="event-list">
              {upcomingEvents.slice(0, 5).map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  userTimezone={userTz}
                  onEdit={openEvent}
                  onView={openEvent}
                />
              ))}
            </div>
          )}
        </div>

        {/* Today's events */}
        {todayEvents.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Today's Events</h2>
            </div>
            <div className="event-list">
              {todayEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  userTimezone={userTz}
                  onEdit={openEvent}
                  onView={openEvent}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
