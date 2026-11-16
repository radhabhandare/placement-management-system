// frontend/src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login(email, password)
      nav(user.role === 'ADMIN' ? '/admin' : '/student')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h3 className="mt-2 mb-0">Welcome Back</h3>
          <p className="text-muted small">Sign in to your account</p>
        </div>

        {error && <div className="alert alert-danger small">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="text-end mb-3">
            <Link to="/forgot-password" className="small">
              Forgot password?
            </Link>
          </div>
          <button className="btn btn-primary w-100 py-2" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 mb-0 small">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </>
  )
}