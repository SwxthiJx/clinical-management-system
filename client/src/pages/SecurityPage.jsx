import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { api } from '../api.js';
import PasswordInput from '../PasswordInput.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SecurityPage() {
  const { logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  return (
    <div className="main-column narrow-content">
      <PageHeader
        eyebrow="Account"
        title="Security settings"
        description="Update your password and protect access to your clinical workspace."
        icon={LockKeyhole}
      />
      <section className="panel">
        <div className="panel-heading"><h2>Change password</h2><span>All sessions revoked after change</span></div>
        <form className="grid-form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const data = await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify(form) });
            setMessage(data.message);
            window.setTimeout(logout, 800);
          } catch (error) { setMessage(error.message); }
        }}>
          <label>Current password<PasswordInput value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required /></label>
          <label>New password<PasswordInput value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required /></label>
          <button className="primary" type="submit">Change password</button>{message && <p className="message">{message}</p>}
        </form>
      </section>
    </div>
  );
}
