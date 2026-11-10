// frontend/src/components/Navbar.jsx
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  const dashboardLink = user?.role === 'ADMIN' ? '/admin' : '/student'

  return (
    <nav className="navbar navbar-expand-lg navbar-placement sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-briefcase-fill me-2"></i>Placement Portal
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink className="nav-link" to="/jobs">Jobs</NavLink>
            </li>
            {!user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link className="btn btn-light btn-sm text-navy fw-semibold" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
            {user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to={dashboardLink}>
                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                  </NavLink>
                </li>
                <li className="nav-item ms-lg-2 d-flex align-items-center gap-2">
                  <span className="text-white-50 small d-none d-lg-inline">
                    {user.first_name} {user.last_name}
                  </span>
                  <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}

            {/* Theme toggle — always visible */}
            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label="Toggle theme"
              >
                <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}