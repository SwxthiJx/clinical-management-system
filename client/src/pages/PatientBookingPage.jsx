import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import DoctorProfileCard from '../components/DoctorProfileCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useClinicMutation, useDoctors, useSlots } from '../hooks/useClinicQueries.js';
import { createIdempotencyKey, tomorrowDate } from '../utils/formatters.js';

export default function PatientBookingPage() {
  const { user } = useAuth();
  const doctorsQuery = useDoctors();
  const [form, setForm] = useState({ doctorId: '', date: tomorrowDate(), startTime: '', reason: '' });
  const slotsQuery = useSlots(form.doctorId, form.date);
  const [message, setMessage] = useState('');
  const booking = useClinicMutation({
    mutationFn: (payload) => api('/api/appointments', { method: 'POST', body: JSON.stringify(payload) }),
    invalidate: [queryKeys.appointments, queryKeys.slots(form.doctorId, form.date)]
  });

  useEffect(() => {
    if (!form.doctorId && doctorsQuery.data?.length) {
      setForm((current) => ({ ...current, doctorId: doctorsQuery.data[0]._id }));
    }
  }, [doctorsQuery.data, form.doctorId]);

  if (user.role !== 'patient') return <Navigate to="/appointments" replace />;
  const doctors = doctorsQuery.data || [];
  const selectedDoctor = doctors.find((doctor) => doctor._id === form.doctorId);

  async function submit(event) {
    event.preventDefault();
    if (!form.startTime) return setMessage('Choose an available slot first.');
    try {
      await booking.mutateAsync({
        doctorId: form.doctorId,
        startTime: form.startTime,
        reason: form.reason,
        idempotencyKey: createIdempotencyKey()
      });
      setMessage('Appointment booked.');
      setForm((current) => ({ ...current, startTime: '', reason: '' }));
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="main-column">
      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Medical team</span><h2>Choose your doctor</h2></div>
          <span>{doctors.length} profiles</span>
        </div>
        <div className="doctor-profile-grid">
          {doctors.map((doctor) => (
            <DoctorProfileCard
              doctor={doctor}
              key={doctor._id}
              selected={doctor._id === form.doctorId}
              onSelect={(doctorId) => setForm({ ...form, doctorId, startTime: '' })}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Book with {selectedDoctor?.name || 'a doctor'}</h2>
          <span>30 min</span>
        </div>
        <form className="grid-form" onSubmit={submit}>
          <label>Selected doctor
            <select value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value, startTime: '' })}>
              {doctors.map((doctor) => <option value={doctor._id} key={doctor._id}>{doctor.name} - {doctor.specialty}</option>)}
            </select>
          </label>
          <label>Date
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value, startTime: '' })} />
          </label>
          <div className="slot-picker full">
            {slotsQuery.isLoading && <p>Loading available slots...</p>}
            {(slotsQuery.data || []).map((slot) => (
              <button className={form.startTime === slot.startTime ? 'active' : ''} key={slot.startTime} type="button" onClick={() => setForm({ ...form, startTime: slot.startTime })}>{slot.label}</button>
            ))}
            {!slotsQuery.isLoading && !slotsQuery.data?.length && <p className="empty compact">No available slots for this date.</p>}
          </div>
          <label className="full">Reason
            <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
          </label>
          <button className="primary" type="submit" disabled={booking.isPending}>Book appointment</button>
          {message && <p className="message">{message}</p>}
        </form>
      </section>
    </div>
  );
}
