import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import PasswordInput from '../PasswordInput.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useClinicMutation, useUsers } from '../hooks/useClinicQueries.js';

export default function AdminPage() {
  const { user } = useAuth();
  const usersQuery = useUsers(user.role === 'admin');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: 'Doctor123!', specialty: '', phone: '' });
  const [message, setMessage] = useState('');
  const createDoctor = useClinicMutation({
    mutationFn: () => api('/api/users/doctors', { method: 'POST', body: JSON.stringify(form) }),
    invalidate: [queryKeys.users, queryKeys.doctors]
  });
  const toggleUser = useClinicMutation({
    mutationFn: (target) => api(`/api/users/${target._id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive: !target.isActive }) }),
    invalidate: [queryKeys.users, queryKeys.doctors]
  });
  const users = usersQuery.data || [];
  const counts = useMemo(() => users.reduce((result, item) => ({ ...result, [item.role]: (result[item.role] || 0) + 1 }), {}), [users]);

  if (user.role !== 'admin') return <Navigate to="/appointments" replace />;

  return (
    <div className="main-column">
      <section className="panel">
        <div className="panel-heading"><h2>Create doctor account</h2><span>Admin approved</span></div>
        <form className="grid-form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await createDoctor.mutateAsync();
            setForm({ name: '', username: '', email: '', password: 'Doctor123!', specialty: '', phone: '' });
            setMessage('Doctor account created.');
          } catch (error) { setMessage(error.message); }
        }}>
          <label>Doctor name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Temporary password<PasswordInput value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
          <label>Specialty<input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} required /></label>
          <label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <button className="primary" type="submit">Create doctor</button>{message && <p className="message">{message}</p>}
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Administration</h2><span>{users.length} users</span></div>
        <div className="metric-row"><div><strong>{counts.patient || 0}</strong><span>Patients</span></div><div><strong>{counts.doctor || 0}</strong><span>Doctors</span></div><div><strong>{counts.admin || 0}</strong><span>Admins</span></div></div>
        <div className="user-table">{users.map((item) => <div className="user-row" key={item._id}><span>{item.name}</span><span>{item.email}</span><span>{item.role}</span><span>{item.emailVerifiedAt ? 'Verified' : 'Unverified'}</span><button className="compact-button" type="button" onClick={() => toggleUser.mutate(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></div>)}</div>
      </section>
    </div>
  );
}
