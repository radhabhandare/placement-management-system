// frontend/src/pages/admin/Applications.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

const STATUS_TABS = [
  ['', 'All', 'secondary'],
  ['APPLIED', 'Applied', 'primary'],
  ['REVIEWING', 'Reviewing', 'info'],
  ['SHORTLISTED', 'Shortlisted', 'success'],
  ['INTERVIEW', 'Interview', 'warning'],
  ['SELECTED', 'Selected', 'success'],
  ['REJECTED', 'Rejected', 'danger'],
  ['WITHDRAWN', 'Withdrawn', 'secondary'],
]

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [interviewModal, setInterviewModal] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (status) params.status = status
      if (search) params.search = search
      const res = await API.get('/jobs/admin/applications/', { params })
      setApps(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  const viewDetail = async (app) => {
    try {
      const res = await API.get(`/jobs/student/applications/${app.id}/`)
      // admin can call student endpoint? No — need custom
      // fallback: use list data + fetch history via admin? We'll use the app object directly
      setDetail({ application: app, history: [], interview: null })
    } catch {
      setDetail({ application: app, history: [], interview: null })
    }
  }

  const updateStatus = async (id, newStatus) => {
    const map = {
      REVIEWING: 'Mark as Reviewing?',
      SHORTLISTED: 'Shortlist this candidate? Student will get an email.',
      INTERVIEW: 'Mark as Interview stage?',
      SELECTED: 'Mark as Selected? Student will get a congratulations email.',
      REJECTED: 'Reject this candidate? Student will be notified.',
    }
    if (!confirm(map[newStatus] || `Change status to ${newStatus}?`)) return
    try {
      await API.post(`/jobs/admin/applications/${id}/status/`, { status: newStatus })
      setDetail(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed')
    }
  }

  const openInterviewModal = (app) => {
    setInterviewModal({
      app,
      scheduled_at: '',
      mode: 'ONLINE',
      location_or_link: '',
      notes: '',
    })
  }

  const submitInterview = async () => {
    if (!interviewModal.scheduled_at) {
      alert('Please pick a date/time')
      return
    }
    try {
      await API.post(`/jobs/admin/applications/${interviewModal.app.id}/interview/`, {
        scheduled_at: interviewModal.scheduled_at,
        mode: interviewModal.mode,
        location_or_link: interviewModal.location_or_link,
        notes: interviewModal.notes,
      })
      alert('Interview scheduled. Email sent.')
      setInterviewModal(null)
      setDetail(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Scheduling failed')
    }
  }

  const statusBadge = (s) => `badge-status badge-${s}`

  return (
    <div>
      <h2 className="mb-1">Application Management</h2>
      <p className="text-muted mb-4">Review applications and update their status</p>

      {/* Tabs + search */}
      <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
        <ul className="nav nav-pills flex-wrap">
          {STATUS_TABS.map(([v, l, c]) => (
            <li className="nav-item" key={v}>
              <button
                className={`nav-link ${status === v ? `active bg-${c} border-${c}` : 'text-dark'}`}
                onClick={() => setStatus(v)}
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
        <input
          className="form-control"
          style={{ maxWidth: 300 }}
          placeholder="Search student name, email, reg no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load() }}
        />
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : apps.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-inbox fs-1 mb-2"></i>
          <p className="mb-0">No applications yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-semibold">{a.student_name}</div>
                      <small className="text-muted">{a.student_regno || a.student_email}</small>
                    </td>
                    <td>
                      <div>{a.job_title}</div>
                      <small className="text-muted">{a.job_code}</small>
                    </td>
                    <td className="small">{a.company_name}</td>
                    <td className="small text-muted">
                      {new Date(a.applied_at).toLocaleDateString()}
                    </td>
                    <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => viewDetail(a)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application — {detail.application.student_name}</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6"><strong>Job:</strong> {detail.application.job_title}</div>
                  <div className="col-md-6"><strong>Job Code:</strong> {detail.application.job_code}</div>
                  <div className="col-md-6"><strong>Company:</strong> {detail.application.company_name}</div>
                  <div className="col-md-6"><strong>Status:</strong> <span className={statusBadge(detail.application.status)}>{detail.application.status}</span></div>
                  <div className="col-md-6"><strong>Applied:</strong> {new Date(detail.application.applied_at).toLocaleString()}</div>
                  <div className="col-md-6"><strong>Relocation OK:</strong> {detail.application.relocation_ok ? 'Yes' : 'No'}</div>
                </div>

                {detail.application.experience_note && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Experience Note</h6>
                    <p className="small">{detail.application.experience_note}</p>
                  </>
                )}

                {detail.application.relevant_info && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Relevant Info</h6>
                    <p className="small">{detail.application.relevant_info}</p>
                  </>
                )}

                {detail.application.resume_url && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Resume</h6>
                    <a href={detail.application.resume_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-download me-1"></i>Download
                    </a>
                  </>
                )}

                {detail.interview && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Interview Scheduled</h6>
                    <p className="small mb-1"><strong>When:</strong> {new Date(detail.interview.scheduled_at).toLocaleString()}</p>
                    <p className="small mb-1"><strong>Mode:</strong> {detail.interview.mode}</p>
                    <p className="small mb-1"><strong>Location/Link:</strong> {detail.interview.location_or_link || '—'}</p>
                  </>
                )}
              </div>
              <div className="modal-footer flex-wrap gap-2">
                {detail.application.status === 'APPLIED' && (
                  <button className="btn btn-info" onClick={() => updateStatus(detail.application.id, 'REVIEWING')}>
                    Mark Reviewing
                  </button>
                )}
                {['APPLIED', 'REVIEWING'].includes(detail.application.status) && (
                  <>
                    <button className="btn btn-success" onClick={() => updateStatus(detail.application.id, 'SHORTLISTED')}>
                      Shortlist
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => updateStatus(detail.application.id, 'REJECTED')}>
                      Reject
                    </button>
                  </>
                )}
                {['SHORTLISTED', 'INTERVIEW'].includes(detail.application.status) && (
                  <button className="btn btn-warning" onClick={() => openInterviewModal(detail.application)}>
                    <i className="bi bi-calendar-plus me-1"></i>Schedule Interview
                  </button>
                )}
                {['SHORTLISTED', 'INTERVIEW'].includes(detail.application.status) && (
                  <>
                    <button className="btn btn-primary" onClick={() => updateStatus(detail.application.id, 'SELECTED')}>
                      Mark Selected
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => updateStatus(detail.application.id, 'REJECTED')}>
                      Reject
                    </button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview scheduling modal */}
      {interviewModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setInterviewModal(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Interview</h5>
                <button className="btn-close" onClick={() => setInterviewModal(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  Candidate: <strong>{interviewModal.app.student_name}</strong> for <strong>{interviewModal.app.job_title}</strong>
                </p>
                <div className="mb-3">
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" className="form-control"
                    value={interviewModal.scheduled_at}
                    onChange={e => setInterviewModal({ ...interviewModal, scheduled_at: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mode</label>
                  <select className="form-select" value={interviewModal.mode}
                    onChange={e => setInterviewModal({ ...interviewModal, mode: e.target.value })}>
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="PHONE">Phone</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Location / Meeting Link</label>
                  <input className="form-control" placeholder="Office address or meeting URL"
                    value={interviewModal.location_or_link}
                    onChange={e => setInterviewModal({ ...interviewModal, location_or_link: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea rows={2} className="form-control"
                    value={interviewModal.notes}
                    onChange={e => setInterviewModal({ ...interviewModal, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setInterviewModal(null)}>Cancel</button>
                <button className="btn btn-warning" onClick={submitInterview}>
                  Schedule & Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}