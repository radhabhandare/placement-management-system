// frontend/src/pages/student/JobDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../api/client'

export default function JobDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [job, setJob] = useState(null)
  const [elig, setElig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApply, setShowApply] = useState(false)
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      API.get(`/jobs/public/${id}/`),
      API.get(`/jobs/student/${id}/eligibility/`).catch(() => ({ data: { eligible: false, reasons: ['Could not check eligibility'] } })),
      API.get('/jobs/student/saved/').catch(() => ({ data: [] })),
    ]).then(([jobRes, eligRes, savedRes]) => {
      setJob(jobRes.data)
      setElig(eligRes.data)
      setSaved((savedRes.data || []).some(j => j.id === parseInt(id)))
    }).finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    try {
      if (saved) {
        await API.delete(`/jobs/student/saved/${id}/`)
        setSaved(false)
      } else {
        await API.post('/jobs/student/saved/', { job_id: parseInt(id) })
        setSaved(true)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  if (loading) return <div className="loader-center"><div className="spinner-border text-primary"></div></div>
  if (!job) return <div className="alert alert-danger">Job not found</div>

  return (
    <div>
      <button className="btn btn-sm btn-link text-muted p-0 mb-3" onClick={() => nav(-1)}>
        <i className="bi bi-arrow-left me-1"></i>Back
      </button>

      <div className="card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h2 className="mb-1">{job.job_title}</h2>
            <p className="text-primary fw-semibold mb-0 fs-5">{job.company_name}</p>
          </div>
          <div className="d-flex gap-2 align-items-start">
            <button className={`btn ${saved ? 'btn-warning' : 'btn-outline-warning'}`} onClick={toggleSave}>
              <i className={`bi ${saved ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
              {saved ? 'Saved' : 'Save Job'}
            </button>
            <span className="badge bg-navy text-white p-2">{job.job_code}</span>
          </div>
        </div>

        <div className="row g-3 text-muted small mb-4">
          <div className="col-md-4"><i className="bi bi-geo-alt me-1"></i>{job.job_location}</div>
          <div className="col-md-4"><i className="bi bi-cash-coin me-1"></i>{job.salary_lpa ? `${job.salary_lpa} LPA` : 'Negotiable'}</div>
          <div className="col-md-4"><i className="bi bi-people me-1"></i>{job.vacancies} vacancy(ies)</div>
          <div className="col-md-4"><i className="bi bi-briefcase me-1"></i>{(job.employment_type || '').replace('_', ' ')}</div>
          <div className="col-md-4"><i className="bi bi-calendar me-1"></i>Deadline: {job.application_deadline || '—'}</div>
          <div className="col-md-4"><i className="bi bi-bar-chart me-1"></i>Min CGPA: {job.min_cgpa || 'Any'}</div>
        </div>

        {elig && (
          <div className={`alert ${elig.eligible ? 'alert-success' : 'alert-warning'}`}>
            <div className="fw-semibold mb-1">
              {elig.already_applied ? 'You have already applied to this job'
                : elig.eligible ? '✓ You are eligible to apply'
                : '⚠ You are not eligible to apply'}
            </div>
            {elig.reasons?.length > 0 && (
              <ul className="mb-0 small">
                {elig.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}

        {elig?.eligible && !elig.already_applied && !applied && (
          <button className="btn btn-primary btn-lg" onClick={() => setShowApply(true)}>
            <i className="bi bi-send me-1"></i>Apply Now
          </button>
        )}
        {applied && <div className="alert alert-success mt-2">Application submitted! Track it in My Applications.</div>}
      </div>

      <div className="row g-3">
        <div className="col-md-8">
          <div className="card p-4 mb-3">
            <h6 className="pb-2 border-bottom">Description</h6>
            <p className="text-muted mb-0">{job.description || '—'}</p>
          </div>
          <div className="card p-4 mb-3">
            <h6 className="pb-2 border-bottom">Key Responsibilities</h6>
            <p className="text-muted mb-0">{job.responsibilities || '—'}</p>
          </div>
          <div className="card p-4">
            <h6 className="pb-2 border-bottom">Eligibility Criteria</h6>
            <ul className="small text-muted mb-0">
              <li><strong>Degree:</strong> {job.eligible_degrees || 'Any'}</li>
              <li><strong>Branch:</strong> {job.eligible_branches || 'Any'}</li>
              <li><strong>Min %:</strong> {job.min_percentage || 'Any'}</li>
              <li><strong>Passing year:</strong> {job.passing_year_from || '—'} to {job.passing_year_to || '—'}</li>
              <li><strong>Max backlogs:</strong> {job.max_backlogs}</li>
              <li><strong>Experience:</strong> {job.min_experience}–{job.max_experience} years</li>
            </ul>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-4 mb-3">
            <h6 className="pb-2 border-bottom">Required Skills</h6>
            <div className="d-flex flex-wrap gap-1">
              {(job.required_skills || '').split(',').filter(Boolean).map((s, i) => (
                <span key={i} className="badge bg-primary-subtle text-primary border">{s.trim()}</span>
              ))}
              {!job.required_skills && <span className="text-muted small">—</span>}
            </div>
          </div>
          <div className="card p-4">
            <h6 className="pb-2 border-bottom">Good to Have</h6>
            <div className="d-flex flex-wrap gap-1">
              {(job.good_to_have_skills || '').split(',').filter(Boolean).map((s, i) => (
                <span key={i} className="badge bg-light text-dark border">{s.trim()}</span>
              ))}
              {!job.good_to_have_skills && <span className="text-muted small">—</span>}
            </div>
          </div>
        </div>
      </div>

      {showApply && (
        <ApplyModal job={job} onClose={() => setShowApply(false)} onSuccess={() => {
          setShowApply(false); setApplied(true)
          setElig({ ...elig, already_applied: true })
        }} />
      )}
    </div>
  )
}

function ApplyModal({ job, onClose, onSuccess }) {
  const [note, setNote] = useState('')
  const [relocation, setRelocation] = useState(true)
  const [relevant, setRelevant] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await API.post(`/jobs/student/${job.id}/apply/`, {
        experience_note: note,
        relocation_ok: relocation,
        relevant_info: relevant,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Apply failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Apply: {job.job_title}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger small">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Your experience</label>
              <textarea rows={2} className="form-control" placeholder="e.g. Fresher, 2 internships in Django"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Relevant projects / work</label>
              <textarea rows={3} className="form-control" value={relevant} onChange={e => setRelevant(e.target.value)} />
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" checked={relocation}
                onChange={e => setRelocation(e.target.checked)} id="reloc" />
              <label className="form-check-label" htmlFor="reloc">
                I'm willing to relocate
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}