import { Activity, CalendarClock, CheckCircle2, LogOut, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import AuthView from './AuthView.jsx';

const roleIcons = {
  patient: UserRound,
  doctor: Stethoscope,
  admin: ShieldCheck
};

const hospitalName = 'Aarogya Care Hospital';
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function getRoleWelcome(user) {
  if (user.role === 'admin') {
    return 'Monitor clinic operations, user accounts, and appointment activity from one place.';
  }

  if (user.role === 'doctor') {
    return 'Review your patient appointments and keep your weekly availability up to date.';
  }

  return 'Find the right doctor, view available schedules, and manage your clinic visits.';
}

function todayAt(hour) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}

function formatAvailability(availability = []) {
  if (!availability.length) {
    return 'No weekly availability set';
  }

  return availability
    .slice()
    .sort((first, second) => first.dayOfWeek - second.dayOfWeek || first.startTime.localeCompare(second.startTime))
    .map((window) => `${days[window.dayOfWeek]} ${window.startTime}-${window.endTime}`)
    .join(', ');
}

function AppointmentList({ appointments, onCancel, onComplete, user }) {
  const heading = user.role === 'admin' ? 'All appointments' : 'My appointments';
  const emptyText =
    user.role === 'doctor'
      ? 'No patient appointments assigned yet.'
      : user.role === 'patient'
        ? 'No appointments booked yet.'
        : 'No appointments yet.';

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{heading}</h2>
        <span>{appointments.length} total</span>
      </div>
      <div className="appointment-list">
        {appointments.map((appointment) => (
          <article className="appointment-card" key={appointment._id}>
            <div>
              <strong>{formatDateTime(appointment.startTime)}</strong>
              <p>
                {appointment.patient?.name} with {appointment.doctor?.name}
              </p>
              <small>{appointment.reason || 'General consultation'}</small>
            </div>
            <div className="appointment-actions">
              <span className={`status ${appointment.status}`}>{appointment.status}</span>
              {appointment.status === 'booked' && (
                <>
                  {(user.role === 'doctor' || user.role === 'admin') && (
                    <button type="button" onClick={() => onComplete(appointment._id)}>
                      <CheckCircle2 aria-hidden="true" />
                      Complete
                    </button>
                  )}
                  <button type="button" onClick={() => onCancel(appointment._id)}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {!appointments.length && <p className="empty">{emptyText}</p>}
      </div>
    </section>
  );
}

function DashboardWelcome({ appointments, doctors, user, users }) {
  const bookedCount = appointments.filter((appointment) => appointment.status === 'booked').length;
  const completedCount = appointments.filter((appointment) => appointment.status === 'completed').length;
  const cancelledCount = appointments.filter((appointment) => appointment.status === 'cancelled').length;

  const metrics =
    user.role === 'admin'
      ? [
          { label: 'Doctors', value: doctors.length },
          { label: 'Users', value: users.length },
          { label: 'Booked', value: bookedCount }
        ]
      : [
          { label: 'Upcoming', value: bookedCount },
          { label: 'Completed', value: completedCount },
          { label: 'Cancelled', value: cancelledCount }
        ];

  return (
    <section className="welcome-panel">
      <div>
        <span className="eyebrow">{hospitalName}</span>
        <h2>Welcome, {user.name}</h2>
        <p>{getRoleWelcome(user)}</p>
      </div>
      <div className="welcome-metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatientDashboard({ doctors, refresh }) {
  const [form, setForm] = useState({
    doctorId: '',
    startTime: todayAt(9),
    reason: ''
  });
  const [message, setMessage] = useState('');
  const selectedDoctor = doctors.find((doctor) => doctor._id === form.doctorId);

  useEffect(() => {
    if (!form.doctorId && doctors.length) {
      setForm((current) => ({ ...current, doctorId: doctors[0]._id }));
    }
  }, [doctors, form.doctorId]);

  async function book(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString()
        })
      });
      setMessage('Appointment booked.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Book a slot</h2>
        <span>30 min</span>
      </div>
      <form className="grid-form" onSubmit={book}>
        <label>
          Doctor
          <select value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })} required>
            {doctors.map((doctor) => (
              <option value={doctor._id} key={doctor._id}>
                {doctor.name} - {doctor.specialty || 'Clinic doctor'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date and time
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => setForm({ ...form, startTime: event.target.value })}
            required
          />
        </label>
        <label className="full">
          Reason
          <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
        </label>
        <button className="primary" type="submit">Book appointment</button>
        {message && <p className="message">{message}</p>}
      </form>
      {selectedDoctor && (
        <div className="selected-doctor">
          <strong>{selectedDoctor.name}</strong>
          <span>{selectedDoctor.specialty || 'Clinic doctor'}</span>
          <p>{formatAvailability(selectedDoctor.availability)}</p>
        </div>
      )}
      <div className="doctor-directory">
        {doctors.map((doctor) => (
          <article className={doctor._id === form.doctorId ? 'active' : ''} key={doctor._id}>
            <strong>{doctor.name}</strong>
            <span>{doctor.specialty || 'Clinic doctor'}</span>
            <p>{formatAvailability(doctor.availability)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DoctorDashboard({ user, refresh }) {
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '13:00' });
  const [message, setMessage] = useState('');

  async function loadAvailability() {
    const data = await api(`/api/availability?doctorId=${user._id}`);
    setAvailability(data.doctor.availability);
  }

  useEffect(() => {
    loadAvailability().catch(() => setAvailability([]));
  }, [user._id]);

  async function addWindow(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api('/api/availability', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setMessage('Availability added.');
      await loadAvailability();
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Availability</h2>
        <span>{availability.length} windows</span>
      </div>
      <form className="availability-form" onSubmit={addWindow}>
        <select value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}>
          {days.map((day, index) => (
            <option value={index} key={day}>{day}</option>
          ))}
        </select>
        <input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
        <input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
        <button className="primary" type="submit">Add</button>
      </form>
      <div className="chips">
        {availability.map((window) => (
          <span key={window._id}>{days[window.dayOfWeek]} {window.startTime}-{window.endTime}</span>
        ))}
      </div>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function AdminDashboard({ refresh, users }) {
  const counts = useMemo(
    () => users.reduce((acc, user) => ({ ...acc, [user.role]: (acc[user.role] || 0) + 1 }), {}),
    [users]
  );
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    username: '',
    email: '',
    password: 'Doctor123!',
    specialty: '',
    phone: ''
  });
  const [message, setMessage] = useState('');

  async function createDoctor(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api('/api/users/doctors', {
        method: 'POST',
        body: JSON.stringify(doctorForm)
      });
      setDoctorForm({
        name: '',
        username: '',
        email: '',
        password: 'Doctor123!',
        specialty: '',
        phone: ''
      });
      setMessage('Doctor account created and approved.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function toggleUser(user) {
    await api(`/api/users/${user._id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !user.isActive })
    });
    await refresh();
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <h2>Create doctor account</h2>
          <span>Admin approved</span>
        </div>
        <form className="grid-form" onSubmit={createDoctor}>
          <label>
            Doctor name
            <input value={doctorForm.name} onChange={(event) => setDoctorForm({ ...doctorForm, name: event.target.value })} required />
          </label>
          <label>
            Username
            <input value={doctorForm.username} onChange={(event) => setDoctorForm({ ...doctorForm, username: event.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={doctorForm.email} onChange={(event) => setDoctorForm({ ...doctorForm, email: event.target.value })} required />
          </label>
          <label>
            Temporary password
            <input type="password" value={doctorForm.password} onChange={(event) => setDoctorForm({ ...doctorForm, password: event.target.value })} required />
          </label>
          <label>
            Specialty
            <input value={doctorForm.specialty} onChange={(event) => setDoctorForm({ ...doctorForm, specialty: event.target.value })} required />
          </label>
          <label>
            Phone
            <input value={doctorForm.phone} onChange={(event) => setDoctorForm({ ...doctorForm, phone: event.target.value })} />
          </label>
          <button className="primary" type="submit">Create doctor</button>
          {message && <p className="message">{message}</p>}
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Administration</h2>
          <span>{users.length} users</span>
        </div>
        <div className="metric-row">
          <div><strong>{counts.patient || 0}</strong><span>Patients</span></div>
          <div><strong>{counts.doctor || 0}</strong><span>Doctors</span></div>
          <div><strong>{counts.admin || 0}</strong><span>Admins</span></div>
        </div>
        <div className="user-table">
          {users.map((user) => (
            <div className="user-row" key={user._id}>
              <span>{user.name}</span>
              <span>{user.email}</span>
              <span>{user.role}</span>
              <button className="compact-button" type="button" onClick={() => toggleUser(user)}>
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SecurityPanel({ onSignedOut }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  async function changePassword(event) {
    event.preventDefault();
    setMessage('');

    try {
      const data = await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setMessage(data.message);
      window.setTimeout(onSignedOut, 800);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Account security</h2>
        <span>All sessions revoked after change</span>
      </div>
      <form className="grid-form" onSubmit={changePassword}>
        <label>
          Current password
          <input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required />
        </label>
        <label>
          New password
          <input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required />
        </label>
        <button className="primary" type="submit">Change password</button>
        {message && <p className="message">{message}</p>}
      </form>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setError('');
    const [appointmentData, doctorData] = await Promise.all([
      api('/api/appointments'),
      api('/api/users/doctors')
    ]);

    setAppointments(appointmentData.appointments);
    setDoctors(doctorData.doctors);

    if (user?.role === 'admin') {
      const userData = await api('/api/users');
      setUsers(userData.users);
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        const data = await api('/api/auth/me');
        setUser(data.user);
      } catch (_err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboard().catch((err) => setError(err.message));
    }
  }, [user]);

  async function setStatus(id, status) {
    await api(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    await loadDashboard();
  }

  async function cancel(id) {
    await api(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
    await loadDashboard();
  }

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' }, false);
    } catch (_error) {
      // Local sign-out still completes if the session already expired.
    }
    setUser(null);
    setAppointments([]);
    setDoctors([]);
    setUsers([]);
  }

  if (loading) {
    return <main className="loading">Loading...</main>;
  }

  if (!user) {
    return <AuthView onAuth={setUser} />;
  }

  const RoleIcon = roleIcons[user.role] || Activity;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-row">
            <CalendarClock aria-hidden="true" />
          <div>
            <h1>{hospitalName}</h1>
            <p>Signed in as {user.name}</p>
          </div>
        </div>
        <div className="profile-pill">
          <RoleIcon aria-hidden="true" />
          <span>{user.role}</span>
          <button type="button" onClick={logout} title="Sign out">
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <DashboardWelcome appointments={appointments} doctors={doctors} user={user} users={users} />

      <div className="dashboard-grid">
        <div className="main-column">
          {user.role === 'patient' && <PatientDashboard doctors={doctors} refresh={loadDashboard} />}
          {user.role === 'doctor' && <DoctorDashboard user={user} refresh={loadDashboard} />}
          {user.role === 'admin' && <AdminDashboard users={users} refresh={loadDashboard} />}
          <SecurityPanel onSignedOut={logout} />
        </div>
        <AppointmentList
          appointments={appointments}
          onCancel={cancel}
          onComplete={(id) => setStatus(id, 'completed')}
          user={user}
        />
      </div>
    </main>
  );
}
