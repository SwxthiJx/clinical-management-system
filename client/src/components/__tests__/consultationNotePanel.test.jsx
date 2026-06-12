import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConsultationNotePanel from '../ConsultationNotePanel.jsx';

afterEach(cleanup);

const appointment = {
  _id: 'appointment-1',
  startTime: '2026-06-20T03:30:00.000Z',
  patient: { name: 'Priya Nair' },
  doctor: { name: 'Dr. Maya Rao' }
};

describe('ConsultationNotePanel', () => {
  it('lets the assigned doctor save a structured draft', () => {
    const onSubmit = vi.fn();
    render(
      <ConsultationNotePanel
        appointment={appointment}
        user={{ role: 'doctor' }}
        loading={false}
        pending={false}
        message={null}
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText('Symptoms and history'), {
      target: { value: 'Headache for two days' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subjective: 'Headache for two days',
        status: 'draft'
      })
    );
  });

  it('does not render private doctor notes for patients', () => {
    render(
      <ConsultationNotePanel
        appointment={appointment}
        user={{ role: 'patient' }}
        note={{
          status: 'finalized',
          assessment: 'Tension headache',
          privateNotes: 'Internal note',
          updatedAt: '2026-06-20T04:00:00.000Z'
        }}
        loading={false}
        pending={false}
        message={null}
        onClose={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('Tension headache')).toBeInTheDocument();
    expect(screen.queryByText('Internal note')).not.toBeInTheDocument();
    expect(screen.queryByText('Private doctor notes')).not.toBeInTheDocument();
  });

  it('shows patients when a note has not been finalized', () => {
    render(
      <ConsultationNotePanel
        appointment={appointment}
        user={{ role: 'patient' }}
        note={null}
        loading={false}
        pending={false}
        message={null}
        onClose={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('No patient-visible notes yet')).toBeInTheDocument();
    expect(screen.getByText(/Finalize for patient/)).toBeInTheDocument();
  });
});
