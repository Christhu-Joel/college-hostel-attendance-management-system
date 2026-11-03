import { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onToggleSidebar }) {
  const [activeYear, setActiveYear] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.academicYears.active().then(({ data, error }) => {
      if (!error && data?.data) setActiveYear(data.data.year_name);
    });
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="ha-topbar">
      <button className="btn btn-outline-secondary d-lg-none" onClick={onToggleSidebar} aria-label="Toggle menu">
        <i className="bi bi-list" />
      </button>
      <h6 className="mb-0 d-none d-sm-block">Hostel Attendance Management System</h6>
      <div className="ms-auto d-flex align-items-center gap-2">
        {activeYear && (
          <span className="badge text-bg-primary rounded-pill">
            <i className="bi bi-calendar3 me-1" />
            {activeYear}
          </span>
        )}
        <span className="text-muted small d-none d-md-inline">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        {user && (
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" size="sm" className="ha-user-toggle">
              <span className="ha-user-avatar">
                {user.username?.charAt(0).toUpperCase()}
              </span>
              <span className="d-none d-sm-inline text-capitalize">{user.username}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header>
                {user.username}
                <div className="text-muted small text-capitalize">{user.role}</div>
              </Dropdown.Header>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2" />
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
