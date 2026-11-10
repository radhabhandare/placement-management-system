// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch stats from multiple endpoints (dashboard endpoint not yet built)
    Promise.all([
      API.get('/auth/admin/students/').then(r => r.data).catch(() => []),
      API.get('/jobs/admin/companies/').then(r => r.data).catch(() => []),
      API.get('/jobs/admin/jobs/').then(r => r.data).catch(() => []),
      API.get('/jobs/admin/applications/').then(r => r.data).catch(() => []),
    ]).then(([students, companies, jobs, applications]) => {
      setStats({
        total_students: students.length,
        pending: students.filter(s => s.status === 'PENDING').length,
        approved: students.filter(s => s.status === 'APPROVED').length,
        rejected: students.filter(s => s.status === 'REJECTED').length,
        companies: companies.length,
        active_jobs: jobs.filter(j => j.status === 'PUBLISHED').length,
        total_applications: applications.length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        selected: applications.filter(a => a.status === 'SELECTED').length,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader-center"><div className="spinner-border text-primary"></div></div>

  const s = stats || {}
  const placementPct = s.approved ? Math.round((s.selected / s.approved) * 100) : 0

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Admin Dashboard</h2>
          <p className="text-muted mb-0">Placement cell overview</p>
        </div>
        <div className="d-flex gap-2">
          {s.pending > 0 && (
            <Link to="/admin/students?status=PENDING" className="btn btn-warning">
              <i className="bi bi-exclamation-triangle me-1"></i>
              {s.pending} Pending Approval{s.pending > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* Top Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-people-fill text-primary fs-4"></i>
            <h3>{s.total_students}</h3>
            <small>Total Students</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-hourglass-split text-warning fs-4"></i>
            <h3>{s.pending}</h3>
            <small>Pending Approvals</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-check-circle-fill text-success fs-4"></i>
            <h3>{s.approved}</h3>
            <small>Approved Students</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-x-circle-fill text-danger fs-4"></i>
            <h3>{s.rejected}</h3>
            <small>Rejected</small>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-building text-primary fs-4"></i>
            <h3>{s.companies}</h3>
            <small>Companies</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-briefcase-fill text-primary fs-4"></i>
            <h3>{s.active_jobs}</h3>
            <small>Active Jobs</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-file-earmark-text text-primary fs-4"></i>
            <h3>{s.total_applications}</h3>
            <small>Total Applications</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <i className="bi bi-star-fill text-warning fs-4"></i>
            <h3>{s.shortlisted}</h3>
            <small>Shortlisted</small>
          </div>
        </div>
      </div>

      {/* Placement Rate */}
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0"><i className="bi bi-trophy-fill me-2 text-primary"></i>Placement Rate</h6>
          <strong className="text-navy fs-4">{placementPct}%</strong>
        </div>
        <div className="progress mb-2">
          <div className="progress-bar bg-success" style={{ width: `${placementPct}%` }}></div>
        </div>
        <small className="text-muted">
          {s.selected || 0} selected out of {s.approved || 0} approved students
        </small>
      </div>

      {/* Quick Actions */}
      <div className="row g-3">
        <div className="col-md-3">
          <Link to="/admin/students" className="card p-3 text-decoration-none card-hover h-100">
            <i className="bi bi-people text-primary fs-3 mb-2"></i>
            <h6 className="text-dark">Manage Students</h6>
            <small className="text-muted">Approve, reject, view details</small>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/companies" className="card p-3 text-decoration-none card-hover h-100">
            <i className="bi bi-building text-primary fs-3 mb-2"></i>
            <h6 className="text-dark">Manage Companies</h6>
            <small className="text-muted">Add, edit, deactivate</small>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/jobs" className="card p-3 text-decoration-none card-hover h-100">
            <i className="bi bi-briefcase text-primary fs-3 mb-2"></i>
            <h6 className="text-dark">Manage Jobs</h6>
            <small className="text-muted">Post new openings</small>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/applications" className="card p-3 text-decoration-none card-hover h-100">
            <i className="bi bi-file-earmark-text text-primary fs-3 mb-2"></i>
            <h6 className="text-dark">Applications</h6>
            <small className="text-muted">Track & update status</small>
          </Link>
        </div>
      </div>
    </div>
  )
}