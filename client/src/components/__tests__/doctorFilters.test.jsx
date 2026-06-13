import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DoctorFilters, { emptyDoctorFilters, filterDoctors } from '../DoctorFilters.jsx';

afterEach(cleanup);

const doctors = [
  {
    name: 'Dr. Maya Rao',
    specialty: 'General Medicine'
  },
  {
    name: 'Dr. Kabir Sen',
    specialty: 'Orthopedics'
  }
];

describe('doctor filtering', () => {
  it('combines doctor name and specialty criteria', () => {
    expect(filterDoctors(doctors, {
      search: 'kabir',
      specialty: 'Orthopedics'
    })).toEqual([doctors[1]]);
  });

  it('updates and resets filter controls', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <DoctorFilters
        filters={{ ...emptyDoctorFilters, search: 'maya' }}
        specialties={['General Medicine']}
        resultCount={1}
        onChange={onChange}
        onReset={onReset}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search by doctor name'), {
      target: { value: 'kabir' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange).toHaveBeenCalledWith('search', 'kabir');
    expect(onReset).toHaveBeenCalled();
  });
});
