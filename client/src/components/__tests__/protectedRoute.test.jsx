import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '../ProtectedRoute.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../../contexts/AuthContext.jsx';

describe('ProtectedRoute', () => {
  it('redirects signed-out users to login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/appointments']}>
        <Routes>
          <Route path="/login" element={<p>Login screen</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/appointments" element={<p>Private appointments</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Private appointments')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    useAuth.mockReturnValue({ user: { role: 'patient' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/appointments']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/appointments" element={<p>Private appointments</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Private appointments')).toBeInTheDocument();
  });
});
