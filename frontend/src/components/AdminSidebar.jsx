// frontend/src/components/AdminSidebar.jsx
import { NavLink } from 'react-router-dom'

export default function AdminSidebar() {
  const items = [
    ['/admin', 'bi-speedometer2', 'Dashboard', true],
    ['/admin/students', 'bi-people', 'Students'],
    ['/admin/companies', 'bi-building', 'Companies'],
    ['/admin/jobs', 'bi-briefcase', 'Jobs'],
    ['/admin/applications', 'bi-file-earmark-text', 'Applications'],
    ['/admin/placements', 'bi-trophy', 'Placements'],
  ]

  return (
    <div className="sidebar">
      <h5>Admin Menu</h5>
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