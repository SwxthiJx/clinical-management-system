import { ArrowRight, CalendarClock, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { hospitalName } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const roles = [
  {
    name: 'Patient',
    role: 'patient',
    description: 'Book appointments and manage your care.',
    image: '/images/patient-login.jpg',
    icon: UserRound
  },
  {
    name: 'Doctor',
    role: 'doctor',
    description: 'Review appointments, schedules, and notes.',
    image: '/images/doctor-login.jpg',
    icon: Stethoscope
  },
  {
    name: 'Admin',
    role: 'admin',
    description: 'Manage clinic users, operations, and analytics.',
    image: '/images/admin-login.jpg',
    icon: ShieldCheck
  }
];

export default function WelcomePage() {
  const { user, loading } = useAuth();

  if (loading) return <main className="loading">Loading...</main>;
  if (user) return <Navigate to="/appointments" replace />;

  return (
    <main className="welcome-shell">
      <header className="welcome-brand">
        <CalendarClock aria-hidden="true" />
        <div>
          <span>Secure care portal</span>
          <h1>{hospitalName}</h1>
        </div>
      </header>

      <section className="welcome-intro">
        <div>
          <span className="eyebrow">Welcome</span>
          <h2>Choose how you would like to sign in</h2>
        </div>
        <p>Select your account type to continue to the appropriate clinic workspace.</p>
      </section>

      <section className="role-choice-grid" aria-label="Choose account type">
        {roles.map(({ name, role, description, image, icon: Icon }) => (
          <Link className={`role-choice role-${role}`} to={`/login?role=${role}`} key={role}>
            <img src={image} alt={`${name} portal illustration`} />
            <div className="role-choice-content">
              <div className="role-choice-title">
                <Icon aria-hidden="true" />
                <h3>{name}</h3>
              </div>
              <p>{description}</p>
              <span>Continue as {name}<ArrowRight aria-hidden="true" /></span>
            </div>
          </Link>
        ))}
      </section>

      <footer className="welcome-footer">
        <span>Private and secure access</span>
        <span>{hospitalName}</span>
      </footer>
    </main>
  );
}
