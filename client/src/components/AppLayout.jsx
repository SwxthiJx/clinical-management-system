import { Activity, CalendarClock, CalendarPlus, ChartNoAxesCombined, ClipboardList, HeartPulse, LogOut, MonitorCog, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { hospitalName } from '../constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import WellnessBanner from './WellnessBanner.jsx';

const roleIcons = { patient: UserRound, doctor: Stethoscope, admin: ShieldCheck };
const roleLabels = { patient: 'Patient', doctor: 'Doctor', admin: 'Administrator' };
const routeTitles = {
  '/appointments': 'Appointments',
  '/book': 'Book appointment',
  '/medical-profile': 'Medical profile',
  '/schedule': 'Schedule',
  '/admin': 'User administration',
  '/analytics': 'Analytics',
  '/operations': 'Operations',
  '/security': 'Account security'
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const RoleIcon = roleIcons[user.role] || Activity;
  const location = useLocation();

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo"><CalendarClock aria-hidden="true" /></span>
          <div>
            <strong>{hospitalName}</strong>
            <span>Clinical workspace</span>
          </div>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          <span className="nav-section-label">Workspace</span>
          <NavLink to="/appointments"><ClipboardList aria-hidden="true" />Appointments</NavLink>
          {user.role === 'patient' && <NavLink to="/book"><CalendarPlus aria-hidden="true" />Book appointment</NavLink>}
          {user.role === 'patient' && <NavLink to="/medical-profile"><HeartPulse aria-hidden="true" />Medical profile</NavLink>}
          {user.role === 'doctor' && <NavLink to="/schedule"><CalendarClock aria-hidden="true" />Schedule</NavLink>}
          {user.role === 'admin' && <NavLink to="/admin"><ShieldCheck aria-hidden="true" />Administration</NavLink>}
          {user.role === 'admin' && <NavLink to="/analytics"><ChartNoAxesCombined aria-hidden="true" />Analytics</NavLink>}
          {user.role === 'admin' && <NavLink to="/operations"><MonitorCog aria-hidden="true" />Operations</NavLink>}
          <span className="nav-section-label nav-account-label">Account</span>
          <NavLink to="/security"><UserRound aria-hidden="true" />Security</NavLink>
        </nav>

        <div className="sidebar-profile">
          <span className="sidebar-avatar"><RoleIcon aria-hidden="true" /></span>
          <div>
            <strong>{user.name}</strong>
            <span>{roleLabels[user.role] || user.role}</span>
          </div>
          <button type="button" onClick={logout} title="Sign out" aria-label="Sign out">
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </aside>

      <section className="app-workspace">
        <header className="workspace-topbar">
          <div>
            <span>{roleLabels[user.role] || user.role} workspace</span>
            <strong>{routeTitles[location.pathname] || 'Aarogya Care'}</strong>
          </div>
          <div className="workspace-user">
            <RoleIcon aria-hidden="true" />
            <span>{user.name}</span>
          </div>
        </header>

        <div className="app-content">
          <WellnessBanner role={user.role} />
          <Outlet />
          <footer className="app-footer">
            <p>Care for your body, make room for rest, and seek professional advice when something feels wrong.</p>
            <span>{hospitalName}</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
