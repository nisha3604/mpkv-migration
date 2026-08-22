import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { accountApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'

/**
 * ResetPassword — single page that handles all 3 reset methods:
 *
 *   method=1 → ResetPasswordBySecurityQuestion.aspx
 *              Fields: LoginID + SecurityQuestion (dropdown) + Answer → get resetToken → show new-password form
 *
 *   method=2 → ResetPasswordByOTPEMailID.aspx
 *              Fields: LoginID + EmailID → send OTP → enter OTP → get resetToken → show new-password form
 *
 *   method=3 → ResetPasswordByOTPMobileNo.aspx
 *              Fields: LoginID + MobileNo → send OTP → enter OTP → get resetToken → show new-password form
 *
 * Final step (all methods) → ResetPassword.aspx
 *   Fields: New Password + Confirm Password → POST reset-password → success alert → redirect to login
 *
 * Routing:
 *   /reset-password?method=1|2|3   — comes from ForgotPassword.jsx
 *   /reset-password?token=XXX      — direct link (e.g. from email link in old project)
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const method     = searchParams.get('method') ?? '1'
  const tokenParam = searchParams.get('token')  ?? ''

  // ── Step tracking ─────────────────────────────────────────────────────────
  // step: 'verify' | 'otp' | 'password' | 'done'
  const [step, setStep] = useState(tokenParam ? 'password' : 'verify')

  // ── Masters ───────────────────────────────────────────────────────────────
  const [securityQuestions, setSecurityQuestions] = useState([])

  useEffect(() => {
    if (method === '1') {
      accountApi.getMasters()
        .then(res => setSecurityQuestions(res.data.securityQuestions ?? []))
        .catch(console.error)
    }
  }, [method])

  // ── Form state — step 1 (verify) ──────────────────────────────────────────
  const [verifyForm, setVerifyForm] = useState({
    userLoginID:            '',
    securityQuestionID:     '',
    securityQuestionAnswer: '',
    mobileNo:               '',
    emailID:                '',
  })

  // ── Form state — step 2 (OTP) ─────────────────────────────────────────────
  const [otp, setOtp] = useState('')

  // ── Form state — step 3 (new password) ───────────────────────────────────
  const [pwdForm, setPwdForm]       = useState({ newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd]       = useState(false)
  const [showCPwd, setShowCPwd]     = useState(false)

  // ── Shared state ──────────────────────────────────────────────────────────
  const [resetToken,  setResetToken]  = useState(tokenParam)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [otpSent,     setOtpSent]     = useState(false)
  const [otpMsg,      setOtpMsg]      = useState('')

  const clearErrors = () => { setFieldErrors({}); setError('') }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 1 — Verify identity
  // ════════════════════════════════════════════════════════════════════════

  const validateVerify = () => {
    const errs = {}
    if (!verifyForm.userLoginID.trim())
      errs.userLoginID = 'Please enter your Login ID / Application Number.'

    if (method === '1') {
      if (!verifyForm.securityQuestionID)
        errs.securityQuestionID = 'Please select a security question.'
      if (!verifyForm.securityQuestionAnswer.trim())
        errs.securityQuestionAnswer = 'Please enter your answer.'
    }
    if (method === '2') {
      if (!verifyForm.emailID.trim())
        errs.emailID = 'Please enter your registered E-Mail ID.'
    }
    if (method === '3') {
      if (!verifyForm.mobileNo.trim())
        errs.mobileNo = 'Please enter your registered Mobile Number.'
      else if (!/^\d{10}$/.test(verifyForm.mobileNo.trim()))
        errs.mobileNo = 'Enter a valid 10-digit Mobile Number.'
    }
    return errs
  }

  const handleVerifySubmit = async e => {
    e.preventDefault()
    const errs = validateVerify()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    clearErrors()
    try {
      if (method === '1') {
        // Security Question path
        const res = await accountApi.resetBySecurityQuestion({
          userLoginID:            verifyForm.userLoginID.trim().toUpperCase(),
          securityQuestionID:     parseInt(verifyForm.securityQuestionID),
          securityQuestionAnswer: verifyForm.securityQuestionAnswer.trim(),
        })
        setResetToken(res.data.resetToken)
        setStep('password')

      } else if (method === '2') {
        // OTP Email path
        const res = await accountApi.sendOtpEmail({
          userLoginID: verifyForm.userLoginID.trim().toUpperCase(),
          emailID:     verifyForm.emailID.trim().toLowerCase(),
        })
        setOtpMsg(res.data.message)
        setOtpSent(true)
        setStep('otp')

      } else if (method === '3') {
        // OTP Mobile path
        const res = await accountApi.sendOtpMobile({
          userLoginID: verifyForm.userLoginID.trim().toUpperCase(),
          mobileNo:    verifyForm.mobileNo.trim(),
        })
        setOtpMsg(res.data.message)
        setOtpSent(true)
        setStep('otp')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Verification failed. Please check your details.'
      setError(typeof msg === 'string' ? msg : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2 — Verify OTP
  // ════════════════════════════════════════════════════════════════════════
  const handleOtpSubmit = async e => {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length !== 4) {
      setFieldErrors({ otp: 'Please enter the 4-digit OTP.' })
      return
    }
    setLoading(true)
    clearErrors()
    try {
      const res = await accountApi.verifyOtp({
        userLoginID: verifyForm.userLoginID.trim().toUpperCase(),
        otp:         otp.trim(),
        channel:     method === '2' ? 'Email' : 'Mobile',
        contact:     method === '2' ? verifyForm.emailID.trim() : verifyForm.mobileNo.trim(),
      })
      setResetToken(res.data.resetToken)
      setStep('password')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Invalid or expired OTP.'
      setError(typeof msg === 'string' ? msg : 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    clearErrors()
    try {
      let res
      if (method === '2') {
        res = await accountApi.sendOtpEmail({
          userLoginID: verifyForm.userLoginID.trim().toUpperCase(),
          emailID:     verifyForm.emailID.trim().toLowerCase(),
        })
      } else {
        res = await accountApi.sendOtpMobile({
          userLoginID: verifyForm.userLoginID.trim().toUpperCase(),
          mobileNo:    verifyForm.mobileNo.trim(),
        })
      }
      setOtpMsg(res.data.message + ' (Resent)')
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 — Set new password
  // Mirrors: ResetPassword.aspx btnChangePassword_Click
  // ════════════════════════════════════════════════════════════════════════
  const handlePasswordSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!pwdForm.newPassword)
      errs.newPassword = 'Please enter a new password.'
    else if (pwdForm.newPassword.length < 6)
      errs.newPassword = 'Password must be at least 6 characters.'
    if (!pwdForm.confirmPassword)
      errs.confirmPassword = 'Please confirm your new password.'
    else if (pwdForm.newPassword !== pwdForm.confirmPassword)
      errs.confirmPassword = 'New Password and Confirm New Password should be same.'

    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    clearErrors()
    try {
      await accountApi.resetPassword({
        resetToken:      resetToken,
        newPassword:     pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword,
      })
      setStep('done')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to reset password. Please try again.'
      setError(typeof msg === 'string' ? msg : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ── Method label for display ──────────────────────────────────────────────
  const methodLabel = method === '1' ? 'Security Question'
                    : method === '2' ? 'OTP via E-Mail'
                    : 'OTP via Mobile'

  const methodIcon  = method === '1' ? 'fa-shield-alt'
                    : method === '2' ? 'fa-envelope'
                    : 'fa-mobile-alt'

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <PublicLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto">

          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className={`fas ${methodIcon} text-white text-2xl`} />
              </div>
              <h1 className="text-white text-xl font-bold">
                {step === 'done' ? 'Password Reset' : 'Reset Password'}
              </h1>
              <p className="text-emerald-100 text-sm mt-1">{methodLabel}</p>
            </div>

            {/* Step indicator */}
            {step !== 'done' && (
              <div className="flex items-center justify-center gap-2 px-6 pt-4">
                {[
                  { key: 'verify',   label: 'Verify' },
                  ...(method !== '1' ? [{ key: 'otp', label: 'OTP' }] : []),
                  { key: 'password', label: 'New Password' },
                ].map((s, i, arr) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      step === s.key
                        ? 'bg-emerald-600 text-white'
                        : (arr.findIndex(a => a.key === step) > i
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-gray-200 text-gray-500'),
                    ].join(' ')}>{i + 1}</div>
                    <span className={`text-xs ${step === s.key ? 'font-semibold text-emerald-700' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                    {i < arr.length - 1 && <div className="w-6 h-px bg-gray-300" />}
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-5 space-y-4">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── STEP: verify ─────────────────────────────────────────── */}
              {step === 'verify' && (
                <form onSubmit={handleVerifySubmit} noValidate className="space-y-4">

                  <Field label="Login ID / Application Number" required error={fieldErrors.userLoginID}>
                    <input
                      type="text"
                      placeholder="Enter your 10-digit Application Number"
                      value={verifyForm.userLoginID}
                      onChange={e => { setVerifyForm(f => ({ ...f, userLoginID: e.target.value })); clearErrors() }}
                      className={iCls(fieldErrors.userLoginID)}
                    />
                  </Field>

                  {/* Method 1 — Security Question */}
                  {method === '1' && <>
                    <Field label="Security Question" required error={fieldErrors.securityQuestionID}>
                      <select
                        value={verifyForm.securityQuestionID}
                        onChange={e => { setVerifyForm(f => ({ ...f, securityQuestionID: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.securityQuestionID)}
                      >
                        <option value="">-- Select a question --</option>
                        {securityQuestions.map(q => (
                          <option key={q.value} value={q.value}>{q.text}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Your Answer" required error={fieldErrors.securityQuestionAnswer}>
                      <input
                        type="text"
                        placeholder="Enter your answer"
                        value={verifyForm.securityQuestionAnswer}
                        onChange={e => { setVerifyForm(f => ({ ...f, securityQuestionAnswer: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.securityQuestionAnswer)}
                      />
                    </Field>
                  </>}

                  {/* Method 2 — Email OTP */}
                  {method === '2' && (
                    <Field label="Registered E-Mail ID" required error={fieldErrors.emailID}>
                      <input
                        type="email"
                        placeholder="Enter your registered email address"
                        value={verifyForm.emailID}
                        onChange={e => { setVerifyForm(f => ({ ...f, emailID: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.emailID)}
                      />
                    </Field>
                  )}

                  {/* Method 3 — Mobile OTP */}
                  {method === '3' && (
                    <Field label="Registered Mobile Number" required error={fieldErrors.mobileNo}>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter your 10-digit mobile number"
                        value={verifyForm.mobileNo}
                        onChange={e => { setVerifyForm(f => ({ ...f, mobileNo: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.mobileNo)}
                      />
                    </Field>
                  )}

                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading
                      ? <><Spinner /> Verifying...</>
                      : method === '1'
                        ? <><i className="fas fa-check" /> Verify &amp; Proceed</>
                        : <><i className="fas fa-paper-plane" /> Send OTP</>
                    }
                  </button>
                </form>
              )}

              {/* ── STEP: OTP ────────────────────────────────────────────── */}
              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">

                  {/* OTP sent message */}
                  {otpMsg && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
                      <i className="fas fa-info-circle mt-0.5" />
                      <span>{otpMsg}</span>
                    </div>
                  )}

                  <Field label="Enter OTP (4 digits)" required error={fieldErrors.otp}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clearErrors() }}
                      className={iCls(fieldErrors.otp) + ' text-center text-2xl font-bold tracking-[0.5em]'}
                    />
                  </Field>

                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading ? <><Spinner /> Verifying...</> : <><i className="fas fa-check" /> Verify OTP</>}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-emerald-600 hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP: new password ───────────────────────────────────── */}
              {step === 'password' && (
                <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">

                  <Field label="New Password" required error={fieldErrors.newPassword}>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={pwdForm.newPassword}
                        onChange={e => { setPwdForm(f => ({ ...f, newPassword: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.newPassword) + ' pr-10'}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm New Password" required error={fieldErrors.confirmPassword}>
                    <div className="relative">
                      <input
                        type={showCPwd ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={pwdForm.confirmPassword}
                        onChange={e => { setPwdForm(f => ({ ...f, confirmPassword: e.target.value })); clearErrors() }}
                        className={iCls(fieldErrors.confirmPassword) + ' pr-10'}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowCPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`fas ${showCPwd ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                      </button>
                    </div>
                  </Field>

                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading
                      ? <><Spinner /> Changing Password...</>
                      : <><i className="fas fa-key" /> Change Password</>
                    }
                  </button>
                </form>
              )}

              {/* ── STEP: done ───────────────────────────────────────────── */}
              {step === 'done' && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-check-circle text-emerald-600 text-3xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Password Changed Successfully!</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Your password has been reset. You can now log in with your new password.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700
                               text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                  >
                    <i className="fas fa-sign-in-alt" /> Log In Now
                  </Link>
                </div>
              )}

            </div>

            {step !== 'done' && (
              <div className="px-6 pb-5 flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                <Link to="/forgot-password"  className="text-emerald-600 hover:underline">← Back</Link>
                <Link to="/login"            className="text-emerald-600 hover:underline">Log In →</Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[12px] text-red-600 flex items-center gap-1">
          <i className="fas fa-exclamation-circle" /> {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
}

const btnCls = `w-full flex items-center justify-center gap-2
  bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
  text-white font-semibold py-2.5 rounded-lg text-sm transition-colors`

function iCls(err) {
  return [
    'w-full px-3 py-2.5 rounded-lg text-sm border-[1.5px] bg-emerald-50 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition',
    err ? 'border-red-400 bg-red-50' : 'border-emerald-100 focus:border-emerald-500',
  ].join(' ')
}
