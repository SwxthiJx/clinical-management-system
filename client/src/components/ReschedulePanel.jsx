import { CalendarSync, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSlots } from '../hooks/useClinicQueries.js';
import { dateInputValue, tomorrowDate } from '../utils/formatters.js';

export default function ReschedulePanel({ appointment, pending, message, onClose, onSubmit }) {
  const initialDate = dateInputValue(appointment.startTime);
  const [date, setDate] = useState(initialDate < dateInputValue(new Date()) ? tomorrowDate() : initialDate);
  const [startTime, setStartTime] = useState('');
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const slots = useSlots(doctorId, date);

  useEffect(() => setStartTime(''), [date, appointment._id]);

  return (
    <section className="reschedule-panel" aria-labelledby="reschedule-title">
      <div className="reschedule-heading">
        <div>
          <span className="eyebrow">Change appointment</span>
          <h3 id="reschedule-title">Reschedule with {appointment.doctor?.name}</h3>
        </div>
        <button className="icon-button" type="button" onClick={onClose} title="Close rescheduling">
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="reschedule-controls">
        <label>New date
          <input
            type="date"
            min={dateInputValue(new Date())}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <div className="slot-picker">
          {slots.isLoading && <p>Loading available slots...</p>}
          {(slots.data || []).map((slot) => (
            <button
              className={startTime === slot.startTime ? 'active' : ''}
              key={slot.startTime}
              type="button"
              onClick={() => setStartTime(slot.startTime)}
            >
              {slot.label}
            </button>
          ))}
          {!slots.isLoading && !slots.data?.length && (
            <p className="empty compact">No available slots for this date.</p>
          )}
        </div>
      </div>
      <div className="reschedule-footer">
        <button
          className="primary"
          type="button"
          disabled={!startTime || pending}
          onClick={() => onSubmit({ id: appointment._id, startTime })}
        >
          <CalendarSync aria-hidden="true" />
          Confirm new time
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </section>
  );
}
