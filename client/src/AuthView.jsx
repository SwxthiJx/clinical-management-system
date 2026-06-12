import { CalendarClock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from './api.js';

const hospitalName = 'Aarogya Care Hospital';
const demoLogins = [
  { role: 'Patient', name: 'Alex Patient', login: 'alex-patient', password: 'Patient123!' },
  { role: 'Doctor', name: 'Dr. Maya Rao', login: 'dr-maya-rao', password: 'Doctor123!' },
  { role: 'Doctor', name: 'Dr. Arjun Mehta', login: 'dr-arjun-mehta', password: 'Doctor123!' },
  { role: 'Doctor', name: 'Dr. Neha Iyer', login: 'dr-neha-iyer', password: 'Doctor123!' },
  { role: 'Doctor', name: 'Dr. Farah Khan', login: 'dr-farah-khan', password: 'Doctor123!' },
  { role: 'Doctor', name: 'Dr. Kabir Sen', login: 'dr-kabir-sen', password: 'Doctor123!' },
  { role: 'Doctor', name: 'Dr. Sara Thomas', login: 'dr-sara-thomas', password: 'Doctor123!' },
  { role: 'Admin', name: 'Clinic Admin', login: 'clinic-admin', password: 'Admin1234!' }
];

export default function AuthView({ onAuth }) {
  const query = new URLSearchParams(window.location.search);
  const resetToken = query.get('resetToken');
  const verifyToken = query.get('verifyToken');
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    login: 'alex-patient',
    password: 'Patient123!',
    phone: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!verifyToken) return;

    api('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: verifyToken })
    })
      .then((data) => {
        setMessage(data.message);
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch((err) => setError(err.message));
  }, [verifyToken]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ login: form.login, password: form.password })
        });
        onAuth(data.user);
        return;
      }

      if (mode === 'register') {
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone
          })
        });
        setMessage(data.message);
        return;
      }

      if (mode === 'forgot') {
        const data = await api('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: form.email })
        });
        setMessage(data.message);
        return;
      }

      if (mode === 'reset') {
        const data = await api('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password: form.newPassword })
        });
        setMessage(data.message);
        window.history.replaceState({}, '', window.location.pathname);
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-row">
          <CalendarClock aria-hidden="true" />
          <div>
            <h1>{hospitalName}</h1>
            <p>Welcome to your secure clinic appointment portal.</p>
          </div>
        </div>

        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="segmented">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} type="button">
              Patient registration
            </button>
          </div>
        )}

        <form onSubmit={submit} className="stack">
          {mode === 'register' && (
            <>
              <label>
                Name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label>
                Phone
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
            </>
          )}

          {mode === 'login' && (
            <label>
              Email or username
              <input value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} required />
            </label>
          )}

          {mode === 'forgot' && (
            <label>
              Account email
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
          )}

          {(mode === 'login' || mode === 'register') && (
            <label>
              Password
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
              {mode === 'register' && <small>Use 10+ characters with uppercase, lowercase, number, and symbol.</small>}
            </label>
          )}

          {mode === 'reset' && (
            <label>
              New password
              <input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required />
            </label>
          )}

          {error && <p className="error">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button className="primary" type="submit">
            {mode === 'login' && 'Sign in'}
            {mode === 'register' && 'Create patient account'}
            {mode === 'forgot' && 'Send reset link'}
            {mode === 'reset' && 'Reset password'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="text-button" type="button" onClick={() => switchMode('forgot')}>
            Forgot password?
          </button>
        )}
        {(mode === 'forgot' || mode === 'reset') && (
          <button className="text-button" type="button" onClick={() => switchMode('login')}>
            Back to login
          </button>
        )}

        {mode === 'login' && (
          <div className="demo-logins">
            <h2>Demo logins</h2>
            {demoLogins.map((account) => (
              <button
                key={account.login}
                type="button"
                onClick={() => setForm({ ...form, login: account.login, password: account.password })}
              >
                <span>{account.role}</span>
                <strong>{account.name}</strong>
                <small>{account.password}</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
