import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReschedulePanel from '../ReschedulePanel.jsx';

vi.mock('../../hooks/useClinicQueries.js', () => ({
  useSlots: () => ({
    isLoading: false,
    data: [{ startTime: '2026-06-22T03:30:00.000Z', label: '09:00 am' }]
  })
}));

describe('ReschedulePanel', () => {
  it('submits the selected generated slot', () => {
    const onSubmit = vi.fn();
    render(
      <ReschedulePanel
        appointment={{
          _id: 'appointment-1',
          startTime: '2026-06-20T03:30:00.000Z',
          doctor: { _id: 'doctor-1', name: 'Dr. Maya Rao' }
        }}
        pending={false}
        message=""
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '09:00 am' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm new time' }));

    expect(onSubmit).toHaveBeenCalledWith({
      id: 'appointment-1',
      startTime: '2026-06-22T03:30:00.000Z'
    });
  });
});
