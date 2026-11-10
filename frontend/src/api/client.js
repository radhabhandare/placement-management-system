// frontend/src/api/client.js
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh access token on 401
API.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config
    const refresh = localStorage.getItem('refresh')
    if (
      error.response?.status === 401 &&
      !orig._retry &&
      refresh &&
      !orig.url.includes('/auth/login/') &&
      !orig.url.includes('/auth/register/')
    ) {
      orig._retry = true
      try {
        const res = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh })
        localStorage.setItem('access', res.data.access)
        orig.headers.Authorization = `Bearer ${res.data.access}`
        return axios(orig)
      } catch {
        localStorage.clear()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default API
export { BASE_URL }