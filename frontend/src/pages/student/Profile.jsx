// frontend/src/pages/student/Profile.jsx
import { useEffect, useState } from 'react'
import API from '../../api/client'

const TABS = [
  ['personal', 'Personal', 'bi-person'],
  ['education', 'Education', 'bi-mortarboard'],
  ['skills', 'Skills', 'bi-lightning'],
  ['projects', 'Projects', 'bi-folder'],
  ['experience', 'Experience', 'bi-briefcase'],
  ['resume', 'Resume', 'bi-file-earmark-text'],
]

export default function Profile() {
  const [tab, setTab] = useState('personal')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get('/auth/profile/')
      setProfile(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loader-center"><div className="spinner-border text-primary"></div></div>
  if (!profile) return <div className="alert alert-danger">Failed to load profile</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Profile</h2>
          <p className="text-muted mb-0">Manage your personal information, education, and skills</p>
        </div>
        <div className="text-end">
          <div className="text-muted small mb-1">Profile completion</div>
          <div style={{ width: 180 }}>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${profile.user.profile_completion}%` }}></div>
            </div>
            <div className="small text-end mt-1">{profile.user.profile_completion}%</div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map(([key, label, icon]) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link ${tab === key ? 'active' : 'text-dark'}`}
              onClick={() => setTab(key)}
            >
              <i className={`bi ${icon} me-1`}></i>{label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'personal' && <PersonalSection profile={profile} onUpdate={load} />}
      {tab === 'education' && <EducationSection profile={profile} onUpdate={load} />}
      {tab === 'skills' && <SkillsSection profile={profile} onUpdate={load} />}
      {tab === 'projects' && <ProjectsSection profile={profile} onUpdate={load} />}
      {tab === 'experience' && <ExperienceSection profile={profile} onUpdate={load} />}
      {tab === 'resume' && <ResumeSection profile={profile} onUpdate={load} />}
    </div>
  )
}

// ============================================================
// Personal
// ============================================================
function PersonalSection({ profile, onUpdate }) {
  const u = profile.user
  const p = profile
  const [form, setForm] = useState({
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    date_of_birth: u.date_of_birth || '',
    gender: u.gender || '',
    location: u.location || '',
    contact_number: u.contact_number || '',
    experience_type: p.experience_type || 'FRESHER',
    experience_details: p.experience_details || '',
    hobbies: p.hobbies || '',
    interests: p.interests || '',
    desired_job_positions: p.desired_job_positions || '',
    preferred_locations: p.preferred_locations || '',
    linkedin_url: p.linkedin_url || '',
    github_url: p.github_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await API.put('/auth/profile/', form)
      setMsg({ type: 'success', text: 'Profile updated!' })
      onUpdate()
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.error || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="card p-4">
      {msg && <div className={`alert alert-${msg.type} small`}>{msg.text}</div>}

      <h6 className="pb-2 border-bottom mb-3">Basic Info</h6>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={form.first_name} onChange={update('first_name')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input className="form-control" value={form.last_name} onChange={update('last_name')} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-control" value={form.date_of_birth} onChange={update('date_of_birth')} />
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
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.contact_number} onChange={update('contact_number')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Location</label>
          <input className="form-control" value={form.location} onChange={update('location')} />
        </div>
      </div>

      <h6 className="pb-2 border-bottom mb-3 mt-3">Career Preferences</h6>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Experience Type</label>
          <select className="form-select" value={form.experience_type} onChange={update('experience_type')}>
            <option value="FRESHER">Fresher</option>
            <option value="EXPERIENCED">Experienced</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Desired Job Positions</label>
          <input className="form-control" placeholder="e.g. Software Engineer, Data Analyst" value={form.desired_job_positions} onChange={update('desired_job_positions')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Preferred Locations</label>
          <input className="form-control" placeholder="e.g. Pune, Bangalore" value={form.preferred_locations} onChange={update('preferred_locations')} />
        </div>
        <div className="col-md-12">
          <label className="form-label">Experience Details (optional)</label>
          <textarea rows={2} className="form-control" value={form.experience_details} onChange={update('experience_details')} />
        </div>
      </div>

      <h6 className="pb-2 border-bottom mb-3 mt-3">Interests & Links</h6>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Hobbies</label>
          <textarea rows={2} className="form-control" value={form.hobbies} onChange={update('hobbies')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Interests</label>
          <textarea rows={2} className="form-control" value={form.interests} onChange={update('interests')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">LinkedIn URL</label>
          <input className="form-control" value={form.linkedin_url} onChange={update('linkedin_url')} />
        </div>
        <div className="col-md-6">
          <label className="form-label">GitHub URL</label>
          <input className="form-control" value={form.github_url} onChange={update('github_url')} />
        </div>
      </div>

      <div className="text-end">
        <button className="btn btn-primary px-4" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// Education
// ============================================================
function EducationSection({ profile, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = {
    level: 'GRAD',
    institution: '',
    degree: '',
    branch: '',
    passing_year: new Date().getFullYear(),
    percentage: '',
    cgpa: '',
    active_backlogs: 0,
    total_backlogs: 0,
  }
  const [form, setForm] = useState(emptyForm)

  const startAdd = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const startEdit = (edu) => { setForm({ ...edu }); setEditing(edu.id); setShowForm(true) }

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const save = async () => {
    try {
      const payload = { ...form }
      if (payload.percentage === '') payload.percentage = null
      if (payload.cgpa === '') payload.cgpa = null
      if (editing) {
        await API.put(`/auth/education/${editing}/`, payload)
      } else {
        await API.post('/auth/education/', payload)
      }
      setShowForm(false)
      onUpdate()
    } catch (err) {
      alert(JSON.stringify(err.response?.data || 'Save failed'))
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this education record?')) return
    try {
      await API.delete(`/auth/education/${id}/`)
      onUpdate()
    } catch {
      alert('Delete failed')
    }
  }

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0 pb-2">Education Records</h6>
        <button className="btn btn-sm btn-primary" onClick={startAdd}>
          <i className="bi bi-plus-lg me-1"></i>Add Education
        </button>
      </div>

      {profile.educations?.length === 0 ? (
        <p className="text-muted small">No education records yet. Add your graduation details to become job-eligible.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Level</th>
                <th>Institution</th>
                <th>Degree / Branch</th>
                <th>Passing Year</th>
                <th>CGPA / %</th>
                <th>Backlogs</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profile.educations.map(e => (
                <tr key={e.id}>
                  <td><span className="badge bg-light text-dark">{e.level}</span></td>
                  <td>{e.institution}</td>
                  <td className="small">{e.degree} {e.branch && `• ${e.branch}`}</td>
                  <td>{e.passing_year}</td>
                  <td className="small">{e.cgpa || '—'} {e.percentage ? `/ ${e.percentage}%` : ''}</td>
                  <td>{e.active_backlogs}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(e)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Education</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={form.level} onChange={update('level')}>
                      <option value="TENTH">10th</option>
                      <option value="TWELFTH">12th</option>
                      <option value="GRAD">Graduation</option>
                      <option value="POST_GRAD">Post-Graduation</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Passing Year</label>
                    <input type="number" className="form-control" value={form.passing_year} onChange={update('passing_year')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Institution</label>
                    <input className="form-control" value={form.institution} onChange={update('institution')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Degree</label>
                    <input className="form-control" placeholder="e.g. B.Tech" value={form.degree} onChange={update('degree')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Branch</label>
                    <input className="form-control" placeholder="e.g. CSE" value={form.branch} onChange={update('branch')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Percentage</label>
                    <input type="number" step="0.01" className="form-control" value={form.percentage} onChange={update('percentage')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">CGPA</label>
                    <input type="number" step="0.01" className="form-control" value={form.cgpa} onChange={update('cgpa')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Active Backlogs</label>
                    <input type="number" className="form-control" value={form.active_backlogs} onChange={update('active_backlogs')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Total Backlogs</label>
                    <input type="number" className="form-control" value={form.total_backlogs} onChange={update('total_backlogs')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Skills
// ============================================================
function SkillsSection({ profile, onUpdate }) {
  const [name, setName] = useState('')
  const [softName, setSoftName] = useState('')

  const addTech = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await API.post('/auth/skills/', { skill_name: name.trim() })
      setName('')
      onUpdate()
    } catch { alert('Failed') }
  }

  const removeTech = async (id) => {
    try { await API.delete(`/auth/skills/${id}/`); onUpdate() } catch {}
  }

  const addSoft = async (e) => {
    e.preventDefault()
    if (!softName.trim()) return
    try {
      await API.post('/auth/soft-skills/', { skill_name: softName.trim() })
      setSoftName('')
      onUpdate()
    } catch { alert('Failed') }
  }

  const removeSoft = async (id) => {
    try { await API.delete(`/auth/soft-skills/${id}/`); onUpdate() } catch {}
  }

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="card p-4 h-100">
          <h6 className="pb-2 border-bottom mb-3">Technical Skills</h6>
          <form className="d-flex gap-2 mb-3" onSubmit={addTech}>
            <input className="form-control" placeholder="e.g. Python, Django, MySQL" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-primary">Add</button>
          </form>
          <div className="d-flex flex-wrap gap-2">
            {profile.technical_skills?.length === 0 && <small className="text-muted">No technical skills yet.</small>}
            {profile.technical_skills?.map(s => (
              <span key={s.id} className="badge bg-primary-subtle text-primary border">
                {s.skill_name}
                <button className="btn btn-sm p-0 ms-2 text-danger" onClick={() => removeTech(s.id)}>
                  <i className="bi bi-x"></i>
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card p-4 h-100">
          <h6 className="pb-2 border-bottom mb-3">Soft Skills</h6>
          <form className="d-flex gap-2 mb-3" onSubmit={addSoft}>
            <input className="form-control" placeholder="e.g. Leadership, Communication" value={softName} onChange={e => setSoftName(e.target.value)} />
            <button className="btn btn-primary">Add</button>
          </form>
          <div className="d-flex flex-wrap gap-2">
            {profile.soft_skills?.length === 0 && <small className="text-muted">No soft skills yet.</small>}
            {profile.soft_skills?.map(s => (
              <span key={s.id} className="badge bg-success-subtle text-success border">
                {s.skill_name}
                <button className="btn btn-sm p-0 ms-2 text-danger" onClick={() => removeSoft(s.id)}>
                  <i className="bi bi-x"></i>
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Projects
// ============================================================
function ProjectsSection({ profile, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', technologies: '', link: '' })
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const save = async () => {
    try {
      await API.post('/auth/projects/', form)
      setShowForm(false)
      setForm({ title: '', description: '', technologies: '', link: '' })
      onUpdate()
    } catch (err) {
      alert(JSON.stringify(err.response?.data || 'Save failed'))
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return
    try { await API.delete(`/auth/projects/${id}/`); onUpdate() } catch {}
  }

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0">Projects</h6>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1"></i>Add Project
        </button>
      </div>

      {profile.projects?.length === 0 ? (
        <p className="text-muted small">No projects added yet.</p>
      ) : (
        <div className="row g-3">
          {profile.projects.map(p => (
            <div className="col-md-6" key={p.id}>
              <div className="border rounded p-3 h-100">
                <div className="d-flex justify-content-between">
                  <h6 className="mb-1">{p.title}</h6>
                  <button className="btn btn-sm text-danger p-0" onClick={() => remove(p.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
                <p className="small text-muted mb-2">{p.description}</p>
                {p.technologies && <div className="small"><strong>Tech:</strong> {p.technologies}</div>}
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="small">View →</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Project</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input className="form-control" value={form.title} onChange={update('title')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea rows={3} className="form-control" value={form.description} onChange={update('description')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Technologies</label>
                  <input className="form-control" placeholder="Python, Django, React" value={form.technologies} onChange={update('technologies')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Link</label>
                  <input className="form-control" placeholder="https://github.com/..." value={form.link} onChange={update('link')} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Experience
// ============================================================
function ExperienceSection({ profile, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    company_name: '', role: '', start_date: '', end_date: '', description: '', is_current: false,
  })
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const save = async () => {
    try {
      const payload = { ...form }
      if (payload.end_date === '') payload.end_date = null
      await API.post('/auth/experiences/', payload)
      setShowForm(false)
      onUpdate()
    } catch (err) {
      alert(JSON.stringify(err.response?.data || 'Save failed'))
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this experience?')) return
    try { await API.delete(`/auth/experiences/${id}/`); onUpdate() } catch {}
  }

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0">Work Experience</h6>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1"></i>Add Experience
        </button>
      </div>

      {profile.experiences?.length === 0 ? (
        <p className="text-muted small">No experience added yet.</p>
      ) : (
        <div className="list-group">
          {profile.experiences.map(e => (
            <div key={e.id} className="list-group-item d-flex justify-content-between align-items-start">
              <div>
                <h6 className="mb-1">{e.role} at <span className="text-primary">{e.company_name}</span></h6>
                <small className="text-muted">
                  {e.start_date} — {e.is_current ? 'Present' : (e.end_date || '—')}
                </small>
                {e.description && <p className="small mb-0 mt-2">{e.description}</p>}
              </div>
              <button className="btn btn-sm text-danger p-0" onClick={() => remove(e.id)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Experience</h5>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Company</label>
                    <input className="form-control" value={form.company_name} onChange={update('company_name')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Role</label>
                    <input className="form-control" value={form.role} onChange={update('role')} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={form.start_date} onChange={update('start_date')} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={form.end_date} onChange={update('end_date')} disabled={form.is_current} />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={form.is_current} onChange={e => setForm({ ...form, is_current: e.target.checked, end_date: '' })} />
                      <label className="form-check-label">Currently working here</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea rows={3} className="form-control" value={form.description} onChange={update('description')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Resume upload
// ============================================================
function ResumeSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false)

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5 MB'); return
    }
    const fd = new FormData()
    fd.append('resume', file)
    setUploading(true)
    try {
      await API.post('/auth/profile/resume/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Resume uploaded!')
      onUpdate()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card p-4">
      <h6 className="pb-2 border-bottom mb-3">Resume</h6>
      {profile.resume_url ? (
        <div className="alert alert-success small">
          <i className="bi bi-check-circle me-1"></i>
          Resume uploaded — <a href={profile.resume_url} target="_blank" rel="noreferrer">view current resume</a>
        </div>
      ) : (
        <div className="alert alert-warning small">No resume uploaded yet. Add one to auto-attach to applications.</div>
      )}
      <label className="form-label">Upload new resume (PDF / DOCX, max 5 MB)</label>
      <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={upload} disabled={uploading} />
      {uploading && <div className="small text-muted mt-1">Uploading...</div>}
    </div>
  )
}