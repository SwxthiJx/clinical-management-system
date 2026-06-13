import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from '../../pages/WelcomePage.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, loading: false })
}));

afterEach(cleanup);

describe('welcome page', () => {
  it('offers patient, doctor, and admin login paths', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('link', { name: /Continue as Patient/i })).toHaveAttribute(
      'href',
      '/login?role=patient'
    );
    expect(screen.getByRole('link', { name: /Continue as Doctor/i })).toHaveAttribute(
      'href',
      '/login?role=doctor'
    );
    expect(screen.getByRole('link', { name: /Continue as Admin/i })).toHaveAttribute(
      'href',
      '/login?role=admin'
    );
  });
});
