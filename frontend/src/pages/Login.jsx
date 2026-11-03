import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { BiBed, BiLockAlt, BiUser } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    const { error: loginError } = await login(username.trim(), password);
    setSubmitting(false);

    if (loginError) {
      setError(loginError.message || 'Login failed. Please try again.');
      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div className="ha-login">
      <div className="ha-login-card ha-card">
        <div className="ha-login-brand">
          <div className="ha-login-icon">
            <BiBed size={30} />
          </div>
          <h4>Hostel Manager</h4>
          <p>Sign in to manage students, rooms and attendance.</p>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 small">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="loginUsername">
            <Form.Label>Username</Form.Label>
            <div className="ha-input-icon">
              <BiUser />
              <Form.Control
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="loginPassword">
            <Form.Label>Password</Form.Label>
            <div className="ha-input-icon">
              <BiLockAlt />
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="ha-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </Form.Group>

          <Button type="submit" className="w-100" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </Form>
      </div>

      <p className="ha-login-footer">Hostel Attendance Management System</p>
    </div>
  );
}
