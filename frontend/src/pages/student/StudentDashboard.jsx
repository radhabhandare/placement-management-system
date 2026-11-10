// frontend/src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    API.get('/dashboard/student/stats/')
      .then(r => setData(r.data))
      .catch(err => {
        // dashboard endpoint not implemented yet — use fallback
        setError(err.response?.status)
      })
  }, [])

  // Fallback stats if dashboard endpoint not yet created
  const stats = data || {
    profile_completion: user?.profile_completion || 0,
    available_jobs: 0,
    applied_count: 0,
    pending_applications: 0,
    shortlisted_count: 0,
    recent_jobs: [],
    upcoming_interviews: [],
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Welcome back, {user?.first_name}!</h2>
          <p className="text-muted mb-0">Here's your placement snapshot</p>
        </div>
        <Link to="/student/jobs" className="btn btn-primary">
          <i className="bi bi-search me-1"></i>Browse Jobs
        </Link>
      </div>

      {error === 404 && (
        <div className="alert alert-info small">
          <i className="bi bi-info-circle me-1"></i>
          Dashboard stats endpoint coming in the next backend phase.
          Showing basic info from your profile.
        </div>
      )}

      {/* Profile Completion */}
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0"><i className="bi bi-person-badge me-2 text-primary"></i>Profile Completion</h6>
          <strong className="text-navy fs-5">{stats.profile_completion}%</strong>
        </div>
        <div className="progress mb-2">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${stats.profile_completion}%` }}
          ></div>
        </div>
        {stats.profile_completion < 100 && (
          <small className="text-muted">
            Complete your profile to unlock more job matches.{' '}
            <Link to="/student/profile">Complete now</Link>
          </small>
        )}
      </div>

      {/* Stats grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-briefcase-fill text-primary fs-4"></i>
            <h3>{stats.available_jobs}</h3>
            <small>Available Jobs</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-file-earmark-text text-primary fs-4"></i>
            <h3>{stats.applied_count}</h3>
            <small>Applications</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-hourglass-split text-primary fs-4"></i>
            <h3>{stats.pending_applications}</h3>
            <small>Pending</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-star-fill text-primary fs-4"></i>
            <h3>{stats.shortlisted_count}</h3>
            <small>Shortlisted</small>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="mb-3"><i className="bi bi-clock-history me-2 text-primary"></i>Recent Jobs</h6>
            {stats.recent_jobs?.length === 0 ? (
              <p className="text-muted small mb-0">No jobs yet. Check back soon.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {stats.recent_jobs?.map((j, i) => (
                  <li key={i} className="mb-2 pb-2 border-bottom">
                    <Link to={`/jobs/${j.id}`} className="text-decoration-none">
                      <div className="fw-semibold text-dark">{j.job_title}</div>
                      <small className="text-muted">{j.company_name} • {j.job_location}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="mb-3"><i className="bi bi-calendar-event me-2 text-primary"></i>Upcoming Interviews</h6>
            {stats.upcoming_interviews?.length === 0 ? (
              <p className="text-muted small mb-0">No interviews scheduled yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {stats.upcoming_interviews?.map((i, idx) => (
                  <li key={idx} className="mb-2 pb-2 border-bottom">
                    <div className="fw-semibold">{i.job}</div>
                    <small className="text-muted">
                      {i.company} • {new Date(i.scheduled_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}