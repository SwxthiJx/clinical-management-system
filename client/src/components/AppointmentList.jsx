import { CalendarSync, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../utils/formatters.js';

export default function AppointmentList({ appointments, user, onCancel, onComplete, onReschedule }) {
  const heading = user.role === 'admin' ? 'All appointments' : 'My appointments';
  return (
    <section className="panel">
      <div className="panel-heading"><h2>{heading}</h2><span>{appointments.length} total</span></div>
      <div className="appointment-list">
        {appointments.map((appointment) => (
          <article className="appointment-card" key={appointment._id}>
            <div>
              <strong>{formatDateTime(appointment.startTime)}</strong>
              <p>{appointment.patient?.name} with {appointment.doctor?.name}</p>
              <small>{appointment.reason || 'General consultation'}</small>
            </div>
            <div className="appointment-actions">
              <span className={`status ${appointment.status}`}>{appointment.status}</span>
              {appointment.status === 'booked' && (
                <>
                  <button type="button" onClick={() => onReschedule(appointment)}>
                    <CalendarSync aria-hidden="true" />Reschedule
                  </button>
                  {(user.role === 'doctor' || user.role === 'admin') && (
                    <button type="button" onClick={() => onComplete(appointment._id)}>
                      <CheckCircle2 aria-hidden="true" />Complete
                    </button>
                  )}
                  <button type="button" onClick={() => onCancel(appointment._id)}>Cancel</button>
                </>
              )}
            </div>
          </article>
        ))}
        {!appointments.length && <p className="empty">No appointments found.</p>}
      </div>
    </section>
  );
}
