import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, authenticationRequiredEvent } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function clearExpiredSession() {
      setUser(null);
      queryClient.clear();
    }

    window.addEventListener(authenticationRequiredEvent, clearExpiredSession);
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => window.removeEventListener(authenticationRequiredEvent, clearExpiredSession);
  }, [queryClient]);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' }, false);
    } catch (_error) {
      // The local session still clears if it has already expired.
    }
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
