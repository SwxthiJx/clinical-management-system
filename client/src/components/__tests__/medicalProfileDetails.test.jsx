import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MedicalProfileDetails from '../MedicalProfileDetails.jsx';

afterEach(cleanup);

describe('MedicalProfileDetails', () => {
  it('renders an authorized patient medical summary', () => {
    render(
      <MedicalProfileDetails
        patient={{ name: 'Priya Nair' }}
        profile={{
          age: 34,
          bloodGroup: 'O+',
          allergies: ['Penicillin'],
          conditions: ['Asthma'],
          medications: ['Salbutamol inhaler'],
          emergencyContact: {
            name: 'Anil Nair',
            relationship: 'Spouse',
            phone: '+91 98765 43210'
          }
        }}
      />
    );

    expect(screen.getByText('Priya Nair medical profile')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
    expect(screen.getByText('Anil Nair')).toBeInTheDocument();
  });

  it('explains when the patient has not completed a profile', () => {
    render(<MedicalProfileDetails patient={{ name: 'Priya Nair' }} profile={null} />);
    expect(screen.getByText('No medical profile has been completed')).toBeInTheDocument();
  });
});
