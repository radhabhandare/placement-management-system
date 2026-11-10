// frontend/src/pages/student/Saved.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/client'

export default function Saved() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get('/jobs/student/saved/')
      setJobs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (jobId) => {
    if (!confirm('Remove from saved jobs?')) return
    try {
      await API.delete(`/jobs/student/saved/${jobId}/`)
      load()
    } catch {
      alert('Failed to remove')
    }
  }

  return (
    <div>
      <h2 className="mb-1">Saved Jobs</h2>
      <p className="text-muted mb-4">Jobs you've bookmarked for later</p>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : jobs.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-bookmark fs-1 mb-2"></i>
          <p className="mb-0">No saved jobs yet.</p>
        </div>
      ) : (
        <div className="row g-3">
          {jobs.map(j => (
            <div className="col-md-6" key={j.id}>
              <div className="card card-hover p-4 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <h5 className="mb-1">{j.job_title}</h5>
                    <p className="text-primary fw-semibold mb-0">{j.company_name}</p>
                  </div>
                  <button className="btn btn-sm text-danger" onClick={() => remove(j.id)}>
                    <i className="bi bi-bookmark-x"></i>
                  </button>
                </div>
                <div className="text-muted small mb-3">
                  <i className="bi bi-geo-alt me-1"></i>{j.job_location}
                  <span className="ms-3"><i className="bi bi-cash-coin me-1"></i>{j.salary_lpa ? `${j.salary_lpa} LPA` : 'Negotiable'}</span>
                </div>
                <Link to={`/student/jobs/${j.id}`} className="btn btn-sm btn-outline-primary align-self-start mt-auto">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}