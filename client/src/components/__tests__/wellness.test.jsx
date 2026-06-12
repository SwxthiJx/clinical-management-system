import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HealthyLivingGuide from '../HealthyLivingGuide.jsx';
import WellnessBanner from '../WellnessBanner.jsx';

describe('wellness guidance', () => {
  it('shows role-aware patient guidance', () => {
    render(<WellnessBanner role="patient" />);

    expect(screen.getByText("Today's healthy reminder")).toBeInTheDocument();
    expect(screen.getByText(/keep preventive appointments/i)).toBeInTheDocument();
  });

  it('shows workforce guidance for administrators', () => {
    render(<WellnessBanner role="admin" />);

    expect(screen.getByText(/manageable workloads/i)).toBeInTheDocument();
  });

  it('renders all core healthy-living topics and the medical disclaimer', () => {
    render(<HealthyLivingGuide />);

    expect(screen.getByRole('heading', { name: 'Keep moving' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eat with variety' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stay hydrated' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Protect your sleep' })).toBeInTheDocument();
    expect(screen.getByText(/follow your doctor's advice/i)).toBeInTheDocument();
  });
});
