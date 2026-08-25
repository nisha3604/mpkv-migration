import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrationApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'
import { normalizedEventValue } from '../../utils/formInput'

/** Static course metadata keyed by AppliedCourseID from master table */
const COURSE_META = {
  '1': {
    medium: 'Marathi Medium',
    duration: '2 Yrs.',
    mediumMr: 'मराठी माध्यम',
    durationMr: 'कालावधी 2 वर्ष',
    titleMr: 'कृषी तंत्र पदविका अभ्यासक्रम',
  },
  '2': {
    medium: 'English Medium',
    duration: '3 Yrs.',
    mediumMr: 'इंग्रजी माध्यम',
    durationMr: 'कालावधी 3 वर्ष',
    titleMr: 'कृषी पॉलिटेक्निक अभ्यासक्रम',
  },
  '3': {
    medium: 'Marathi Medium',
    duration: '1 Yr.',
    mediumMr: 'मराठी माध्यम',
    durationMr: 'कालावधी 1 वर्ष',
    titleMr: 'माळी प्रमाणपत्र अभ्यासक्रम',
  },
}

export default function Registration() {
  const navigate = useNavigate()

  const [statusLoading, setStatusLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [masters, setMasters] = useState({ courses: [], genders: [], securityQuestions: [] })
  const [mastersLoading, setMastersLoading] = useState(true)

  const [form, setForm] = useState({
    appliedCourseID: '',
    candidateName: '',
    fatherName: '',
    motherName: '',
    genderCode: '',
    dob: '',
    mobileNo: '',
    emailID: '',
    securityQuestionID: '',
    securityQuestionAnswer: '',
    password: '',
    confirmPassword: '',
  })

  const [showMaliNote, setShowMaliNote] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [courseAnimKey, setCourseAnimKey] = useState(0)
  const [courseExpanded, setCourseExpanded] = useState(true)

  useEffect(() => {
    registrationApi.checkStatus()
      .then(res => {
        if (!res.data.isOpen) {
          navigate('/?msg=Student+Registration+is+Not+Started+%2F+Closed.')
        } else {
          setIsOpen(true)
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setStatusLoading(false))
  }, [navigate])

  useEffect(() => {
    if (!isOpen) return
    registrationApi.getMasters()
      .then(res => setMasters(res.data))
      .catch(console.error)
      .finally(() => setMastersLoading(false))
  }, [isOpen])

  const handleChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')
  }

  const handleCourseSelect = courseId => {
    setForm(f => ({ ...f, appliedCourseID: courseId }))
    setFieldErrors(fe => ({ ...fe, appliedCourseID: '' }))
    setError('')
    setShowMaliNote(courseId === '3')
    setCourseExpanded(true)
    setCourseAnimKey(k => k + 1)
  }

  const validate = () => {
    const errs = {}
    if (!form.appliedCourseID) errs.appliedCourseID = 'Please select a course.'
    if (!form.candidateName.trim()) errs.candidateName = 'Candidate name is required.'
    if (!form.fatherName.trim()) errs.fatherName = "Father's name is required."
    if (!form.motherName.trim()) errs.motherName = "Mother's name is required."
    if (!form.genderCode) errs.genderCode = 'Please select gender.'
    if (!form.dob) errs.dob = 'Date of birth is required.'
    if (!form.mobileNo.trim()) errs.mobileNo = 'Mobile number is required.'
    else if (!/^\d{10}$/.test(form.mobileNo.trim()))
      errs.mobileNo = 'Enter a valid 10-digit mobile number.'
    if (!form.emailID.trim()) errs.emailID = 'Email ID is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailID.trim()))
      errs.emailID = 'Enter a valid email address.'
    if (!form.securityQuestionID) errs.securityQuestionID = 'Please select a security question.'
    if (!form.securityQuestionAnswer.trim())
      errs.securityQuestionAnswer = 'Security question answer is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8 || form.password.length > 15)
      errs.password = 'Password must be 8–15 characters.'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(form.password))
      errs.password = 'Password must include upper, lower, number and special character.'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.'
    return errs
  }

  const handleRegisterClick = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    const courseName = masters.courses.find(c => c.value === form.appliedCourseID)?.text ?? ''
    const maliWarning = form.appliedCourseID === '3'
      ? '<br/><br/><b>माळी अभ्यासक्रम हा 1 वर्षाचा प्रमाणपत्र अभ्यासक्रम आहे. पदविका अभ्यासक्रम नाही.</b>'
      : ''
    setConfirmText(
      `You have registered for <b>${courseName}</b>.${maliWarning}<br/><br/>
       Once Registered, You will not be able to modify / change / alter your applied course.<br/><br/>
       Are you sure, You want to register for this course?`
    )
    setShowConfirm(true)
  }

  const handleConfirmYes = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    setError('')
    try {
      const dobFormatted = formatDOB(form.dob)
      const res = await registrationApi.register({
        appliedCourseID: parseInt(form.appliedCourseID),
        candidateName: form.candidateName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        genderCode: form.genderCode,
        dob: dobFormatted,
        mobileNo: form.mobileNo.trim(),
        emailID: form.emailID.trim().toLowerCase(),
        securityQuestionID: parseInt(form.securityQuestionID),
        securityQuestionAnswer: form.securityQuestionAnswer.trim(),
        password: form.password,
      })
      navigate(`/register/info?loginId=${encodeURIComponent(res.data.loginID)}`)
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data
        ?? 'Registration failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDOB = isoDate => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    return `${d}/${m}/${y}`
  }

  const selectedCourse = masters.courses.find(c => c.value === form.appliedCourseID)

  if (statusLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

        {/* Page heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">
            Create Your Candidate Account
          </h1>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterClick} noValidate className="space-y-5">

          {/* ── Section 01: Apply For ─────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header — clickable to collapse when course selected */}
            <div
              className={[
                'flex items-center justify-between gap-4 p-5 sm:p-6',
                form.appliedCourseID ? 'cursor-pointer select-none hover:bg-gray-50/60 transition-colors' : '',
              ].join(' ')}
              onClick={() => form.appliedCourseID && setCourseExpanded(e => !e)}
              role={form.appliedCourseID ? 'button' : undefined}
              tabIndex={form.appliedCourseID ? 0 : undefined}
              onKeyDown={e => {
                if (form.appliedCourseID && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  setCourseExpanded(v => !v)
                }
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                  01
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900">
                    Apply For <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Choose the course you wish to register for
                  </p>
                </div>
              </div>
              {selectedCourse && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setCourseExpanded(v => !v) }}
                  className="flex items-center gap-2 flex-shrink-0 text-left group"
                  aria-expanded={courseExpanded}
                  aria-label={courseExpanded ? 'Hide course details' : 'Show course details'}
                >
                  <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors hidden sm:inline">
                    {selectedCourse.text}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors sm:hidden max-w-[140px] truncate">
                    {selectedCourse.text}
                  </span>
                  <i className={[
                    'fas text-gray-400 text-xs transition-transform duration-300',
                    courseExpanded ? 'fa-chevron-up' : 'fa-chevron-down',
                  ].join(' ')} />
                </button>
              )}
            </div>

            {/* Body — hidden when collapsed */}
            {( !form.appliedCourseID || courseExpanded ) && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
              {mastersLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !form.appliedCourseID ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {masters.courses.map(course => {
                    const meta = COURSE_META[course.value] ?? {}
                    return (
                      <button
                        key={course.value}
                        type="button"
                        onClick={() => handleCourseSelect(course.value)}
                        className="text-left p-5 rounded-xl border border-gray-200 bg-white
                                   hover:border-emerald-400 hover:shadow-md
                                   transition-all duration-300 ease-out hover:-translate-y-0.5 group"
                      >
                        <p className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                          {course.text}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {meta.medium} · Duration {meta.duration}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {meta.mediumMr} · {meta.durationMr}
                        </p>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div key={courseAnimKey} className="space-y-4 reg-section-enter">
                  {selectedCourse && (() => {
                    const meta = COURSE_META[selectedCourse.value] ?? {}
                    return (
                      <div className="relative p-5 sm:p-6 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 reg-course-card-enter">
                        <span className="absolute top-4 right-4 reg-selected-badge inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                          <i className="fas fa-check text-[10px]" /> Selected
                        </span>
                        <p className="text-lg font-bold text-gray-900 pr-28">
                          {selectedCourse.text}
                        </p>
                        <p className="text-sm text-gray-600 mt-1.5">
                          {meta.medium} · Duration {meta.duration}
                        </p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">
                          {meta.titleMr}
                        </p>
                      </div>
                    )
                  })()}

                  <div className="flex flex-wrap gap-3">
                    {masters.courses
                      .filter(c => c.value !== form.appliedCourseID)
                      .map(course => (
                        <button
                          key={course.value}
                          type="button"
                          onClick={() => handleCourseSelect(course.value)}
                          className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200
                                     bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50
                                     transition-all duration-200"
                        >
                          {course.text}
                        </button>
                      ))}
                  </div>

                  {showMaliNote && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm reg-course-card-enter">
                      <i className="fas fa-info-circle mr-1.5" />
                      <strong>Note:</strong> माळी अभ्यासक्रम हा <strong>1 वर्षाचा प्रमाणपत्र अभ्यासक्रम</strong> आहे. पदविका अभ्यासक्रम नाही.
                    </div>
                  )}
                </div>
              )}
              {fieldErrors.appliedCourseID && <FieldError msg={fieldErrors.appliedCourseID} />}
            </div>
            )}
            {form.appliedCourseID && !courseExpanded && fieldErrors.appliedCourseID && (
              <div className="px-5 sm:px-6 pb-4"><FieldError msg={fieldErrors.appliedCourseID} /></div>
            )}
          </div>

          {/* ── Section 02: Your Details & Password ─────────────────────── */}
          <div
            className={[
              'bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm transition-all duration-500',
              form.appliedCourseID ? 'opacity-100 translate-y-0 reg-section-enter' : 'opacity-40 pointer-events-none',
            ].join(' ')}
          >
            <div className="flex items-start gap-3 mb-5">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                02
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900">Your Details &amp; Password</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Personal info should match your school leaving certificate
                </p>
              </div>
            </div>

            {/* Row 1 — Names */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <FormField label="Candidate's Full Name" required error={fieldErrors.candidateName}>
                <input
                  name="candidateName"
                  type="text"
                  placeholder="AS PER SSC CERTIFICATE"
                  value={form.candidateName}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.candidateName)}
                />
              </FormField>
              <FormField label="Father's Full Name" required error={fieldErrors.fatherName}>
                <input
                  name="fatherName"
                  type="text"
                  placeholder="E.G. RAMESH"
                  value={form.fatherName}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.fatherName)}
                />
              </FormField>
              <FormField label="Mother's Full Name" required error={fieldErrors.motherName}>
                <input
                  name="motherName"
                  type="text"
                  placeholder="E.G. SUNITA"
                  value={form.motherName}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.motherName)}
                />
              </FormField>
            </div>

            {/* Row 2 — Personal & contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
              <FormField label="Gender" required error={fieldErrors.genderCode}>
                <select
                  name="genderCode"
                  value={form.genderCode}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.genderCode)}
                >
                  <option value="">Select</option>
                  {masters.genders.map(g => (
                    <option key={g.value} value={g.value}>{g.text}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Date of Birth (DD/MM/YYYY)" required error={fieldErrors.dob}>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.dob)}
                />
              </FormField>
              <FormField label="Mobile Number" required error={fieldErrors.mobileNo}>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium">
                    +91
                  </span>
                  <input
                    name="mobileNo"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={form.mobileNo}
                    onChange={handleChange}
                    disabled={!form.appliedCourseID}
                    className={inputCls(fieldErrors.mobileNo) + ' rounded-l-none'}
                  />
                </div>
              </FormField>
              <FormField label="E-Mail ID" required error={fieldErrors.emailID}>
                <input
                  name="emailID"
                  type="email"
                  placeholder="you@example.com"
                  value={form.emailID}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.emailID)}
                />
              </FormField>
            </div>

            {/* Row 3 — Security & password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
              <FormField label="Security Question" required error={fieldErrors.securityQuestionID}>
                <select
                  name="securityQuestionID"
                  value={form.securityQuestionID}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.securityQuestionID)}
                >
                  <option value="">Select</option>
                  {masters.securityQuestions.map(q => (
                    <option key={q.value} value={q.value}>{q.text}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Security Question's Answer" required error={fieldErrors.securityQuestionAnswer}>
                <input
                  name="securityQuestionAnswer"
                  type="text"
                  placeholder="YOUR ANSWER"
                  value={form.securityQuestionAnswer}
                  onChange={handleChange}
                  disabled={!form.appliedCourseID}
                  className={inputCls(fieldErrors.securityQuestionAnswer) + ' input-no-uppercase'}
                />
              </FormField>
              <FormField label="Password" required error={fieldErrors.password}>
                <div className="relative">
                  <input
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={!form.appliedCourseID}
                    className={inputCls(fieldErrors.password) + ' pr-10 input-no-uppercase'}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
              </FormField>
              <FormField label="Confirm Password" required error={fieldErrors.confirmPassword}>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={!form.appliedCourseID}
                    className={inputCls(fieldErrors.confirmPassword) + ' pr-10 input-no-uppercase'}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas ${showConfirmPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
              </FormField>
            </div>

            {/* Password note */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-5">
              <i className="fas fa-info-circle mt-0.5 flex-shrink-0 text-amber-500" />
              <p>
                <strong>Note:</strong> Password should have Minimum 8 and Maximum 15 Characters with 1 Upper Case Alphabet, 1 Lower Case Alphabet, 1 Number and 1 Special Character.
              </p>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={submitting || mastersLoading || !form.appliedCourseID}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-lg text-[15px] transition-colors"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>Register →</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-amber-500" />
                New Registration
              </h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded transition-colors"
              >✕</button>
            </div>
            <div
              className="px-5 py-4 text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: confirmText }}
            />
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleConfirmYes}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Yes, Register
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <FieldError msg={error} />}
    </div>
  )
}

function FieldError({ msg }) {
  return (
    <p className="mt-1 text-[12px] text-red-600 flex items-center gap-1">
      <i className="fas fa-exclamation-circle" /> {msg}
    </p>
  )
}

function inputCls(hasError) {
  return [
    'w-full px-3 py-2.5 rounded-lg text-sm text-gray-900',
    'border bg-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition',
    'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-gray-200 focus:border-emerald-500',
  ].join(' ')
}
