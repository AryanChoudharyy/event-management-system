import {
  formatInTimezone,
  getDateBadge,
  formatTimeInTimezone,
} from '../../utils/timezone.js';

export default function EventCard({ event, userTimezone, onEdit, onView }) {
  const tz = userTimezone || event.timezone;
  const badge = getDateBadge(event.startDateTime, tz);
  const startTime = formatTimeInTimezone(event.startDateTime, tz);
  const endTime = formatTimeInTimezone(event.endDateTime, tz);
  const dateLabel = formatInTimezone(event.startDateTime, tz, 'ddd, MMM D');

  return (
    <div className="event-card" onClick={() => onView?.(event)}>
      <div className="event-date-badge">
        <div className="month">{badge.month}</div>
        <div className="day">{badge.day}</div>
      </div>

      <div className="event-info">
        <div className="event-title">{event.title}</div>
        {event.description && (
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {event.description.length > 80
              ? event.description.slice(0, 80) + '…'
              : event.description}
          </p>
        )}
        <div className="event-meta">
          <span>🕐 {startTime} – {endTime}</span>
          <span>📅 {dateLabel}</span>
          <span>🌐 {tz}</span>
        </div>
        <div className="event-profiles">
          {event.profiles?.map((p) => (
            <span key={p._id || p} className="profile-badge">
              {typeof p === 'object' ? p.name : p}
            </span>
          ))}
        </div>
      </div>

      <div className="event-actions">
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(event);
          }}
          title="Edit event"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}
