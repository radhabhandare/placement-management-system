// frontend/src/pages/student/Applications.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get('/jobs/student/applications/')
      setApps(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const view = async (id) => {
    try {
      const res = await API.get(`/jobs/student/applications/${id}/`)
      setDetail(res.data)
    } catch {
      alert('Failed to load details')
    }
  }

  const withdraw = async (id) => {
    if (!confirm('Withdraw this application?')) return
    try {
      await API.post(`/jobs/student/applications/${id}/withdraw/`)
      alert('Application withdrawn')
      setDetail(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Withdraw failed')
    }
  }

  return (
    <div>
      <h2 className="mb-1">My Applications</h2>
      <p className="text-muted mb-4">Track all your job applications and their status</p>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : apps.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-file-earmark-x fs-1 mb-2"></i>
          <p className="mb-0">You haven't applied to any jobs yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-semibold">{a.job_title}</div>
                      <small className="text-muted">{a.job_code}</small>
                    </td>
                    <td>{a.company_name}</td>
                    <td className="small text-muted">{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td><span className={`badge-status badge-${a.status}`}>{a.status}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => view(a.id)}>View</button>
                      {['APPLIED', 'REVIEWING', 'SHORTLISTED'].includes(a.status) && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => withdraw(a.id)}>Withdraw</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Details</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Job:</strong> {detail.application.job_title} at {detail.application.company_name}</p>
                <p><strong>Applied:</strong> {new Date(detail.application.applied_at).toLocaleString()}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`badge-status badge-${detail.application.status}`}>
                    {detail.application.status}
                  </span>
                </p>

                {detail.interview && (
                  <>
                    <h6 className="mt-3 pb-2 border-bottom">Interview</h6>
                    <p className="small mb-1"><strong>When:</strong> {new Date(detail.interview.scheduled_at).toLocaleString()}</p>
                    <p className="small mb-1"><strong>Mode:</strong> {detail.interview.mode}</p>
                    <p className="small mb-1"><strong>Location/Link:</strong> {detail.interview.location_or_link || '—'}</p>
                    <p className="small mb-0"><strong>Notes:</strong> {detail.interview.notes || '—'}</p>
                  </>
                )}

                <h6 className="mt-3 pb-2 border-bottom">History</h6>
                <ul className="list-unstyled small">
                  {detail.history?.map(h => (
                    <li key={h.id} className="mb-2">
                      <span className="badge-status badge-${h.to_status}" style={{ minWidth: 90 }}>
                        <span className={`badge-status badge-${h.to_status}`}>{h.to_status}</span>
                      </span>
                      <span className="ms-2 text-muted">{new Date(h.changed_at).toLocaleString()}</span>
                      {h.note && <div className="text-muted mt-1">{h.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}