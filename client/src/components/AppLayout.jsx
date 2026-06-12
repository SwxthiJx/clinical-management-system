import { Activity, CalendarClock, CalendarPlus, ClipboardList, LogOut, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { hospitalName } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import WellnessBanner from './WellnessBanner.jsx';

const roleIcons = { patient: UserRound, doctor: Stethoscope, admin: ShieldCheck };

export default function AppLayout() {
  const { user, logout } = useAuth();
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
          <button type="button" onClick={logout} title="Sign out"><LogOut aria-hidden="true" /></button>
        </div>
      </header>

      <nav className="app-nav" aria-label="Primary navigation">
        <NavLink to="/appointments"><ClipboardList aria-hidden="true" />Appointments</NavLink>
        {user.role === 'patient' && <NavLink to="/book"><CalendarPlus aria-hidden="true" />Book</NavLink>}
        {user.role === 'doctor' && <NavLink to="/schedule"><CalendarClock aria-hidden="true" />Schedule</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin"><ShieldCheck aria-hidden="true" />Admin</NavLink>}
        <NavLink to="/security"><UserRound aria-hidden="true" />Security</NavLink>
      </nav>
      <WellnessBanner role={user.role} />
      <Outlet />
      <footer className="app-footer">
        <p>Care for your body, make room for rest, and seek professional advice when something feels wrong.</p>
        <span>{hospitalName}</span>
      </footer>
    </main>
  );
}
