import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api.js';

export const queryKeys = {
  appointments: ['appointments'],
  doctors: ['doctors'],
  users: ['users'],
  systemStatus: ['system-status'],
  auditLogs: ['audit-logs'],
  availability: (doctorId) => ['availability', doctorId],
  exceptions: (doctorId) => ['exceptions', doctorId],
  allSlots: ['slots'],
  slots: (doctorId, date) => ['slots', doctorId, date]
};

export function useAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: () => api('/api/appointments').then((data) => data.appointments)
  });
}

export function useDoctors() {
  return useQuery({
    queryKey: queryKeys.doctors,
    queryFn: () => api('/api/users/doctors').then((data) => data.doctors)
  });
}

export function useUsers(enabled) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api('/api/users').then((data) => data.users),
    enabled
  });
}

export function useSystemStatus(enabled) {
  return useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: () => api('/api/system/status'),
    enabled,
    refetchInterval: 30_000
  });
}

export function useAuditLogs(enabled) {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: () => api('/api/system/audit-logs?limit=50').then((data) => data.auditLogs),
    enabled
  });
}

export function useSlots(doctorId, date) {
  return useQuery({
    queryKey: queryKeys.slots(doctorId, date),
    queryFn: () =>
      api(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`).then((data) => data.slots),
    enabled: Boolean(doctorId && date)
  });
}

export function useAvailability(doctorId) {
  return useQuery({
    queryKey: queryKeys.availability(doctorId),
    queryFn: () =>
      api(`/api/availability?doctorId=${doctorId}`).then((data) => data.doctor.availability),
    enabled: Boolean(doctorId)
  });
}

export function useExceptions(doctorId) {
  return useQuery({
    queryKey: queryKeys.exceptions(doctorId),
    queryFn: () =>
      api(`/api/availability/exceptions?doctorId=${doctorId}`).then((data) => data.exceptions),
    enabled: Boolean(doctorId)
  });
}

export function useClinicMutation({ mutationFn, invalidate = [] }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })));
    }
  });
}
