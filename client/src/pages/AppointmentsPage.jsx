import { useMemo, useState } from 'react';
import AppointmentFilters, {
  emptyAppointmentFilters,
  filterAppointments
} from '../components/AppointmentFilters.jsx';
import AppointmentList from '../components/AppointmentList.jsx';
import ConsultationNotePanel from '../components/ConsultationNotePanel.jsx';
import DashboardWelcome from '../components/DashboardWelcome.jsx';
import HealthyLivingGuide from '../components/HealthyLivingGuide.jsx';
import MedicalProfileDetails from '../components/MedicalProfileDetails.jsx';
import ReschedulePanel from '../components/ReschedulePanel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  queryKeys,
  useAppointments,
  useClinicMutation,
  useConsultationNote,
  useDoctors,
  useMedicalProfile,
  useUsers
} from '../hooks/useClinicQueries.js';
import { api } from '../api.js';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const appointments = useAppointments();
  const doctors = useDoctors();
  const users = useUsers(user.role === 'admin');
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [noteAppointment, setNoteAppointment] = useState(null);
  const [noteMessage, setNoteMessage] = useState(null);
  const [profilePatient, setProfilePatient] = useState(null);
  const [appointmentFilters, setAppointmentFilters] = useState(emptyAppointmentFilters);
  const consultationNote = useConsultationNote(noteAppointment?._id);
  const medicalProfile = useMedicalProfile(profilePatient?._id);
  const cancelMutation = useClinicMutation({
    mutationFn: (id) => api(`/api/appointments/${id}/cancel`, { method: 'PATCH' }),
    invalidate: [queryKeys.appointments]
  });
  const completeMutation = useClinicMutation({
    mutationFn: (id) => api(`/api/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }),
    invalidate: [queryKeys.appointments]
  });
  const rescheduleMutation = useClinicMutation({
    mutationFn: ({ id, startTime }) => api(`/api/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ startTime })
    }),
    invalidate: [queryKeys.appointments, queryKeys.allSlots]
  });
  const noteMutation = useClinicMutation({
    mutationFn: ({ id, note }) =>
      api(`/api/appointments/${id}/consultation-note`, {
        method: 'PUT',
        body: JSON.stringify(note)
      }),
    invalidate: noteAppointment ? [queryKeys.consultationNote(noteAppointment._id)] : []
  });
  const filteredAppointments = useMemo(
    () => filterAppointments(appointments.data || [], appointmentFilters),
    [appointments.data, appointmentFilters]
  );

  async function reschedule(payload) {
    try {
      await rescheduleMutation.mutateAsync(payload);
      setRescheduleMessage('Appointment rescheduled. Notifications have been prepared.');
      window.setTimeout(() => {
        setRescheduling(null);
        setRescheduleMessage('');
      }, 1200);
    } catch (mutationError) {
      setRescheduleMessage(mutationError.message);
    }
  }

  async function saveConsultationNote(note) {
    try {
      await noteMutation.mutateAsync({ id: noteAppointment._id, note });
      setNoteMessage({
        type: 'success',
        text:
          note.status === 'finalized'
            ? 'Consultation note finalized for the patient.'
            : 'Draft saved.'
      });
    } catch (mutationError) {
      setNoteMessage({ type: 'error', text: mutationError.message });
    }
  }

  if (appointments.isLoading || doctors.isLoading) return <main className="loading">Loading...</main>;
  const error = appointments.error || doctors.error || users.error;

  return (
    <>
      {error && <p className="error">{error.message}</p>}
      <DashboardWelcome user={user} appointments={appointments.data || []} doctors={doctors.data || []} users={users.data || []} />
      <AppointmentFilters
        filters={appointmentFilters}
        resultCount={filteredAppointments.length}
        onChange={(field, value) =>
          setAppointmentFilters((current) => ({ ...current, [field]: value }))
        }
        onReset={() => setAppointmentFilters(emptyAppointmentFilters)}
      />
      <AppointmentList
        appointments={filteredAppointments}
        totalAppointments={appointments.data?.length || 0}
        hasFilters={Boolean(appointmentFilters.status || appointmentFilters.date)}
        user={user}
        onCancel={(id) => cancelMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
        onReschedule={(appointment) => {
          setRescheduling(appointment);
          setRescheduleMessage('');
        }}
        onConsultationNote={(appointment) => {
          setNoteAppointment(appointment);
          setNoteMessage(null);
        }}
        onMedicalProfile={setProfilePatient}
      />
      {rescheduling && (
        <ReschedulePanel
          appointment={rescheduling}
          pending={rescheduleMutation.isPending}
          message={rescheduleMessage}
          onClose={() => setRescheduling(null)}
          onSubmit={reschedule}
        />
      )}
      {noteAppointment && (
        <ConsultationNotePanel
          appointment={noteAppointment}
          user={user}
          note={consultationNote.data}
          loading={consultationNote.isLoading}
          error={consultationNote.error}
          pending={noteMutation.isPending}
          message={noteMessage}
          onClose={() => {
            setNoteAppointment(null);
            setNoteMessage(null);
          }}
          onSubmit={saveConsultationNote}
        />
      )}
      {profilePatient && (
        <>
          {medicalProfile.isLoading && <section className="panel"><p className="empty">Loading medical profile...</p></section>}
          {medicalProfile.error && <section className="panel"><p className="error">{medicalProfile.error.message}</p></section>}
          {!medicalProfile.isLoading && !medicalProfile.error && (
            <MedicalProfileDetails
              patient={medicalProfile.data?.patient || profilePatient}
              profile={medicalProfile.data?.profile}
              onClose={() => setProfilePatient(null)}
            />
          )}
        </>
      )}
      <HealthyLivingGuide />
    </>
  );
}
