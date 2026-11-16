// frontend/src/pages/ForgotPassword.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/client'
import Navbar from '../components/Navbar'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await API.post('/auth/forgot-password/', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <Navbar />
        <div className="auth-card text-center">
          <i className="bi bi-envelope-check-fill text-success display-3"></i>
          <h3 className="mt-3">Check Your Email</h3>
          <p className="text-muted">
            If <strong>{email}</strong> is registered, we've sent a password reset link.<br />
            It will arrive within a minute. Check your Spam folder if you don't see it.
          </p>
          <p className="small text-muted mt-3">
            The link expires in 24 hours.
          </p>
          <Link to="/login" className="btn btn-primary mt-2">
            Back to Login
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-key-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h3 className="mt-2 mb-0">Forgot Password?</h3>
          <p className="text-muted small">Enter your email and we'll send a reset link</p>
        </div>

        {error && <div className="alert alert-danger small">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <button className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center mt-4 mb-0 small">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </>
  )
}