// frontend/src/pages/admin/Jobs.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

const EMPLOYMENT_TYPES = [
  ['FULL_TIME', 'Full Time'],
  ['PART_TIME', 'Part Time'],
  ['INTERN', 'Internship'],
  ['CONTRACT', 'Contract'],
]
const JOB_STATUS = [
  ['DRAFT', 'Draft'],
  ['PUBLISHED', 'Published'],
  ['CLOSED', 'Closed'],
  ['ARCHIVED', 'Archived'],
]

function emptyJob() {
  return {
    job_code: '',
    company: '',
    job_title: '',
    vacancies: 1,
    job_location: '',
    salary_lpa: '',
    min_experience: 0,
    max_experience: 0,
    qualification: '',
    eligible_degrees: '',
    eligible_branches: '',
    min_percentage: '',
    min_cgpa: '',
    passing_year_from: '',
    passing_year_to: '',
    max_backlogs: 0,
    required_skills: '',
    good_to_have_skills: '',
    description: '',
    responsibilities: '',
    industry_type: '',
    department: '',
    job_role: '',
    employment_type: 'FULL_TIME',
    application_deadline: '',
    status: 'DRAFT',
  }
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyJob())
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [jobsRes, compRes] = await Promise.all([
        API.get('/jobs/admin/jobs/' + (filter ? `?status=${filter}` : '')),
        API.get('/jobs/admin/companies/'),
      ])
      setJobs(jobsRes.data)
      setCompanies(compRes.data.filter(c => c.is_active))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const startAdd = () => {
    setForm(emptyJob())
    setEditing(null)
    setShowForm(true)
  }

  const startEdit = (j) => {
    setForm({
      ...j,
      company: j.company,
    })
    setEditing(j.id)
    setShowForm(true)
  }

  const update = (f) => (e) => {
    let val = e.target.value
    if (['vacancies', 'min_experience', 'max_experience', 'max_backlogs'].includes(f)) {
      val = val === '' ? 0 : parseInt(val) || 0
    }
    setForm({ ...form, [f]: val })
  }

  const save = async () => {
    const payload = { ...form }
    // Convert empty strings to null for numeric fields
    for (const f of ['salary_lpa', 'min_percentage', 'min_cgpa']) {
      if (payload[f] === '') payload[f] = null
    }
    for (const f of ['passing_year_from', 'passing_year_to']) {
      if (payload[f] === '') payload[f] = null
    }
    if (payload.application_deadline === '') payload.application_deadline = null
    payload.company = parseInt(payload.company)

    try {
      if (editing) {
        await API.put(`/jobs/admin/jobs/${editing}/`, payload)
      } else {
        await API.post('/jobs/admin/jobs/', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        alert(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n'))
      } else {
        alert('Save failed')
      }
    }
  }

  const toggleStatus = async (j) => {
    const next = j.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED'
    if (!confirm(`Change status to ${next}?`)) return
    try {
      await API.put(`/jobs/admin/jobs/${j.id}/`, { status: next })
      load()
    } catch {
      alert('Update failed')
    }
  }

  const archive = async (j) => {
    if (!confirm(`Archive "${j.job_title}"? Students will no longer see it.`)) return
    try {
      await API.delete(`/jobs/admin/jobs/${j.id}/`)
      load()
    } catch {
      alert('Archive failed')
    }
  }

  const filtered = jobs.filter(j => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      j.job_title?.toLowerCase().includes(q) ||
      j.job_code?.toLowerCase().includes(q) ||
      j.company_name?.toLowerCase().includes(q)
    )
  })

  const statusBadge = (status) => {
    const map = {
      DRAFT: 'bg-secondary',
      PUBLISHED: 'bg-success',
      CLOSED: 'bg-warning',
      ARCHIVED: 'bg-dark',
    }
    return map[status] || 'bg-light'
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Job Management</h2>
          <p className="text-muted mb-0">Post and manage job openings for students</p>
        </div>
        <button className="btn btn-primary" onClick={startAdd} disabled={companies.length === 0}>
          <i className="bi bi-plus-lg me-1"></i>Post New Job
        </button>
      </div>

      {companies.length === 0 && (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-1"></i>
          You need to add at least one active company before you can post a job.
          Go to <a href="/admin/companies" className="alert-link">Companies</a> first.
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select" style={{ maxWidth: 200 }} value={filter}
          onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search by title, code, company..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-briefcase fs-1 mb-2"></i>
          <p className="mb-3">{jobs.length === 0 ? 'No jobs posted yet. Create your first opening!' : 'No jobs match your filters.'}</p>
          {jobs.length === 0 && companies.length > 0 && (
            <button className="btn btn-primary mx-auto" style={{ maxWidth: 200 }} onClick={startAdd}>
              <i className="bi bi-plus-lg me-1"></i>Post First Job
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Package</th>
                  <th>Vacancies</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id}>
                    <td>
                      <div className="fw-semibold">{j.job_title}</div>
                      <small className="text-muted">{j.job_code}</small>
                    </td>
                    <td className="small">{j.company_name}</td>
                    <td className="small">{j.job_location}</td>
                    <td className="small">{j.salary_lpa ? `${j.salary_lpa} LPA` : '—'}</td>
                    <td className="small">{j.vacancies}</td>
                    <td className="small">{j.application_deadline || '—'}</td>
                    <td><span className={`badge ${statusBadge(j.status)}`}>{j.status}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(j)}>Edit</button>
                      {j.status !== 'ARCHIVED' && (
                        <button className="btn btn-sm btn-outline-warning me-1" onClick={() => toggleStatus(j)}>
                          {j.status === 'PUBLISHED' ? 'Close' : 'Publish'}
                        </button>
                      )}
                      {j.status !== 'ARCHIVED' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => archive(j)}>Archive</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <JobForm
          form={form}
          update={update}
          setForm={setForm}
          companies={companies}
          editing={editing}
          onSave={save}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function JobForm({ form, update, setForm, companies, editing, onSave, onClose }) {
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editing ? 'Edit Job' : 'Post New Job'}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* --- Basic info --- */}
            <h6 className="pb-2 border-bottom mb-3">Basic Information</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Job Code <span className="text-danger">*</span></label>
                <input className="form-control" value={form.job_code} onChange={update('job_code')} placeholder="e.g. INFY-JOB-2025-001" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Company <span className="text-danger">*</span></label>
                <select className="form-select" value={form.company} onChange={update('company')}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Employment Type</label>
                <select className="form-select" value={form.employment_type} onChange={update('employment_type')}>
                  {EMPLOYMENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="col-md-8">
                <label className="form-label">Job Title <span className="text-danger">*</span></label>
                <input className="form-control" value={form.job_title} onChange={update('job_title')} placeholder="e.g. Software Engineer - Full Stack" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Vacancies</label>
                <input type="number" min="1" className="form-control" value={form.vacancies} onChange={update('vacancies')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Location <span className="text-danger">*</span></label>
                <input className="form-control" value={form.job_location} onChange={update('job_location')} placeholder="e.g. Bangalore" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Package (LPA)</label>
                <input type="number" step="0.01" className="form-control" value={form.salary_lpa} onChange={update('salary_lpa')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Application Deadline</label>
                <input type="date" className="form-control" value={form.application_deadline} onChange={update('application_deadline')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={update('status')}>
                  {JOB_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* --- Eligibility --- */}
            <h6 className="pb-2 border-bottom mb-3">Eligibility Criteria</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Eligible Degrees (comma separated)</label>
                <input className="form-control" value={form.eligible_degrees} onChange={update('eligible_degrees')} placeholder="B.Tech, B.E." />
              </div>
              <div className="col-md-6">
                <label className="form-label">Eligible Branches (comma separated)</label>
                <input className="form-control" value={form.eligible_branches} onChange={update('eligible_branches')} placeholder="CSE, IT, ECE" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Min Percentage</label>
                <input type="number" step="0.01" className="form-control" value={form.min_percentage} onChange={update('min_percentage')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Min CGPA</label>
                <input type="number" step="0.01" className="form-control" value={form.min_cgpa} onChange={update('min_cgpa')} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Passing From</label>
                <input type="number" className="form-control" value={form.passing_year_from} onChange={update('passing_year_from')} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Passing To</label>
                <input type="number" className="form-control" value={form.passing_year_to} onChange={update('passing_year_to')} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Max Backlogs</label>
                <input type="number" className="form-control" value={form.max_backlogs} onChange={update('max_backlogs')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Min Experience (years)</label>
                <input type="number" min="0" className="form-control" value={form.min_experience} onChange={update('min_experience')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Max Experience (years)</label>
                <input type="number" min="0" className="form-control" value={form.max_experience} onChange={update('max_experience')} />
              </div>
            </div>

            {/* --- Skills --- */}
            <h6 className="pb-2 border-bottom mb-3">Skills</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Required Skills (comma separated) <span className="text-danger">*</span></label>
                <input className="form-control" value={form.required_skills} onChange={update('required_skills')} placeholder="Python, Django, MySQL" />
                <small className="text-muted">Eligibility checker ensures students have these</small>
              </div>
              <div className="col-md-6">
                <label className="form-label">Good to Have Skills</label>
                <input className="form-control" value={form.good_to_have_skills} onChange={update('good_to_have_skills')} placeholder="React, Docker" />
              </div>
            </div>

            {/* --- Description --- */}
            <h6 className="pb-2 border-bottom mb-3">Description & Role</h6>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label">Job Description</label>
                <textarea rows={3} className="form-control" value={form.description} onChange={update('description')}
                  placeholder="Describe the role, team, product, etc." />
              </div>
              <div className="col-12">
                <label className="form-label">Key Responsibilities</label>
                <textarea rows={3} className="form-control" value={form.responsibilities} onChange={update('responsibilities')}
                  placeholder="Develop features, review code, collaborate with QA..." />
              </div>
              <div className="col-md-4">
                <label className="form-label">Industry Type</label>
                <input className="form-control" value={form.industry_type} onChange={update('industry_type')} placeholder="IT" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department} onChange={update('department')} placeholder="Engineering" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Job Role</label>
                <input className="form-control" value={form.job_role} onChange={update('job_role')} placeholder="Software Engineer" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onSave}>
              {editing ? 'Update Job' : 'Post Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}