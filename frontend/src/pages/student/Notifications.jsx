// frontend/src/pages/student/Notifications.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get('/notifications/')
      setItems(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    try {
      await API.post('/notifications/')
      load()
    } catch {
      alert('Failed to mark all')
    }
  }

  const markOne = async (id) => {
    try {
      await API.post(`/notifications/${id}/read/`)
      load()
    } catch {}
  }

  const unread = items.filter(n => !n.is_read).length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Notifications</h2>
          <p className="text-muted mb-0">
            {unread > 0 ? `${unread} unread` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : items.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-bell-slash fs-1 mb-2"></i>
          <p className="mb-0">No notifications yet.</p>
          <small className="text-muted mt-2">You'll see updates here when admin takes action on your applications.</small>
        </div>
      ) : (
        <div className="card">
          <ul className="list-group list-group-flush">
            {items.map(n => (
              <li key={n.id}
                className={`list-group-item ${!n.is_read ? 'bg-light-blue' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => !n.is_read && markOne(n.id)}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {!n.is_read && <span className="badge bg-primary me-2 small">New</span>}
                      {n.title}
                    </div>
                    <div className="text-muted small mt-1">{n.message}</div>
                  </div>
                  <small className="text-muted text-nowrap ms-3">
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}