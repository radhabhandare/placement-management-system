// frontend/src/pages/student/PlacementHistory.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

export default function PlacementHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/dashboard/student/placement-history/')
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader-center"><div className="spinner-border text-primary"></div></div>

  return (
    <div>
      <h2 className="mb-1">Placement History</h2>
      <p className="text-muted mb-4">Your successful selections and career milestones</p>

      {items.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-trophy fs-1 mb-2"></i>
          <p className="mb-0">No placements yet.</p>
          <small className="text-muted mt-2">Keep applying! Your future placement will show up here.</small>
        </div>
      ) : (
        <div className="row g-3">
          {items.map(p => (
            <div className="col-md-6" key={p.id}>
              <div className="card p-4 h-100" style={{ borderLeft: '4px solid #16a34a' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-1">{p.job_title}</h5>
                    <p className="text-primary fw-semibold mb-0">{p.company_name}</p>
                    <small className="text-muted">{p.job_code}</small>
                  </div>
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>Selected
                  </span>
                </div>
                <div className="text-muted small mt-3">
                  <div><i className="bi bi-geo-alt me-1"></i>{p.job_location}</div>
                  <div className="mt-1">
                    <i className="bi bi-cash-coin me-1"></i>
                    {p.salary_lpa ? `${p.salary_lpa} LPA` : '—'}
                  </div>
                  <div className="mt-1">
                    <i className="bi bi-calendar-check me-1"></i>
                    Selected on {new Date(p.selected_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}