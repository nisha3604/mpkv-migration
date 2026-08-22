import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registrationApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'

/**
 * Registration page — mirrors NewRegistration.aspx exactly.
 *
 * Fields:
 *   AppliedCourse (radio), CandidateName, FatherName, MotherName,
 *   Gender (dropdown), DOB, MobileNo, EMailID,
 *   SecurityQuestion (dropdown), SecurityQuestionAnswer,
 *   Password, ConfirmPassword
 *
 * Logic:
 *   - Check registration open on load; redirect home if closed
 *   - Show Mali note when course = ID 3 (same as old rbnlstApplyFor_SelectedIndexChanged)
 *   - Confirm dialog before submit (course cannot be changed after registration)
 *   - Duplicate mobile / email checked on backend
 *   - On success → navigate to /register/info?loginId=XXXXXXXXXX
 */
export default function Registration() {
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────────────────────────────
  const [statusLoading, setStatusLoading] = useState(true)
  const [isOpen,        setIsOpen]        = useState(false)
  const [masters,       setMasters]       = useState({ courses: [], genders: [], securityQuestions: [] })
  const [mastersLoading,setMastersLoading]= useState(true)

  const [form, setForm] = useState({
    appliedCourseID:        '',
    candidateName:          '',
    fatherName:             '',
    motherName:             '',
    genderCode:             '',
    dob:                    '',
    mobileNo:               '',
    emailID:                '',
    securityQuestionID:     '',
    securityQuestionAnswer: '',
    password:               '',
    confirmPassword:        '',
  })

  const [showMaliNote,  setShowMaliNote]  = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [confirmText,   setConfirmText]   = useState('')
  const [error,         setError]         = useState('')
  const [fieldErrors,   setFieldErrors]   = useState({})
  const [submitting,    setSubmitting]    = useState(false)
  const [showPwd,       setShowPwd]       = useState(false)
  const [showConfirmPwd,setShowConfirmPwd]= useState(false)

  // ── Load registration status ───────────────────────────────────────────────
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
  }, [])

  // ── Load masters after status confirmed open ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    registrationApi.getMasters()
      .then(res => setMasters(res.data))
      .catch(console.error)
      .finally(() => setMastersLoading(false))
  }, [isOpen])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')

    // Show Mali note when course 3 selected — same as old server-side event
    if (name === 'appliedCourseID') {
      setShowMaliNote(value === '3')
    }
  }

  // Client-side validation — mirrors old ASP.NET validators
  const validate = () => {
    const errs = {}
    if (!form.appliedCourseID)          errs.appliedCourseID        = 'Please select a course.'
    if (!form.candidateName.trim())     errs.candidateName          = 'Candidate name is required.'
    if (!form.fatherName.trim())        errs.fatherName             = "Father's name is required."
    if (!form.motherName.trim())        errs.motherName             = "Mother's name is required."
    if (!form.genderCode)               errs.genderCode             = 'Please select gender.'
    if (!form.dob)                      errs.dob                    = 'Date of birth is required.'
    if (!form.mobileNo.trim())          errs.mobileNo               = 'Mobile number is required.'
    else if (!/^\d{10}$/.test(form.mobileNo.trim()))
                                        errs.mobileNo               = 'Enter a valid 10-digit mobile number.'
    if (!form.emailID.trim())           errs.emailID                = 'Email ID is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailID.trim()))
                                        errs.emailID                = 'Enter a valid email address.'
    if (!form.securityQuestionID)       errs.securityQuestionID     = 'Please select a security question.'
    if (!form.securityQuestionAnswer.trim())
                                        errs.securityQuestionAnswer = 'Security question answer is required.'
    if (!form.password)                 errs.password               = 'Password is required.'
    else if (form.password.length < 6)  errs.password               = 'Password must be at least 6 characters.'
    if (!form.confirmPassword)          errs.confirmPassword        = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword)
                                        errs.confirmPassword        = 'Passwords do not match.'
    return errs
  }

  // Show confirm dialog before submit — same as old mpeConfirmBox
  const handleRegisterClick = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    // Build confirm message — same text as old code
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

  // Confirmed — submit to backend
  const handleConfirmYes = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    setError('')
    try {
      // Format DOB as dd/MM/yyyy for backend
      const dobFormatted = formatDOB(form.dob)

      const res = await registrationApi.register({
        appliedCourseID:        parseInt(form.appliedCourseID),
        candidateName:          form.candidateName.trim(),
        fatherName:             form.fatherName.trim(),
        motherName:             form.motherName.trim(),
        genderCode:             form.genderCode,
        dob:                    dobFormatted,
        mobileNo:               form.mobileNo.trim(),
        emailID:                form.emailID.trim().toLowerCase(),
        securityQuestionID:     parseInt(form.securityQuestionID),
        securityQuestionAnswer: form.securityQuestionAnswer.trim(),
        password:               form.password,
      })

      const { loginID } = res.data
      navigate(`/register/info?loginId=${encodeURIComponent(loginID)}`)
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data
        ?? 'Registration failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  // HTML date input gives yyyy-MM-dd → convert to dd/MM/yyyy for backend
  const formatDOB = (isoDate) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    return `${d}/${m}/${y}`
  }

  // ── Render loading / closed states ────────────────────────────────────────
  if (statusLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <PublicLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-user-plus text-emerald-600" />
            New Candidate Registration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in all the details below to register. All fields marked <span className="text-red-500">*</span> are mandatory.
          </p>
        </div>

        {/* Global error */}
        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterClick} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Apply For — radio list, same as old rbnlstApplyFor */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-graduation-cap text-emerald-600" />
                  Apply For <span className="text-red-500 ml-0.5">*</span>
                </h2>
                {mastersLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-5 bg-gray-100 rounded w-48 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {masters.courses.map(course => (
                      <label key={course.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="appliedCourseID"
                          value={course.value}
                          checked={form.appliedCourseID === course.value}
                          onChange={handleChange}
                          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-800 group-hover:text-emerald-700 font-medium">
                          {course.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {fieldErrors.appliedCourseID && <FieldError msg={fieldErrors.appliedCourseID} />}

                {/* Mali note — same as old divMaliNote */}
                {showMaliNote && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                    <i className="fas fa-info-circle mr-1.5" />
                    <strong>Note:</strong> माळी अभ्यासक्रम हा <strong>1 वर्षाचा प्रमाणपत्र अभ्यासक्रम</strong> आहे. पदविका अभ्यासक्रम नाही.
                  </div>
                )}
              </div>

              {/* Personal Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-user text-emerald-600" />
                  Personal Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="sm:col-span-2">
                    <FormField
                      label="Candidate Full Name" required
                      error={fieldErrors.candidateName}
                    >
                      <input
                        name="candidateName"
                        type="text"
                        placeholder="As per SSC / Leaving Certificate"
                        value={form.candidateName}
                        onChange={handleChange}
                        className={inputCls(fieldErrors.candidateName)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Father's Name" required error={fieldErrors.fatherName}>
                    <input
                      name="fatherName"
                      type="text"
                      placeholder="Father's full name"
                      value={form.fatherName}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.fatherName)}
                    />
                  </FormField>

                  <FormField label="Mother's Name" required error={fieldErrors.motherName}>
                    <input
                      name="motherName"
                      type="text"
                      placeholder="Mother's full name"
                      value={form.motherName}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.motherName)}
                    />
                  </FormField>

                  <FormField label="Gender" required error={fieldErrors.genderCode}>
                    <select
                      name="genderCode"
                      value={form.genderCode}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.genderCode)}
                    >
                      <option value="">-- Select --</option>
                      {masters.genders.map(g => (
                        <option key={g.value} value={g.value}>{g.text}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Date of Birth" required error={fieldErrors.dob}>
                    <input
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={inputCls(fieldErrors.dob)}
                    />
                  </FormField>

                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-phone text-emerald-600" />
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <FormField label="Mobile Number" required error={fieldErrors.mobileNo}>
                    <input
                      name="mobileNo"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={form.mobileNo}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.mobileNo)}
                    />
                  </FormField>

                  <FormField label="E-Mail ID" required error={fieldErrors.emailID}>
                    <input
                      name="emailID"
                      type="email"
                      placeholder="example@email.com"
                      value={form.emailID}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.emailID)}
                    />
                  </FormField>

                </div>
              </div>

              {/* Security Question */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-shield-alt text-emerald-600" />
                  Security Question
                </h2>
                <div className="space-y-4">

                  <FormField label="Security Question" required error={fieldErrors.securityQuestionID}>
                    <select
                      name="securityQuestionID"
                      value={form.securityQuestionID}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.securityQuestionID)}
                    >
                      <option value="">-- Select a question --</option>
                      {masters.securityQuestions.map(q => (
                        <option key={q.value} value={q.value}>{q.text}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Your Answer" required error={fieldErrors.securityQuestionAnswer}>
                    <input
                      name="securityQuestionAnswer"
                      type="text"
                      placeholder="Answer (will be saved in UPPERCASE)"
                      value={form.securityQuestionAnswer}
                      onChange={handleChange}
                      className={inputCls(fieldErrors.securityQuestionAnswer)}
                    />
                  </FormField>

                </div>
              </div>

              {/* Password */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-lock text-emerald-600" />
                  Set Password
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <FormField label="Password" required error={fieldErrors.password}>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={handleChange}
                        className={inputCls(fieldErrors.password) + ' pr-10'}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                        className={inputCls(fieldErrors.confirmPassword) + ' pr-10'}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowConfirmPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`fas ${showConfirmPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                      </button>
                    </div>
                  </FormField>

                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || mastersLoading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-8 py-2.5 rounded-lg text-[15px] transition-colors"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</>
                    : <><i className="fas fa-user-plus text-sm" /> Register</>
                  }
                </button>
                <Link to="/login" className="text-sm text-emerald-600 hover:underline">
                  Already registered? Log In →
                </Link>
              </div>

            </div>

            {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Instructions */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-info-circle text-teal-500" /> Instructions
                </h3>
                <ul className="space-y-2.5 text-[13px] text-gray-600">
                  {[
                    'Fill all details exactly as in your SSC / Leaving Certificate.',
                    'Mobile number and Email ID must be unique. They are used for login credentials.',
                    'Once registered, the applied course cannot be changed.',
                    'Note your Login ID (Application Number) carefully after registration.',
                    'Keep your password and security answer safe.',
                    'Password is case-sensitive.',
                  ].map((txt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">›</span>
                      {txt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Helpline */}
              <div className="bg-gray-900 rounded-xl p-5 text-white">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <i className="fas fa-headset text-teal-400" /> Need Help?
                </h3>
                <p className="text-xs text-gray-400 mb-1">Helpline Number</p>
                <p className="font-bold text-base flex items-center gap-2">
                  <i className="fas fa-phone text-teal-400" /> +91-8806612998
                </p>
                <p className="text-xs text-gray-400 mt-3">Working Hours</p>
                <p className="text-sm flex items-center gap-1.5 mt-0.5">
                  <i className="far fa-clock text-teal-400" /> 10:00 AM – 6:00 PM
                </p>
                <p className="text-xs text-gray-500 mt-0.5">(All Days)</p>
              </div>

            </div>
          </div>
        </form>
      </div>

      {/* ── Confirm Dialog — mirrors old mpeConfirmBox ───────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
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

            {/* Body */}
            <div
              className="px-5 py-4 text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: confirmText }}
            />

            {/* Footer */}
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

// ── Small reusable helpers ───────────────────────────────────────────────────

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
    'border-[1.5px] bg-emerald-50 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition',
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-emerald-100 focus:border-emerald-500',
  ].join(' ')
}
