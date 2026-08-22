import axios from 'axios'

/**
 * Unified API service for all user types.
 * All calls proxy through vite → http://localhost:7002
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ── Request interceptor — attach JWT + fix FormData boundary ─────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mpkv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // When body is FormData, delete the default Content-Type so axios sets
  // multipart/form-data with the correct boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// ── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mpkv_token')
      localStorage.removeItem('mpkv_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (userLoginID, userPassword) =>
    api.post('/auth/login', { userLoginID, userPassword }),
  me: () => api.get('/auth/me')
}

// ── Home ─────────────────────────────────────────────────────────────────────
export const homeApi = {
  getHomeData: (regionId = 1) => api.get(`/home?regionId=${regionId}`)
}

// ── Registration ─────────────────────────────────────────────────────────────
export const registrationApi = {
  checkStatus : ()        => api.get('/registration/check-status'),
  getMasters  : ()        => api.get('/registration/masters'),
  register    : (data)    => api.post('/registration/register', data),
  getInfo     : (loginId) => api.get(`/registration/info?loginId=${encodeURIComponent(loginId)}`)
}

// ── Account Recovery ─────────────────────────────────────────────────────────
export const accountApi = {
  getMasters              : ()     => api.get('/account/masters'),
  forgotLoginIdSendOtp    : (data) => api.post('/account/forgot-login-id/send-otp', data),
  forgotLoginIdVerifyOtp  : (data) => api.post('/account/forgot-login-id/verify-otp', data),
  resetBySecurityQuestion : (data) => api.post('/account/reset-password-by-security-question', data),
  sendOtpMobile           : (data) => api.post('/account/send-otp/mobile', data),
  sendOtpEmail            : (data) => api.post('/account/send-otp/email', data),
  verifyOtp               : (data) => api.post('/account/verify-otp', data),
  resetPassword           : (data) => api.post('/account/reset-password', data),
}

// ── Candidate Dashboard ───────────────────────────────────────────────────────
export const dashboardApi = {
  getDashboard : () => api.get('/dashboard'),
  getProgress  : () => api.get('/dashboard/progress')
}

// ── Application Form (Candidate) ─────────────────────────────────────────────
export const applicationFormApi = {
  getPersonalMasters      : ()       => api.get('/applicationform/masters/personal'),
  getPersonal             : ()       => api.get('/applicationform/personal'),
  savePersonal            : (data)   => api.post('/applicationform/personal', data),

  getAddressMasters       : ()       => api.get('/applicationform/masters/address'),
  getAddress              : ()       => api.get('/applicationform/address'),
  saveAddress             : (data)   => api.post('/applicationform/address', data),

  getCategoryMasters      : ()       => api.get('/applicationform/masters/category'),
  getCategory             : ()       => api.get('/applicationform/category'),
  saveCategory            : (data)   => api.post('/applicationform/category', data),

  getSportsMasters        : ()       => api.get('/applicationform/masters/sports'),
  getSports               : ()       => api.get('/applicationform/sports'),
  saveSports              : (data)   => api.post('/applicationform/sports', data),

  getAvailableOptions     : ()           => api.get('/applicationform/options/available'),
  getShortlistedOptions   : ()           => api.get('/applicationform/options/shortlisted'),
  addOption               : (data)       => api.post('/applicationform/options/add', data),
  removeOption            : (collegeId)  => api.delete(`/applicationform/options/remove/${collegeId}`),
  saveShortlist           : ()           => api.post('/applicationform/options/save'),

  getPreferencedOptions   : ()     => api.get('/applicationform/options/preferenced'),
  savePreferences         : (data) => api.post('/applicationform/options/preferences', data),
  resetPreferences        : ()     => api.post('/applicationform/options/preferences/reset'),

  getPhotoSign            : ()     => api.get('/applicationform/photo-sign'),
  uploadPhoto             : (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/applicationform/upload-photo', fd) },
  uploadSign              : (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/applicationform/upload-sign', fd) },
  savePhotoSign           : ()     => api.post('/applicationform/photo-sign/save'),

  getQualificationMasters : ()     => api.get('/applicationform/masters/qualification'),
  getQualification        : ()     => api.get('/applicationform/qualification'),
  saveQualification       : (data) => api.post('/applicationform/qualification', data),

  getDocuments    : ()                         => api.get('/applicationform/documents'),
  uploadDocument  : (documentId, documentNo, documentIssueDate, file) => {
    const fd = new FormData()
    fd.append('documentId',        documentId)
    fd.append('documentNo',        documentNo        || '')
    fd.append('documentIssueDate', documentIssueDate || '')
    fd.append('file', file)
    return api.post('/applicationform/documents/upload', fd)
  },
  deleteDocument  : (documentId) => api.delete(`/applicationform/documents/delete/${documentId}`),
  saveDocuments   : ()           => api.post('/applicationform/documents/save'),

  getFeeDetails   : ()                   => api.get('/applicationform/fee'),
  initiateFee     : (paymentGatewayID)   => api.post('/applicationform/fee/initiate', { paymentGatewayID }),
  proceedFee      : ()                   => api.post('/applicationform/fee/proceed'),
}

// ── Fee gateway callbacks ─────────────────────────────────────────────────────
export const feeApi = {
  getPaymentSuccess : (txId, refNo, amount) =>
    api.get(`/fee/payment-success?txId=${txId}&refNo=${encodeURIComponent(refNo ?? '')}&amount=${amount ?? 0}`),
  getPaymentFailed  : (msg) =>
    api.get(`/fee/payment-failed?msg=${encodeURIComponent(msg ?? '')}`),
}

// ── College (self-service — UserTypeID 61) ────────────────────────────────────
export const collegeApi = {
  getDashboard  : ()                     => api.get('/college/dashboard'),
  getSummary    : (collegeId)            => api.get(collegeId ? `/college/summary?collegeId=${collegeId}` : '/college/summary'),
  getDetails    : (collegeId)            => api.get(collegeId ? `/college/details?collegeId=${collegeId}` : '/college/details'),
  save          : (data, collegeId)      => api.post(collegeId ? `/college/save?collegeId=${collegeId}` : '/college/save', data),
  activate      : (collegeId)            => api.post(`/college/activate?collegeId=${collegeId}`),
  deactivate    : (collegeId)            => api.post(`/college/deactivate?collegeId=${collegeId}`),
}

// ── Admin college management (UserTypeID 11/12) ───────────────────────────────
export const adminCollegeApi = {
  getList           : (params)       => api.get('/admin/college/list', { params }),
  getPasswords      : (params)       => api.get('/admin/college/passwords', { params }),
  getCurrentPassword: (collegeCode)  => api.get(`/admin/college/current-password/${collegeCode}`),
  resetPassword     : (data)         => api.post('/admin/college/reset-password', data),
}

export default api
