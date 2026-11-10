// frontend/src/pages/admin/Companies.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())

  function emptyForm() {
    return {
      company_name: '',
      company_code: '',
      industry: '',
      domain: '',
      location: '',
      head_office: '',
      branches: '',
      contact_number: '',
      email: '',
      website: '',
      linkedin_url: '',
      hr_name: '',
      hr_email: '',
      hr_phone: '',
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get('/jobs/admin/companies/')
      setCompanies(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startAdd = () => {
    setForm(emptyForm())
    setEditing(null)
    setShowForm(true)
  }

  const startEdit = (c) => {
    setForm({ ...emptyForm(), ...c })
    setEditing(c.id)
    setShowForm(true)
  }

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const save = async () => {
    try {
      if (editing) {
        await API.put(`/jobs/admin/companies/${editing}/`, form)
      } else {
        await API.post('/jobs/admin/companies/', form)
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

  const deactivate = async (id, name) => {
    if (!confirm(`Deactivate "${name}"? It will no longer appear for students, but existing jobs remain.`)) return
    try {
      await API.delete(`/jobs/admin/companies/${id}/`)
      load()
    } catch {
      alert('Deactivate failed')
    }
  }

  const reactivate = async (id) => {
    try {
      await API.put(`/jobs/admin/companies/${id}/`, { is_active: true })
      load()
    } catch {
      alert('Reactivate failed')
    }
  }

  const filtered = companies.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.company_code?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Company Management</h2>
          <p className="text-muted mb-0">Add and manage hiring partner companies</p>
        </div>
        <button className="btn btn-primary" onClick={startAdd}>
          <i className="bi bi-plus-lg me-1"></i>Add Company
        </button>
      </div>

      <div className="mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 400 }}
          placeholder="Search by name, code, industry, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <i className="bi bi-building fs-1 mb-2"></i>
          <p className="mb-3">{companies.length === 0 ? 'No companies yet. Add your first hiring partner!' : 'No companies match your search.'}</p>
          {companies.length === 0 && (
            <button className="btn btn-primary mx-auto" style={{ maxWidth: 200 }} onClick={startAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add First Company
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Company</th>
                  <th>Code</th>
                  <th>Industry</th>
                  <th>Location</th>
                  <th>HR Contact</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className={!c.is_active ? 'opacity-75' : ''}>
                    <td>
                      <div className="fw-semibold">{c.company_name}</div>
                      {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="small">Website →</a>}
                    </td>
                    <td><code>{c.company_code}</code></td>
                    <td className="small">{c.industry || '—'}</td>
                    <td className="small">{c.location || '—'}</td>
                    <td className="small">
                      {c.hr_name || '—'}
                      {c.hr_email && <div className="text-muted">{c.hr_email}</div>}
                    </td>
                    <td>
                      {c.is_active
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-secondary">Inactive</span>}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      {c.is_active ? (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(c.id, c.company_name)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-outline-success" onClick={() => reactivate(c.id)}>
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit Company' : 'Add New Company'}</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <h6 className="pb-2 border-bottom mb-3">Basic Info</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Company Name <span className="text-danger">*</span></label>
                    <input className="form-control" value={form.company_name} onChange={update('company_name')} placeholder="e.g. Infosys Limited" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Company Code <span className="text-danger">*</span></label>
                    <input className="form-control" value={form.company_code} onChange={update('company_code')} placeholder="e.g. INFY-001" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Industry</label>
                    <input className="form-control" value={form.industry} onChange={update('industry')} placeholder="IT Services, Finance, etc." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Domain</label>
                    <input className="form-control" value={form.domain} onChange={update('domain')} placeholder="Software Development" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={form.location} onChange={update('location')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Head Office</label>
                    <input className="form-control" value={form.head_office} onChange={update('head_office')} />
                  </div>
                </div>

                <h6 className="pb-2 border-bottom mb-3 mt-3">Contact</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Contact Number</label>
                    <input className="form-control" value={form.contact_number} onChange={update('contact_number')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={update('email')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Website</label>
                    <input className="form-control" value={form.website} onChange={update('website')} placeholder="https://" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">LinkedIn URL</label>
                    <input className="form-control" value={form.linkedin_url} onChange={update('linkedin_url')} placeholder="https://linkedin.com/company/..." />
                  </div>
                </div>

                <h6 className="pb-2 border-bottom mb-3 mt-3">HR Contact</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">HR Name</label>
                    <input className="form-control" value={form.hr_name} onChange={update('hr_name')} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">HR Email</label>
                    <input type="email" className="form-control" value={form.hr_email} onChange={update('hr_email')} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">HR Phone</label>
                    <input className="form-control" value={form.hr_phone} onChange={update('hr_phone')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>
                  {editing ? 'Update' : 'Create'} Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}