import AppointmentList from '../components/AppointmentList.jsx';
import DashboardWelcome from '../components/DashboardWelcome.jsx';
import HealthyLivingGuide from '../components/HealthyLivingGuide.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { queryKeys, useAppointments, useClinicMutation, useDoctors, useUsers } from '../hooks/useClinicQueries.js';
import { api } from '../api.js';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const appointments = useAppointments();
  const doctors = useDoctors();
  const users = useUsers(user.role === 'admin');
  const cancelMutation = useClinicMutation({
    mutationFn: (id) => api(`/api/appointments/${id}/cancel`, { method: 'PATCH' }),
    invalidate: [queryKeys.appointments]
  });
  const completeMutation = useClinicMutation({
    mutationFn: (id) => api(`/api/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }),
    invalidate: [queryKeys.appointments]
  });

  if (appointments.isLoading || doctors.isLoading) return <main className="loading">Loading...</main>;
  const error = appointments.error || doctors.error || users.error;

  return (
    <>
      {error && <p className="error">{error.message}</p>}
      <DashboardWelcome user={user} appointments={appointments.data || []} doctors={doctors.data || []} users={users.data || []} />
      <AppointmentList
        appointments={appointments.data || []}
        user={user}
        onCancel={(id) => cancelMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
      />
      <HealthyLivingGuide />
    </>
  );
}
