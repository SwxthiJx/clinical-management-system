import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AnalyticsCharts from '../AnalyticsCharts.jsx';

afterEach(cleanup);

const analytics = {
  summary: {
    appointmentCount: 12,
    cancellationCount: 2,
    cancellationRate: 16.7,
    activePatients: 8,
    registeredActivePatients: 20,
    averageDoctorUtilization: 42.5,
    topSpecialty: 'Cardiology'
  },
  trend: [
    {
      label: 'Jun 1',
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      total: 4,
      cancelled: 1,
      activePatients: 3
    }
  ],
  doctorUtilization: [
    {
      doctorId: 'doctor-1',
      name: 'Dr. Maya Rao',
      specialty: 'General Medicine',
      occupiedSlots: 6,
      availableSlots: 12,
      utilizationRate: 50
    }
  ],
  popularSpecialties: [{ specialty: 'Cardiology', appointmentCount: 5 }]
};

describe('admin analytics charts', () => {
  it('renders all requested analytics categories', () => {
    render(<AnalyticsCharts analytics={analytics} />);

    expect(screen.getByText('Appointment volume')).toBeInTheDocument();
    expect(screen.getByText('Cancellations')).toBeInTheDocument();
    expect(screen.getAllByText('Active patients').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Doctor utilization').length).toBeGreaterThan(0);
    expect(screen.getByText('Popular specialties')).toBeInTheDocument();
    expect(screen.getByText('Dr. Maya Rao')).toBeInTheDocument();
  });
});
