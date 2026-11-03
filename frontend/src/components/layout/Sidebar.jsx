import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import {
  BiGridAlt,
  BiGroup,
  BiBed,
  BiCheckSquare,
  BiBarChartAlt2,
  BiFileBlank,
  BiCalendarEvent,
} from 'react-icons/bi';

const links = [
  { to: '/', label: 'Dashboard', icon: BiGridAlt, end: true },
  { to: '/students', label: 'Students', icon: BiGroup },
  { to: '/rooms', label: 'Rooms', icon: BiBed },
  { to: '/attendance', label: 'Attendance', icon: BiCheckSquare },
  { to: '/analytics', label: 'Charts & Analytics', icon: BiBarChartAlt2 },
  { to: '/reports', label: 'Reports', icon: BiFileBlank },
  { to: '/academic-years', label: 'Academic Years', icon: BiCalendarEvent },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`sidebar-backdrop d-lg-none ${open ? '' : 'd-none'}`} onClick={onClose} />
      <aside className={`ha-sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <BiBed size={22} />
          <span>Hostel Manager</span>
        </div>
        <Nav className="flex-column flex-grow-1 pt-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </Nav>
      </aside>
    </>
  );
}
