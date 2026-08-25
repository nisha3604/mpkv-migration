import { useState } from 'react'
import { Link } from 'react-router-dom'
import { accountApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'
import { normalizedEventValue } from '../../utils/formInput'

/**
 * ForgotLoginId — mirrors ForgotLoginID.aspx exact flow:
 *
 *   STEP 1 (btnProceed_Click):
 *     Enter CandidateName + MobileNo
 *     → Account_GetUserLoginID verifies record exists
 *     → Base_GetOTP stores OTP in DB
 *     → MSG91 sends OTP SMS to mobile
 *     → Show OTP input modal (mpeMobileOTPVerification)
 *
 *   STEP 2 (MobileVerified):
 *     Enter 4-digit OTP
 *     → Base_SaveOTPVerificationStatus verifies OTP
 *     → Show Login ID in alert box (ucAlertBox)
 */
export default function ForgotLoginId() {
  // step: 'form' | 'otp' | 'done'
  const [step,   setStep]   = useState('form')
  const [otpMsg, setOtpMsg] = useState('')

  const [form, setForm] = useState({ candidateName: '', mobileNo: '' })
  const [otp,  setOtp]  = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [error,       setError]       = useState('')
  const [loginId,     setLoginId]     = useState('')
  const [loading,     setLoading]     = useState(false)

  const clearErrors = () => { setFieldErrors({}); setError('') }

  const handleChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')
  }

  // ── STEP 1 — validate + send OTP ─────────────────────────────────────────
  const validateForm = () => {
    const errs = {}
    if (!form.candidateName.trim()) errs.candidateName = 'Please enter your Candidate Name.'
    if (!form.mobileNo.trim())      errs.mobileNo      = 'Please enter your Mobile Number.'
    else if (!/^\d{10}$/.test(form.mobileNo.trim()))
                                    errs.mobileNo      = 'Enter a valid 10-digit Mobile Number.'
    return errs
  }

  const handleProceed = async e => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    clearErrors()
    try {
      const res = await accountApi.forgotLoginIdSendOtp({
        candidateName: form.candidateName.trim().toUpperCase(),
        mobileNo:      form.mobileNo.trim(),
      })
      setOtpMsg(res.data.message)
      setStep('otp')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'No record found. Please check your details.'
      setError(typeof msg === 'string' ? msg : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 2 — verify OTP → get Login ID ───────────────────────────────────
  const handleVerifyOtp = async e => {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length !== 4) {
      setFieldErrors({ otp: 'Please enter the 4-digit OTP.' })
      return
    }
    setLoading(true)
    clearErrors()
    try {
      const res = await accountApi.forgotLoginIdVerifyOtp({
        candidateName: form.candidateName.trim().toUpperCase(),
        mobileNo:      form.mobileNo.trim(),
        otp:           otp.trim(),
      })
      setLoginId(res.data.loginID ?? '')
      setStep('done')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Invalid OTP. Please try again.'
      setError(typeof msg === 'string' ? msg : 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    setLoading(true)
    clearErrors()
    setOtp('')
    try {
      const res = await accountApi.forgotLoginIdSendOtp({
        candidateName: form.candidateName.trim().toUpperCase(),
        mobileNo:      form.mobileNo.trim(),
      })
      setOtpMsg(res.data.message + ' (Resent)')
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-id-badge text-white text-2xl" />
              </div>
              <h1 className="text-white text-xl font-bold">Forgot Login ID</h1>
              <p className="text-emerald-100 text-sm mt-1">
                {step === 'form' && 'Enter your registered name and mobile number'}
                {step === 'otp'  && 'Enter the OTP sent to your mobile'}
                {step === 'done' && 'Your Login ID has been retrieved'}
              </p>
            </div>

            <div className="px-6 py-6 space-y-4">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── STEP 1: Enter name + mobile ──────────────────────────── */}
              {step === 'form' && (
                <form onSubmit={handleProceed} noValidate className="space-y-4">

                  <Field label="Candidate Name" required error={fieldErrors.candidateName}>
                    <input
                      name="candidateName"
                      type="text"
                      placeholder="Enter your full name (as registered)"
                      value={form.candidateName}
                      onChange={handleChange}
                      className={iCls(fieldErrors.candidateName)}
                    />
                  </Field>

                  <Field label="Registered Mobile Number" required error={fieldErrors.mobileNo}>
                    <input
                      name="mobileNo"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit registered mobile number"
                      value={form.mobileNo}
                      onChange={handleChange}
                      className={iCls(fieldErrors.mobileNo)}
                    />
                  </Field>

                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading
                      ? <><Spinner /> Sending OTP...</>
                      : <><i className="fas fa-paper-plane" /> Proceed</>
                    }
                  </button>

                </form>
              )}

              {/* ── STEP 2: Enter OTP ────────────────────────────────────── */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">

                  {/* OTP sent message — same as old "OTP has been sent to Mobile No. XXXXXX1234" */}
                  {otpMsg && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
                      <i className="fas fa-mobile-alt mt-0.5 flex-shrink-0" />
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

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setOtp(''); clearErrors() }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Edit details
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-emerald-600 hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>

                </form>
              )}

              {/* ── STEP 3: Show Login ID — mirrors old ucAlertBox ───────── */}
              {step === 'done' && (
                <div className="text-center">
                  {/* Same as old ucAlertBox.BindAlertBox("Information","Your Login ID : <b>XXXXX</b>") */}
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 mb-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                      <i className="fas fa-info-circle" /> Information
                    </p>
                    <p className="text-sm text-gray-700 mb-2">Your Login ID is:</p>
                    <p className="text-3xl font-extrabold text-emerald-600 tracking-widest">
                      {loginId}
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                      Please note this number. Use it to log in.
                    </p>
                  </div>
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

            {/* Footer links */}
            {step !== 'done' && (
              <div className="px-6 pb-5 flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                <Link to="/login"            className="text-emerald-600 hover:underline">← Back to Login</Link>
                <Link to="/forgot-password"  className="text-emerald-600 hover:underline">Forgot Password?</Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

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
