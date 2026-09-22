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
  getHomeData             : (regionId = 1) => api.get(`/home?regionId=${regionId}`),
  getSearchCollegeMasters : ()             => api.get('/home/search-college/masters'),
  searchCollege           : (data)         => api.post('/home/search-college', data),
  getAllotmentListMasters  : ()             => api.get('/home/allotment-list/masters'),
  getCollegesByCourse     : (courseId)     => api.post('/home/allotment-list/colleges', courseId),
  getAllotmentList         : (data)         => api.post('/home/allotment-list', data),
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
  // Miscellaneous
  changePassword          : (data) => api.post('/account/change-password', data),
  changeMobile            : (data) => api.post('/account/change-mobile', data),
  changeEmail             : (data) => api.post('/account/change-email', data),
  getSecurityQuestion     : ()     => api.get('/account/security-question'),
  changeSecurityQuestion  : (data) => api.post('/account/change-security-question', data),
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

  getSummary      : ()                   => api.get('/applicationform/summary'),
  lockForm        : ()                   => api.post('/applicationform/summary/lock'),
  getUnlockEligibility : ()             => api.get('/applicationform/unlock/eligibility'),
  unlockForm      : ()                   => api.post('/applicationform/unlock'),
}

// ── Fee gateway callbacks ─────────────────────────────────────────────────────
export const feeApi = {
  getPaymentSuccess : (txId, refNo, amount) =>
    api.get(`/fee/payment-success?txId=${txId}&refNo=${encodeURIComponent(refNo ?? '')}&amount=${amount ?? 0}`),
  getPaymentFailed  : (msg) =>
    api.get(`/fee/payment-failed?msg=${encodeURIComponent(msg ?? '')}`),
  getTransactionHistory      : ()       => api.get('/fee/transaction-history'),
  getAdminTransactionHistory : (appId)  => api.get(`/fee/admin-transaction-history/${encodeURIComponent(appId)}`),
  getReceipt            : (txId) => api.get(`/fee/receipt/${txId}`),
}

// ── Fee Admin Tools (UserTypeID 11 only) ──────────────────────────────────────
export const feeAdminApi = {
  getFailedTransactionDates  : ()       => api.get('/fee/admin/failed-transactions/dates'),
  checkFailedTransactions    : (date)   => api.post('/fee/admin/failed-transactions/check', { transactionDate: date }),
  getDuplicateTransactions   : ()       => api.get('/fee/admin/duplicate-transactions'),
  getTransactionsForRefund   : (input)  => api.get(`/fee/admin/transactions-for-refund/${encodeURIComponent(input)}`),
  initiateRefund             : (data)   => api.post('/fee/admin/initiate-refund', data),
  acceptChargeBack           : (txId)   => api.post('/fee/admin/accept-chargeback', { transactionID: txId }),
  getRefundedTransactions    : ()       => api.get('/fee/admin/refunded-transactions'),
  checkRefundStatus          : ()       => api.post('/fee/admin/check-refund-status'),
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
  // Mirrors GetCollegePassword.aspx gvCollegeList_SelectedIndexChanging
  // Sends Login ID + Password to Admission Incharge's mobile via MSG91
  sendPasswordSms   : (collegeCode)  => api.post('/admin/college/send-password-sms', { collegeCode }),
}

// ── Admission / Allotment ─────────────────────────────────────────────────────
export const admissionApi = {
  getPhases                    : ()     => api.get('/admission/phases'),
  checkAllotment               : (data) => api.post('/admission/allotment-status', data),
  downloadLetter               : (data) => api.post('/admission/download-allotment-letter', data),
  payRefusalFee                : (data) => api.post('/admission/refusal-fee', data),
  // AllotmentLetterPrint — no auth token needed (hash-based security)
  getAllotmentLetterData        : (p1, p2, r1) => api.get(`/admission/allotment-letter-print?p1=${p1}&p2=${encodeURIComponent(p2)}&r1=${r1}`),
  checkApplicationID           : (data) => api.post('/admission/check-application-id', data),
  getAdmissionSummary          : (data) => api.post('/admission/admission-summary', data),
  confirmAdmission             : (data) => api.post('/admission/confirm', data),
  rejectAdmission              : (data) => api.post('/admission/reject', data),
  cancelAdmission              : (data) => api.post('/admission/cancel-action', data),
  uploadAdmissionDocument      : (formData) => api.post('/admission/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAllotmentSummary           : ()     => api.get('/admission/allotment-summary'),
  getCategoryConversionFee     : ()     => api.get('/admission/category-conversion-fee'),
  initiateCategoryConversionFee: (data) => api.post('/admission/category-conversion-fee/initiate', data),
}

// ── Counselling (Spot Round) ──────────────────────────────────────────────────
export const counsellingApi = {
  getPhases : ()     => api.get('/counselling/phases'),
  check     : (data) => api.post('/counselling/check', data),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportApi = {
  getPhases             : ()                          => api.get('/reports/phases'),
  getAllotmentByCourse  : (phaseId, collegeId)        => api.get(`/reports/allotment-by-course?phaseId=${phaseId}${collegeId ? `&collegeId=${collegeId}` : ''}`),
  getCompositeByCourse  : (collegeId)                => api.get(`/reports/composite-by-course${collegeId ? `?collegeId=${collegeId}` : ''}`),
  getEligibleForCounselling: ()                      => api.get('/reports/eligible-for-counselling'),
  getAllotmentDetail     : (phaseId, collegeId, flag) => api.get(`/reports/allotment-detail?phaseId=${phaseId}&flag=${flag}${collegeId ? `&collegeId=${collegeId}` : ''}`),
  getCompositeDetail    : (phaseId, collegeId)       => api.get(`/reports/composite-detail?phaseId=${phaseId}${collegeId ? `&collegeId=${collegeId}` : ''}`),
}

// ── User Profile ──────────────────────────────────────────────────────────────
export const profileApi = {
  getProfile  : ()     => api.get('/profile'),
  saveProfile : (data) => api.post('/profile', data),
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export const menuApi = {
  // Navbar — logged-in users (reads UserTypeID from JWT)
  getMenu        : (lang = '')        => api.get(`/menu${lang ? `?lang=${lang}` : ''}`),
  // Public navbar
  getPublicMenu  : (lang = '')        => api.get(`/menu/public${lang ? `?lang=${lang}` : ''}`),

  // Admin — menu management
  getMenusList   : (userTypeId, parentMenuId = 0) => api.get(`/menu/admin/list?userTypeId=${userTypeId}&parentMenuId=${parentMenuId}`),
  getMenuDetails : (menuId)           => api.get(`/menu/admin/${menuId}`),
  saveMenu       : (data)             => api.post('/menu/admin', data),
  deleteMenu     : (menuId)           => api.delete(`/menu/admin/${menuId}`),
  reorderMenus   : (data)             => api.post('/menu/admin/reorder', data),
  getGroups      : (userTypeId)       => api.get(`/menu/admin/groups?userTypeId=${userTypeId}`),
  getAvailable   : (userTypeId, parentMenuId = 0) => api.get(`/menu/admin/available?userTypeId=${userTypeId}&parentMenuId=${parentMenuId}`),
  getLinks       : (directory = '')   => api.get(`/menu/admin/links${directory ? `?directory=${directory}` : ''}`),
  getLinkDetails : (linkId)           => api.get(`/menu/admin/links/${linkId}`),
  saveLink       : (data)             => api.post('/menu/admin/links', data),
}

// ── Notifications (Admin) ──────────────────────────────────────────────────────
export const notificationApi = {
  getList       : ()           => api.get('/admin/notifications'),
  getCategories : ()           => api.get('/admin/notifications/categories'),
  getDetails    : (id)         => api.get(`/admin/notifications/${id}`),
  save          : (data)       => api.post('/admin/notifications', data),
  delete        : (id)         => api.delete(`/admin/notifications/${id}`),
  uploadFile    : (formData)   => api.post('/admin/notifications/upload-file', formData, { headers:{ 'Content-Type':'multipart/form-data' } }),
}

// ── Phase Management (Admin) ──────────────────────────────────────────────────
export const phaseApi = {
  getList    : ()       => api.get('/admin/phases'),
  getDetails : (id)     => api.get(`/admin/phases/${id}`),
  save       : (data)   => api.post('/admin/phases', data),
  delete     : (id)     => api.delete(`/admin/phases/${id}`),
}

// ── Activity Status (Admin) ───────────────────────────────────────────────────
export const activityApi = {
  getList            : ()       => api.get('/admin/activity-status'),
  getDetails         : (name)   => api.get(`/admin/activity-status/${encodeURIComponent(name)}`),
  save               : (data)   => api.post('/admin/activity-status', data),
  getAdmissionList   : ()       => api.get('/admin/activity-status/admission/list'),
  getAdmissionDetails: (phaseId)=> api.get(`/admin/activity-status/admission/${phaseId}`),
  saveAdmission      : (data)   => api.post('/admin/activity-status/admission', data),
}

// ── User Management (Admin) ───────────────────────────────────────────────────
export const userMgmtApi = {
  getTypes  : ()           => api.get('/admin/users/types'),
  getList   : (userTypeId) => api.get(`/admin/users?userTypeId=${userTypeId}`),
  getDetails: (id)         => api.get(`/admin/users/${id}`),
  add       : (data)       => api.post('/admin/users', data),
  edit      : (id, data)   => api.put(`/admin/users/${id}`, data),
  toggle    : (id)         => api.post(`/admin/users/${id}/toggle`),
  sendSms   : (id, userLoginId) => api.post(`/admin/users/${id}/send-sms`, { userLoginId }),
}

// ── Project Configuration (Admin) ─────────────────────────────────────────────
export const configApi = {
  getList   : ()       => api.get('/admin/config'),
  getDetails: (key)    => api.get(`/admin/config/${encodeURIComponent(key)}`),
  save      : (data)   => api.post('/admin/config', data),
}

// ── Report Builder (Admin) ────────────────────────────────────────────────────
export const reportBuilderApi = {
  getList       : ()           => api.get('/admin/reports'),
  getReport     : (id)         => api.get(`/admin/reports/${id}`),
  save          : (data)       => api.post('/admin/reports', data),
  delete        : (id)         => api.delete(`/admin/reports/${id}`),
  execute       : (id)         => api.post(`/admin/reports/${id}/execute`),
  getTableViews : ()           => api.get('/admin/reports/table-views'),
  getColumns    : (tableView)  => api.get(`/admin/reports/columns?tableView=${encodeURIComponent(tableView)}`),
}

// ── Reports List + Generate Report (Admin — Reports menu) ─────────────────────
export const reportsListApi = {
  getList      : ()   => api.get('/admin/reports/list'),
  generateReport: (id) => api.get(`/admin/reports/${id}/generate`),
}

// ── Admin Dashboard (CRM Stats) ───────────────────────────────────────────────
export const adminDashboardApi = {
  getDashboard : () => api.get('/admin/dashboard'),
}

// ── App Settings (Admin — UserTypeID 11 only) ─────────────────────────────────
export const appSettingsApi = {
  getList : () => api.get('/admin/app-settings'),
}

// ── Candidate Utilities (Admin) ───────────────────────────────────────────────
export const candidateUtilsApi = {
  search          : (data)   => api.post('/admin/candidates/search', data),
  getPasswordInfo : (appId)  => api.get(`/admin/candidates/${encodeURIComponent(appId)}/password-info`),
  resetPassword   : (data)   => api.post('/admin/candidates/reset-password', data),
  getDocStatus    : (id)     => api.get(`/admin/candidates/${id}/doc-status`),
  getApplication  : (id)     => api.get(`/admin/candidates/${id}/application`),
  // Admin override — unlock a locked candidate form without fee
  // Mirrors ApplicationFormUnlock.aspx.cs CloseConfirmBoxYes (admin branch)
  unlockForm      : (appId)  => api.post(`/admin/candidates/${encodeURIComponent(appId)}/unlock`),
  changeMobileEmail: (data)  => api.post('/admin/candidates/change-mobile-email', data),
  getSecurityQuestion:  (appId) => api.get(`/admin/candidates/${encodeURIComponent(appId)}/security-question`),
  changeSecurityQuestion:(data) => api.post('/admin/candidates/change-security-question', data),
}

// ── EVerification (UserTypeID 41/42) ──────────────────────────────────────────
export const eVerificationApi = {
  getDashboard    : ()                    => api.get('/everification/dashboard'),
  getCandidates   : (status)              => api.get(`/everification/candidates?status=${encodeURIComponent(status)}`),
  checkApplication: (appId)              => api.get(`/everification/check-application?appId=${encodeURIComponent(appId)}`),
  allot           : (candidateId)        => api.post('/everification/allot', { candidateID: candidateId }),
  getDocuments    : (candidateId)        => api.get(`/everification/documents/${candidateId}`),
  saveVerification: (data)               => api.post('/everification/verify', data),
  // Reports
  getEVCWiseReport          : ()                      => api.get('/everification/reports/evc-wise'),
  getEVCWiseCandidateList   : (evcId, flag)           => api.get(`/everification/reports/evc-candidates?evcId=${evcId}&flag=${flag}`),
  getEligibleCandidates     : (courseId = 0)          => api.get(`/everification/reports/eligible?courseId=${courseId}`),
}

// ── EVC Management (Admin) ────────────────────────────────────────────────────
export const evcApi = {
  // EVC (top-level)
  getList       : ()           => api.get('/admin/evc'),
  getDetails    : (id)         => api.get(`/admin/evc/${id}`),
  save          : (data)       => api.post('/admin/evc', data),
  activate      : (id)         => api.post(`/admin/evc/${id}/activate`),
  deactivate    : (id)         => api.post(`/admin/evc/${id}/deactivate`),
  // Sub-EVC (child)
  getSubList    : (parentId)   => api.get(`/admin/evc/${parentId}/sub-evc`),
  getMySubList  : ()           => api.get('/admin/evc/my-sub-evc'),
  getSubDetails : (id)         => api.get(`/admin/sub-evc/${id}`),
  saveSub       : (data)       => api.post('/admin/sub-evc', data),
  activateSub   : (id)         => api.post(`/admin/sub-evc/${id}/activate`),
  deactivateSub : (id)         => api.post(`/admin/sub-evc/${id}/deactivate`),
}

export default api