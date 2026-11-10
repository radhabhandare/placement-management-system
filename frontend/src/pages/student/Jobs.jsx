// frontend/src/pages/student/Jobs.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/client'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '', location: '', employment_type: '', skill: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.location) params.location = filters.location
      if (filters.employment_type) params.employment_type = filters.employment_type
      if (filters.skill) params.skill = filters.skill

      const res = await API.get('/jobs/public/list/', { params })
      setJobs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const applyFilters = (e) => {
    e.preventDefault()
    load()
  }

  const clear = () => {
    setFilters({ search: '', location: '', employment_type: '', skill: '' })
    setTimeout(load, 100)
  }

  return (
    <div>
      <h2 className="mb-1">Find Jobs</h2>
      <p className="text-muted mb-4">Discover opportunities that match your skills</p>

      <form className="card p-3 mb-4" onSubmit={applyFilters}>
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search job title, company, code..."
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Location"
              value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={filters.employment_type}
              onChange={e => setFilters({ ...filters, employment_type: e.target.value })}>
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="INTERN">Internship</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
          <div className="col-md-2">
            <input className="form-control" placeholder="Skill"
              value={filters.skill} onChange={e => setFilters({ ...filters, skill: e.target.value })} />
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100"><i className="bi bi-search"></i></button>
          </div>
        </div>
        <div className="mt-2 text-end">
          <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={clear}>
            Clear filters
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : jobs.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-inbox fs-1 mb-2"></i>
          <p className="mb-0">No jobs match your filters.</p>
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
                  <span className="badge bg-light text-dark small">
                    {(j.employment_type || '').replace('_', ' ')}
                  </span>
                </div>
                <div className="text-muted small mb-3">
                  <i className="bi bi-geo-alt me-1"></i>{j.job_location}
                  <span className="ms-3">
                    <i className="bi bi-cash-coin me-1"></i>
                    {j.salary_lpa ? `${j.salary_lpa} LPA` : 'Negotiable'}
                  </span>
                  <span className="ms-3">
                    <i className="bi bi-people me-1"></i>{j.vacancies} openings
                  </span>
                </div>
                {j.required_skills && (
                  <div className="mb-3 small">
                    <strong>Skills:</strong> {j.required_skills}
                  </div>
                )}
                <Link to={`/student/jobs/${j.id}`} className="btn btn-sm btn-outline-primary mt-auto align-self-start">
                  View Details <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}