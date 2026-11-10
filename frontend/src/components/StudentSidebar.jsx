// frontend/src/components/StudentSidebar.jsx
import { NavLink } from 'react-router-dom'

export default function StudentSidebar() {
  const items = [
    ['/student', 'bi-speedometer2', 'Dashboard', true],
    ['/student/profile', 'bi-person-circle', 'My Profile'],
    ['/student/jobs', 'bi-briefcase', 'Find Jobs'],
    ['/student/applications', 'bi-file-earmark-text', 'My Applications'],
    ['/student/saved', 'bi-bookmark', 'Saved Jobs'],
    ['/student/notifications', 'bi-bell', 'Notifications'],
    ['/student/placement', 'bi-trophy', 'Placement History'],
  ]

  return (
    <div className="sidebar">
      <h5>Student Menu</h5>
      {items.map(([to, icon, label, exact]) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i className={`bi ${icon} me-2`}></i>
          {label}
        </NavLink>
      ))}
    </div>
  )
}