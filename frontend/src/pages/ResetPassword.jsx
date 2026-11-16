// frontend/src/pages/ResetPassword.jsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import API from '../api/client'
import Navbar from '../components/Navbar'

export default function ResetPassword() {
  const { token } = useParams()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await API.post(`/auth/reset-password/${token}/`, {
        password,
        confirm_password: confirm,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="auth-card text-center">
          <i className="bi bi-check-circle-fill text-success display-3"></i>
          <h3 className="mt-3">Password Reset Successful</h3>
          <p className="text-muted">
            Your password has been updated. You can now log in with your new password.
          </p>
          <button className="btn btn-primary mt-2" onClick={() => nav('/login')}>
            Go to Login
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h3 className="mt-2 mb-0">Set New Password</h3>
          <p className="text-muted small">Choose a strong password (min 8 characters)</p>
        </div>

        {error && <div className="alert alert-danger small">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center mt-4 mb-0 small">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </>
  )
}