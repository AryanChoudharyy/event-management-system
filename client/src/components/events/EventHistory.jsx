import { useState, useEffect } from 'react';
import { fetchEventLogs } from '../../services/api.js';
import { formatInTimezone } from '../../utils/timezone.js';

export default function EventHistory({ eventId, userTimezone }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchEventLogs(eventId);
        if (!cancelled) setLogs(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [eventId]);

  const formatValue = (field, value) => {
    if (!value) return '—';
    // Date fields — render in user's timezone
    if (field === 'Start Time' || field === 'End Time') {
      return formatInTimezone(value, userTimezone);
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 16, color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '24px 0' }}>
        <p>No update history yet</p>
      </div>
    );
  }

  return (
    <div className="history-panel">
      {logs.map((log) => (
        <div key={log._id} className="history-item">
          <div className="history-timestamp">
            {formatInTimezone(log.createdAt, userTimezone)}
          </div>

          {log.changes.map((change, i) => (
            <div key={i} className="history-change">
              <div className="field-name">{change.field}</div>
              <div className="change-values">
                <span className="old-value">
                  {formatValue(change.field, change.previousValue)}
                </span>
                <span className="arrow">→</span>
                <span className="new-value">
                  {formatValue(change.field, change.updatedValue)}
                </span>
              </div>
            </div>
          ))}

          <div className="history-updater">
            Updated by {log.updatedBy?.name || 'Unknown'}
          </div>
        </div>
      ))}
    </div>
  );
}
