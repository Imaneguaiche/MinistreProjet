import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hd_token')
      localStorage.removeItem('hd_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
