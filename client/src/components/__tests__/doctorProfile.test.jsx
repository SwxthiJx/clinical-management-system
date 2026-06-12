import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DoctorProfileCard from '../DoctorProfileCard.jsx';

const doctor = {
  _id: 'doctor-1',
  name: 'Dr. Maya Rao',
  specialty: 'General Medicine',
  education: ['MBBS', 'MD General Medicine'],
  experienceYears: 12,
  languages: ['English', 'Hindi'],
  clinicalInterests: ['Preventive care'],
  bio: 'Focuses on comprehensive adult care.',
  availability: []
};

describe('DoctorProfileCard', () => {
  it('shows professional details and selects the doctor', () => {
    const onSelect = vi.fn();
    render(<DoctorProfileCard doctor={doctor} selected={false} onSelect={onSelect} />);

    expect(screen.getByText('Dr. Maya Rao')).toBeInTheDocument();
    expect(screen.getByText('MBBS · MD General Medicine')).toBeInTheDocument();
    expect(screen.getByText('12 years')).toBeInTheDocument();
    expect(screen.getByText('English, Hindi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Choose doctor' }));
    expect(onSelect).toHaveBeenCalledWith('doctor-1');
  });
});
