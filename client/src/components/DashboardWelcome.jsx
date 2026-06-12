import { hospitalName } from '../constants.js';

function roleCopy(role) {
  if (role === 'admin') return 'Monitor clinic operations, user accounts, and appointment activity.';
  if (role === 'doctor') return 'Review patient appointments and maintain your clinic schedule.';
  return 'Find a doctor, choose an available slot, and manage your visits.';
}

export default function DashboardWelcome({ user, appointments = [], doctors = [], users = [] }) {
  const booked = appointments.filter((item) => item.status === 'booked').length;
  const completed = appointments.filter((item) => item.status === 'completed').length;
  const cancelled = appointments.filter((item) => item.status === 'cancelled').length;
  const metrics = user.role === 'admin'
    ? [{ label: 'Doctors', value: doctors.length }, { label: 'Users', value: users.length }, { label: 'Booked', value: booked }]
    : [{ label: 'Upcoming', value: booked }, { label: 'Completed', value: completed }, { label: 'Cancelled', value: cancelled }];

  return (
    <section className="welcome-panel">
      <div><span className="eyebrow">{hospitalName}</span><h2>Welcome, {user.name}</h2><p>{roleCopy(user.role)}</p></div>
      <div className="welcome-metrics">
        {metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
      </div>
    </section>
  );
}
