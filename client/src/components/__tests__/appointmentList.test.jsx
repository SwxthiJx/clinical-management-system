import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppointmentList from '../AppointmentList.jsx';

afterEach(cleanup);

const appointment = {
  _id: 'appointment-1',
  startTime: '2026-06-20T03:30:00.000Z',
  status: 'booked',
  reason: 'Follow-up',
  patient: { name: 'Priya Nair' },
  doctor: { name: 'Dr. Maya Rao' }
};

describe('AppointmentList consultation note actions', () => {
  it('lets a patient check notes before an appointment is completed', () => {
    const onConsultationNote = vi.fn();
    render(
      <AppointmentList
        appointments={[appointment]}
        user={{ role: 'patient' }}
        onCancel={() => {}}
        onComplete={() => {}}
        onReschedule={() => {}}
        onConsultationNote={onConsultationNote}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View notes' }));
    expect(onConsultationNote).toHaveBeenCalledWith(appointment);
  });

  it('shows the note editor action to the assigned doctor', () => {
    render(
      <AppointmentList
        appointments={[appointment]}
        user={{ role: 'doctor' }}
        onCancel={() => {}}
        onComplete={() => {}}
        onReschedule={() => {}}
        onConsultationNote={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Add / edit notes' })).toBeInTheDocument();
  });

  it('keeps a read-only notes action on cancelled appointments', () => {
    render(
      <AppointmentList
        appointments={[{ ...appointment, status: 'cancelled' }]}
        user={{ role: 'doctor' }}
        onCancel={() => {}}
        onComplete={() => {}}
        onReschedule={() => {}}
        onConsultationNote={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'View notes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add / edit notes' })).not.toBeInTheDocument();
  });
});
