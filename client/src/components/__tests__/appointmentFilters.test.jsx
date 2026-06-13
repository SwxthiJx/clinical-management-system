import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppointmentFilters, {
  emptyAppointmentFilters,
  filterAppointments
} from '../AppointmentFilters.jsx';

afterEach(cleanup);

const appointments = [
  { status: 'booked', startTime: '2026-06-20T09:00:00.000Z' },
  { status: 'completed', startTime: '2026-06-21T09:00:00.000Z' }
];

describe('appointment filtering', () => {
  it('filters appointments by status and local date', () => {
    const targetDate = new Date(appointments[0].startTime);
    const date = [
      targetDate.getFullYear(),
      String(targetDate.getMonth() + 1).padStart(2, '0'),
      String(targetDate.getDate()).padStart(2, '0')
    ].join('-');

    expect(filterAppointments(appointments, { status: 'booked', date })).toEqual([
      appointments[0]
    ]);
  });

  it('emits status changes and reset actions', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <AppointmentFilters
        filters={{ ...emptyAppointmentFilters, status: 'booked' }}
        resultCount={1}
        onChange={onChange}
        onReset={onReset}
      />
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'completed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange).toHaveBeenCalledWith('status', 'completed');
    expect(onReset).toHaveBeenCalled();
  });
});
