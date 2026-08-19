import { useState, useEffect } from 'react';
import useProfileStore from '../../store/profileStore.js';
import useEventStore from '../../store/eventStore.js';
import * as api from '../../services/api.js';
import MultiSelect from '../common/MultiSelect.jsx';
import TimezoneSelect from '../common/TimezoneSelect.jsx';
import { localToUTC, utcToLocal } from '../../utils/timezone.js';
import { addToast } from '../common/Toast.jsx';

const INITIAL_FORM = {
  title: '',
  description: '',
  profiles: [],
  timezone: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
};

export default function EventForm({ event, onClose }) {
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const activeProfile = profiles.find((p) => p._id === activeProfileId);
  const createEvent = useEventStore((s) => s.createEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);

  const [assignableProfiles, setAssignableProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const isEditing = !!event;

  // Load all assignable profiles for event assignment (so any user can assign other users)
  useEffect(() => {
    let cancelled = false;
    api.fetchAssignableProfiles()
      .then((res) => {
        if (!cancelled) {
          setAssignableProfiles(res.data);
          setLoadingProfiles(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load assignable profiles:', err);
        if (!cancelled) setLoadingProfiles(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-fill form if editing — convert UTC dates to local in event timezone
  const getInitialValues = () => {
    if (!event) {
      return {
        ...INITIAL_FORM,
        timezone: activeProfile?.timezone || 'UTC',
      };
    }
    const tz = event.timezone || 'UTC';
    const start = utcToLocal(event.startDateTime, tz);
    const end = utcToLocal(event.endDateTime, tz);
    return {
      title: event.title,
      description: event.description || '',
      profiles: event.profiles.map((p) => (typeof p === 'object' ? p._id : p)),
      timezone: tz,
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
    };
  };

  const [form, setForm] = useState(getInitialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const profileOptions = assignableProfiles.map((p) => ({
    value: p._id,
    label: p.name,
  }));

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.profiles.length === 0) errs.profiles = 'Select at least one profile';
    if (!form.timezone) errs.timezone = 'Timezone is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.startTime) errs.startTime = 'Start time is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (!form.endTime) errs.endTime = 'End time is required';

    // Date comparison
    if (form.startDate && form.startTime && form.endDate && form.endTime && form.timezone) {
      const startUTC = localToUTC(form.startDate, form.startTime, form.timezone);
      const endUTC = localToUTC(form.endDate, form.endTime, form.timezone);

      const isStartValid = !isNaN(new Date(startUTC).getTime());
      const isEndValid = !isNaN(new Date(endUTC).getTime());

      if (!isStartValid) {
        errs.startDate = 'Invalid start date/time';
      }
      if (!isEndValid) {
        errs.endDate = 'Invalid end date/time';
      }

      if (isStartValid && isEndValid) {
        if (new Date(endUTC) <= new Date(startUTC)) {
          errs.endDate = 'End must be after start';
        }

        // Past check: only block if it's a new event OR if start time was modified
        const originalStartUTC = event ? event.startDateTime : null;
        const isStartModified = !originalStartUTC || new Date(startUTC).getTime() !== new Date(originalStartUTC).getTime();

        if (isStartModified) {
          const now = new Date();
          if (new Date(startUTC) < new Date(now.getTime() - 60000)) {
            errs.startDate = 'Event start date/time cannot be in the past';
          }
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const startUTC = localToUTC(form.startDate, form.startTime, form.timezone);
      const endUTC = localToUTC(form.endDate, form.endTime, form.timezone);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        profiles: form.profiles,
        timezone: form.timezone,
        startDateTime: startUTC,
        endDateTime: endUTC,
      };

      if (isEditing) {
        await updateEvent(event._id, payload);
        addToast('Event updated successfully');
      } else {
        await createEvent(payload);
        addToast('Event created successfully');
      }
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <div className="form-group">
        <label htmlFor="event-title">
          Title <span className="required">*</span>
        </label>
        <input
          id="event-title"
          className={`form-input ${errors.title ? 'error' : ''}`}
          type="text"
          placeholder="Enter event title"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          maxLength={100}
        />
        {errors.title && <div className="form-error">{errors.title}</div>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="event-desc">Description</label>
        <textarea
          id="event-desc"
          className="form-input"
          placeholder="Optional description"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Profiles */}
      <div className="form-group">
        <label>
          Profiles <span className="required">*</span>
        </label>
        <MultiSelect
          options={profileOptions}
          value={form.profiles}
          onChange={(val) => updateField('profiles', val)}
          placeholder={loadingProfiles ? 'Loading profiles…' : 'Select profiles…'}
        />
        {errors.profiles && <div className="form-error">{errors.profiles}</div>}
      </div>

      {/* Timezone */}
      <div className="form-group">
        <label>
          Timezone <span className="required">*</span>
        </label>
        <TimezoneSelect
          value={form.timezone}
          onChange={(val) => updateField('timezone', val)}
        />
        {errors.timezone && <div className="form-error">{errors.timezone}</div>}
      </div>

      {/* Start */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start-date">
            Start Date <span className="required">*</span>
          </label>
          <input
            id="start-date"
            className={`form-input ${errors.startDate ? 'error' : ''}`}
            type="date"
            value={form.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
          {errors.startDate && <div className="form-error">{errors.startDate}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="start-time">
            Start Time <span className="required">*</span>
          </label>
          <input
            id="start-time"
            className={`form-input ${errors.startTime ? 'error' : ''}`}
            type="time"
            value={form.startTime}
            onChange={(e) => updateField('startTime', e.target.value)}
          />
          {errors.startTime && <div className="form-error">{errors.startTime}</div>}
        </div>
      </div>

      {/* End */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="end-date">
            End Date <span className="required">*</span>
          </label>
          <input
            id="end-date"
            className={`form-input ${errors.endDate ? 'error' : ''}`}
            type="date"
            value={form.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />
          {errors.endDate && <div className="form-error">{errors.endDate}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="end-time">
            End Time <span className="required">*</span>
          </label>
          <input
            id="end-time"
            className={`form-input ${errors.endTime ? 'error' : ''}`}
            type="time"
            value={form.endTime}
            onChange={(e) => updateField('endTime', e.target.value)}
          />
          {errors.endTime && <div className="form-error">{errors.endTime}</div>}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? isEditing ? 'Updating…' : 'Creating…'
            : isEditing ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
