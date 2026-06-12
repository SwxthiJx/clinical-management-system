import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthView from '../AuthView.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (user) return <Navigate to="/appointments" replace />;
  return (
    <AuthView
      onAuth={(nextUser) => {
        setUser(nextUser);
        navigate(location.state?.from || '/appointments', { replace: true });
      }}
    />
  );
}
