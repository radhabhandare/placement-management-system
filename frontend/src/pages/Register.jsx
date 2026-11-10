// frontend/src/pages/Register.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/client'
import Navbar from '../components/Navbar'

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    registration_number: '',
    date_of_birth: '',
    gender: '',
    location: '',
    contact_number: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await API.post('/auth/register/', form)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => {
          const val = Array.isArray(v) ? v[0] : v
          return `${k}: ${val}`
        })
        setError(msgs.join('\n'))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="auth-card text-center">
          <i className="bi bi-check-circle-fill text-success display-3"></i>
          <h3 className="mt-3">Registration Submitted!</h3>
          <p className="text-muted">
            Your registration is pending admin approval.<br />
            You will receive an email once approved.
          </p>
          <Link to="/login" className="btn btn-primary mt-2">Go to Login</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="auth-card-wide">
          <h3 className="text-center mb-1">Student Registration</h3>
          <p className="text-center text-muted small mb-4">
            Create your account to start your placement journey
          </p>

          {error && (
            <div className="alert alert-danger small" style={{ whiteSpace: 'pre-line' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <h6 className="text-navy mt-3 mb-3 pb-2 border-bottom">
              <i className="bi bi-person me-2"></i>Personal Information
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.first_name} onChange={update('first_name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.last_name} onChange={update('last_name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Registration Number <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.registration_number} onChange={update('registration_number')} placeholder="e.g. BT22CSE001" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input type="email" className="form-control" required value={form.email} onChange={update('email')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                <input type="date" className="form-control" required value={form.date_of_birth} onChange={update('date_of_birth')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={update('gender')}>
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Location <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.location} onChange={update('location')} placeholder="City" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Number <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.contact_number} onChange={update('contact_number')} placeholder="10-digit mobile" maxLength={10} />
              </div>
            </div>

            <h6 className="text-navy mt-4 mb-3 pb-2 border-bottom">
              <i className="bi bi-lock me-2"></i>Account Security
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Password <span className="text-danger">*</span></label>
                <input type="password" className="form-control" required minLength={8} value={form.password} onChange={update('password')} placeholder="Min 8 characters" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                <input type="password" className="form-control" required value={form.confirm_password} onChange={update('confirm_password')} />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <small className="text-muted">
                Already registered? <Link to="/login">Login here</Link>
              </small>
              <button className="btn btn-primary px-4" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}