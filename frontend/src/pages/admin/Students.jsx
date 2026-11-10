// frontend/src/pages/admin/Students.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../../api/client'

const TABS = [
  ['PENDING', 'Pending', 'warning'],
  ['APPROVED', 'Approved', 'success'],
  ['REJECTED', 'Rejected', 'danger'],
  ['', 'All', 'secondary'],
]

export default function Students() {
  const [params, setParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(params.get('status') || 'PENDING')
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const url = activeTab
        ? `/auth/admin/students/?status=${activeTab}`
        : `/auth/admin/students/`
      const res = await API.get(url)
      setStudents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeTab])

  const viewDetail = async (id) => {
    try {
      const res = await API.get(`/auth/admin/students/${id}/`)
      setDetail(res.data)
    } catch (err) {
      alert('Failed to load student detail.')
    }
  }

  const approve = async (id) => {
    if (!confirm('Approve this student? An activation email will be sent.')) return
    try {
      await API.post(`/auth/admin/students/${id}/approve/`)
      alert('Approved. Activation email sent.')
      setDetail(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Approve failed.')
    }
  }

  const reject = async () => {
    if (!rejectModal) return
    try {
      await API.post(`/auth/admin/students/${rejectModal.id}/reject/`, {
        reason: rejectReason,
      })
      alert('Rejected. Email sent.')
      setRejectModal(null)
      setRejectReason('')
      setDetail(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Reject failed.')
    }
  }

  const filtered = students.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.email?.toLowerCase().includes(q) ||
      s.registration_number?.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <h2 className="mb-1">Student Management</h2>
      <p className="text-muted mb-4">Review, approve, and manage student accounts</p>

      {/* Tabs + search */}
      <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
        <ul className="nav nav-pills">
          {TABS.map(([key, label, color]) => (
            <li className="nav-item" key={key}>
              <button
                className={`nav-link ${activeTab === key ? `active bg-${color} border-${color}` : 'text-dark'}`}
                onClick={() => {
                  setActiveTab(key)
                  if (key) params.set('status', key)
                  else params.delete('status')
                  setParams(params)
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <input
          className="form-control"
          style={{ maxWidth: 300 }}
          placeholder="Search by name, email, reg no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-inbox fs-1 mb-2"></i>
          No students in this category.
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Reg No</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.first_name} {s.last_name}</td>
                    <td><code>{s.registration_number || '—'}</code></td>
                    <td className="small">{s.email}</td>
                    <td>
                      <span className={`badge-status badge-${s.status}`}>{s.status}</span>
                      {s.is_active && <i className="bi bi-check-circle-fill text-success ms-1" title="Activated"></i>}
                    </td>
                    <td className="small text-muted">
                      {s.profile_completion !== undefined ? `${s.profile_completion}%` : '—'}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => viewDetail(s.id)}>
                        View
                      </button>
                      {s.status === 'PENDING' && (
                        <>
                          <button className="btn btn-sm btn-success me-1" onClick={() => approve(s.id)}>Approve</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setRejectModal(s)}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Student Details</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6"><strong>Name:</strong> {detail.user.first_name} {detail.user.last_name}</div>
                  <div className="col-md-6"><strong>Email:</strong> {detail.user.email}</div>
                  <div className="col-md-6"><strong>Reg No:</strong> {detail.user.registration_number || '—'}</div>
                  <div className="col-md-6"><strong>Status:</strong> <span className={`badge-status badge-${detail.user.status}`}>{detail.user.status}</span></div>
                  <div className="col-md-6"><strong>DOB:</strong> {detail.user.date_of_birth || '—'}</div>
                  <div className="col-md-6"><strong>Gender:</strong> {detail.user.gender || '—'}</div>
                  <div className="col-md-6"><strong>Location:</strong> {detail.user.location || '—'}</div>
                  <div className="col-md-6"><strong>Phone:</strong> {detail.user.contact_number || '—'}</div>
                </div>

                {detail.profile?.educations?.length > 0 && (
                  <>
                    <h6 className="mt-4 pb-2 border-bottom">Education</h6>
                    {detail.profile.educations.map((e, i) => (
                      <div key={i} className="small mb-2">
                        <strong>{e.level}</strong> — {e.institution}
                        {e.degree && ` (${e.degree}${e.branch ? ', ' + e.branch : ''})`}
                        {' • '}Passing: {e.passing_year}
                        {e.cgpa && ` • CGPA: ${e.cgpa}`}
                        {e.percentage && ` • ${e.percentage}%`}
                      </div>
                    ))}
                  </>
                )}

                {detail.profile?.technical_skills?.length > 0 && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Technical Skills</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {detail.profile.technical_skills.map((s, i) => (
                        <span key={i} className="badge bg-light text-dark border">{s.skill_name}</span>
                      ))}
                    </div>
                  </>
                )}

                {detail.profile?.resume_url && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Resume</h6>
                    <a href={detail.profile.resume_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-download me-1"></i>Download Resume
                    </a>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {detail.user.status === 'PENDING' && (
                  <>
                    <button className="btn btn-success" onClick={() => approve(detail.user.id)}>Approve</button>
                    <button className="btn btn-outline-danger" onClick={() => setRejectModal(detail.user)}>Reject</button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setRejectModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Student</h5>
                <button className="btn-close" onClick={() => setRejectModal(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  Rejecting <strong>{rejectModal.email}</strong>. Reason will be emailed to the student.
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Optional reason (e.g. incomplete details)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={reject}>Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}