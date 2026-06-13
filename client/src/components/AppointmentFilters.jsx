import { RotateCcw } from 'lucide-react';

export const emptyAppointmentFilters = {
  status: '',
  date: ''
};

function localDateValue(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterAppointments(appointments, filters) {
  return appointments.filter((appointment) => {
    const matchesStatus = !filters.status || appointment.status === filters.status;
    const matchesDate =
      !filters.date || localDateValue(appointment.startTime) === filters.date;
    return matchesStatus && matchesDate;
  });
}

export default function AppointmentFilters({ filters, resultCount, onChange, onReset }) {
  const hasFilters = Boolean(filters.status || filters.date);

  return (
    <div className="appointment-filters" aria-label="Appointment filters">
      <label>
        Status
        <select value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>
        Appointment date
        <input type="date" value={filters.date} onChange={(event) => onChange('date', event.target.value)} />
      </label>
      <div className="filter-summary">
        <span>{resultCount} {resultCount === 1 ? 'appointment' : 'appointments'} shown</span>
        <button type="button" onClick={onReset} disabled={!hasFilters}>
          <RotateCcw aria-hidden="true" />Reset
        </button>
      </div>
    </div>
  );
}
