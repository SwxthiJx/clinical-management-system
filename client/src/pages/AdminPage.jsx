import { useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import PasswordInput from '../PasswordInput.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useClinicMutation, useUsers } from '../hooks/useClinicQueries.js';

const emptyDoctorForm = {
  name: '',
  username: '',
  email: '',
  password: 'Doctor123!',
  specialty: '',
  phone: '',
  education: '',
  experienceYears: 0,
  languages: '',
  clinicalInterests: '',
  bio: ''
};

function listFromInput(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function AdminPage() {
  const { user } = useAuth();
  const usersQuery = useUsers(user.role === 'admin');
  const [form, setForm] = useState(emptyDoctorForm);
  const [message, setMessage] = useState('');
  const createDoctor = useClinicMutation({
    mutationFn: () => api('/api/users/doctors', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        education: listFromInput(form.education),
        languages: listFromInput(form.languages),
        clinicalInterests: listFromInput(form.clinicalInterests)
      })
    }),
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
      <PageHeader
        eyebrow="Administration"
        title="People and access"
        description="Create clinician accounts and manage access across the hospital workspace."
        icon={UsersRound}
      />
      <section className="panel">
        <div className="panel-heading"><h2>Create doctor account</h2><span>Admin approved</span></div>
        <form className="grid-form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await createDoctor.mutateAsync();
            setForm(emptyDoctorForm);
            setMessage('Doctor account created.');
          } catch (error) { setMessage(error.message); }
        }}>
          <label>Doctor name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Temporary password<PasswordInput value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
          <label>Specialty<input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} required /></label>
          <label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label>Education<input placeholder="MBBS, MD General Medicine" value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} /></label>
          <label>Years of experience<input type="number" min="0" max="70" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} /></label>
          <label>Languages<input placeholder="English, Hindi" value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} /></label>
          <label>Clinical interests<input placeholder="Preventive care, Diabetes" value={form.clinicalInterests} onChange={(event) => setForm({ ...form, clinicalInterests: event.target.value })} /></label>
          <label className="full">Professional summary<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          <button className="primary" type="submit">Create doctor</button>{message && <p className="message">{message}</p>}
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Administration</h2><span>{users.length} users</span></div>
        <div className="metric-row"><div><strong>{counts.patient || 0}</strong><span>Patients</span></div><div><strong>{counts.doctor || 0}</strong><span>Doctors</span></div><div><strong>{counts.admin || 0}</strong><span>Admins</span></div></div>
        <div className="user-table">
          <div className="user-row user-table-header" aria-hidden="true">
            <span>Name</span><span>Email</span><span>Role</span><span>Verification</span><span>Access</span>
          </div>
          {users.map((item) => (
            <div className="user-row" key={item._id}>
              <strong>{item.name}</strong>
              <span>{item.email}</span>
              <span className={`role-badge ${item.role}`}>{item.role}</span>
              <span className={`verification-badge ${item.emailVerifiedAt ? 'verified' : 'unverified'}`}>
                {item.emailVerifiedAt ? 'Verified' : 'Unverified'}
              </span>
              <button
                className={`compact-button ${item.isActive ? 'deactivate-button' : 'activate-button'}`}
                type="button"
                onClick={() => toggleUser.mutate(item)}
              >
                {item.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
