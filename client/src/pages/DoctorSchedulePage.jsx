import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { days } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useAvailability, useClinicMutation, useExceptions } from '../hooks/useClinicQueries.js';
import { tomorrowDate } from '../utils/formatters.js';

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const availability = useAvailability(user._id);
  const exceptions = useExceptions(user._id);
  const [windowForm, setWindowForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '13:00' });
  const [exceptionForm, setExceptionForm] = useState({ date: tomorrowDate(), reason: '' });
  const [message, setMessage] = useState('');
  const addWindow = useClinicMutation({
    mutationFn: () => api('/api/availability', { method: 'POST', body: JSON.stringify(windowForm) }),
    invalidate: [queryKeys.availability(user._id), queryKeys.doctors]
  });
  const addException = useClinicMutation({
    mutationFn: () => api('/api/availability/exceptions', { method: 'POST', body: JSON.stringify(exceptionForm) }),
    invalidate: [queryKeys.exceptions(user._id)]
  });
  const removeException = useClinicMutation({
    mutationFn: (id) => api(`/api/availability/exceptions/${id}`, { method: 'DELETE' }),
    invalidate: [queryKeys.exceptions(user._id)]
  });

  if (user.role !== 'doctor') return <Navigate to="/appointments" replace />;

  return (
    <div className="main-column">
      <section className="panel">
        <div className="panel-heading"><h2>Availability</h2><span>{availability.data?.length || 0} windows</span></div>
        <form className="availability-form" onSubmit={async (event) => {
          event.preventDefault();
          try { await addWindow.mutateAsync(); setMessage('Availability added.'); } catch (error) { setMessage(error.message); }
        }}>
          <select value={windowForm.dayOfWeek} onChange={(event) => setWindowForm({ ...windowForm, dayOfWeek: Number(event.target.value) })}>
            {days.map((day, index) => <option value={index} key={day}>{day}</option>)}
          </select>
          <input type="time" value={windowForm.startTime} onChange={(event) => setWindowForm({ ...windowForm, startTime: event.target.value })} />
          <input type="time" value={windowForm.endTime} onChange={(event) => setWindowForm({ ...windowForm, endTime: event.target.value })} />
          <button className="primary" type="submit">Add</button>
        </form>
        <div className="chips">{(availability.data || []).map((window) => <span key={window._id}>{days[window.dayOfWeek]} {window.startTime}-{window.endTime}</span>)}</div>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Blocked dates</h2><span>{exceptions.data?.length || 0} exceptions</span></div>
        <form className="availability-form" onSubmit={async (event) => {
          event.preventDefault();
          try { await addException.mutateAsync(); setMessage('Blocked date added.'); } catch (error) { setMessage(error.message); }
        }}>
          <input type="date" value={exceptionForm.date} onChange={(event) => setExceptionForm({ ...exceptionForm, date: event.target.value })} />
          <input placeholder="Reason" value={exceptionForm.reason} onChange={(event) => setExceptionForm({ ...exceptionForm, reason: event.target.value })} />
          <button className="primary" type="submit">Block date</button>
        </form>
        <div className="chips">{(exceptions.data || []).map((item) => <button className="chip-button" key={item._id} type="button" onClick={() => removeException.mutate(item._id)}>{item.date}{item.reason ? ` - ${item.reason}` : ''}</button>)}</div>
        {message && <p className="message">{message}</p>}
      </section>
    </div>
  );
}
