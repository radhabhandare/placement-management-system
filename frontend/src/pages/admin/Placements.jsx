// frontend/src/pages/admin/Placements.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

export default function Placements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/dashboard/admin/placements/')
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader-center"><div className="spinner-border text-primary"></div></div>

  const totalPackage = items.reduce((sum, i) => sum + parseFloat(i.salary_lpa || 0), 0)
  const avgPackage = items.length > 0 ? (totalPackage / items.length).toFixed(2) : '0.00'

  return (
    <div>
      <h2 className="mb-1">Placement Records</h2>
      <p className="text-muted mb-4">Students who have been successfully placed</p>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <i className="bi bi-trophy-fill text-warning fs-4"></i>
            <h3>{items.length}</h3>
            <small>Total Placed</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <i className="bi bi-cash-coin text-success fs-4"></i>
            <h3>{avgPackage}</h3>
            <small>Avg Package (LPA)</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <i className="bi bi-star-fill text-primary fs-4"></i>
            <h3>
              {items.length > 0 ? Math.max(...items.map(i => parseFloat(i.salary_lpa || 0))).toFixed(2) : '0.00'}
            </h3>
            <small>Highest Package (LPA)</small>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-trophy fs-1 mb-2"></i>
          <p className="mb-0">No students placed yet.</p>
          <small className="text-muted mt-2">Mark an application as SELECTED from the Applications page.</small>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Reg No</th>
                  <th>Company</th>
                  <th>Job</th>
                  <th>Package</th>
                  <th>Placed On</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw-semibold">{p.student_name}</div>
                      <small className="text-muted">{p.student_email}</small>
                    </td>
                    <td className="small"><code>{p.student_regno || '—'}</code></td>
                    <td className="fw-semibold text-primary">{p.company_name}</td>
                    <td className="small">{p.job_title}<br /><code className="text-muted">{p.job_code}</code></td>
                    <td><strong>{p.salary_lpa || '—'}</strong> LPA</td>
                    <td className="small text-muted">{new Date(p.placed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}