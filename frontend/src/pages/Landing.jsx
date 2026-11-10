// frontend/src/pages/Landing.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/client'
import Navbar from '../components/Navbar'

export default function Landing() {
  const [stats, setStats] = useState({ total_jobs: 0, total_companies: 0, total_students: 0, total_selected: 0 })
  const [jobs, setJobs] = useState([])
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    API.get('/jobs/public/stats/').then(r => setStats(r.data)).catch(() => {})
    API.get('/jobs/public/list/').then(r => setJobs(r.data.slice(0, 6))).catch(() => {})
    API.get('/jobs/public/companies/').then(r => setCompanies(r.data.slice(0, 6))).catch(() => {})
  }, [])

  return (
    <>
      <Navbar />

      <section className="hero-section">
        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1>Launch Your Career with Confidence</h1>
              <p className="lead mt-3 mb-4">
                Connect with top companies, discover opportunities, and take the next
                step in your professional journey — all in one place.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/register" className="btn btn-light btn-lg text-navy fw-semibold px-4">
                  Get Started <i className="bi bi-arrow-right ms-1"></i>
                </Link>
                <Link to="/jobs" className="btn btn-outline-light btn-lg px-4">
                  Browse Jobs
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center">
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '12rem', opacity: 0.25 }}></i>
            </div>
          </div>
        </div>
      </section>

      <div className="container position-relative" style={{ marginTop: '-40px' }}>
        <div className="row g-3">
          <div className="col-md-3 col-6">
            <div className="stat-card text-center">
              <i className="bi bi-briefcase-fill fs-3 text-primary"></i>
              <h3>{stats.total_jobs}</h3>
              <small>Active Jobs</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card text-center">
              <i className="bi bi-building fs-3 text-primary"></i>
              <h3>{stats.total_companies}</h3>
              <small>Partner Companies</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card text-center">
              <i className="bi bi-people-fill fs-3 text-primary"></i>
              <h3>{stats.total_students}</h3>
              <small>Registered Students</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card text-center">
              <i className="bi bi-trophy-fill fs-3 text-primary"></i>
              <h3>{stats.total_selected || 0}</h3>
              <small>Placed</small>
            </div>
          </div>
        </div>
      </div>

      <div className="container my-5 py-4">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-navy">Why Choose Our Platform?</h2>
          <p className="text-muted">Everything you need to land your dream job</p>
        </div>
        <div className="row g-4">
          {[
            ['bi-search', 'Smart Job Discovery', 'Advanced search and filters to find jobs that match your skills.'],
            ['bi-shield-check', 'Verified Companies', 'All partner companies are vetted and verified by our placement cell.'],
            ['bi-graph-up', 'Track Your Progress', 'Real-time updates on application status and interviews.'],
            ['bi-file-earmark-text', 'Resume Management', 'Upload and manage your resume securely for every application.'],
            ['bi-calendar-event', 'Interview Scheduling', 'Get notified of upcoming interviews with details.'],
            ['bi-award', 'Placement Records', 'Complete history of selections and career milestones.'],
          ].map(([icon, title, text]) => (
            <div className="col-md-4" key={title}>
              <div className="card card-hover p-4 h-100 text-center">
                <i className={`bi ${icon} fs-1 text-primary mb-3`}></i>
                <h5>{title}</h5>
                <p className="text-muted small mb-0">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container my-5 py-4">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-navy mb-1">Latest Openings</h2>
            <p className="text-muted mb-0">Fresh opportunities added this week</p>
          </div>
          <Link to="/jobs" className="btn btn-outline-primary">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            No jobs published yet. Check back soon!
          </div>
        ) : (
          <div className="row g-3">
            {jobs.map(j => (
              <div className="col-md-4" key={j.id}>
                <div className="card card-hover p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="text-primary mb-0">{j.company_name}</h6>
                    <span className="badge bg-light text-dark small">
                      {(j.employment_type || '').replace('_', ' ')}
                    </span>
                  </div>
                  <h5 className="mb-3">{j.job_title}</h5>
                  <div className="text-muted small mb-3">
                    <div><i className="bi bi-geo-alt me-1"></i>{j.job_location}</div>
                    <div className="mt-1">
                      <i className="bi bi-cash-coin me-1"></i>
                      {j.salary_lpa ? `${j.salary_lpa} LPA` : 'Negotiable'}
                    </div>
                  </div>
                  <Link to={`/jobs/${j.id}`} className="btn btn-sm btn-outline-primary mt-auto">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {companies.length > 0 && (
        <div className="container my-5 py-4">
          <h2 className="fw-bold text-navy text-center mb-4">Our Hiring Partners</h2>
          <div className="row g-3 justify-content-center">
            {companies.map(c => (
              <div className="col-md-2 col-4" key={c.id}>
                <div className="card p-3 text-center h-100">
                  <i className="bi bi-building fs-3 text-primary mb-2"></i>
                  <small className="fw-semibold">{c.company_name}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container my-5 py-4">
        <div
          className="card p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #0b2545, #1e5f9e)', color: 'white' }}
        >
          <h2 className="fw-bold">Ready to take the next step?</h2>
          <p className="lead mb-4" style={{ opacity: 0.9 }}>
            Register today and connect with leading companies.
          </p>
          <div>
            <Link to="/register" className="btn btn-light text-navy fw-semibold px-4">
              Register Now
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-4 mb-md-0">
              <h5 className="text-white fw-bold">
                <i className="bi bi-briefcase-fill me-2"></i>Placement Portal
              </h5>
              <p className="small">Empowering students to reach their career goals.</p>
            </div>
            <div className="col-md-3 mb-4 mb-md-0">
              <h6 className="text-white">Quick Links</h6>
              <ul className="list-unstyled small">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/jobs">Jobs</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h6 className="text-white">Contact</h6>
              <p className="small mb-0">
                <i className="bi bi-envelope me-1"></i>placement@college.edu<br />
                <i className="bi bi-telephone me-1"></i>+91 9876543210
              </p>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          <div className="text-center small">
            © {new Date().getFullYear()} Placement Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}