import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { registrationApi } from '../../services/api'
import PublicLayout from '../../components/PublicLayout'

/**
 * RegistrationInfo page — mirrors ShowRegistrationInfo.aspx exactly.
 *
 * Reads ?loginId=XXXXXXXXXX from the URL.
 * Fetches candidate name from backend.
 * Shows Application ID + candidate name in a success card.
 * Redirects to home if loginId is missing.
 */
export default function RegistrationInfo() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const loginId         = searchParams.get('loginId') ?? ''

  const [info,    setInfo]    = useState(null)    // { found, loginID, candidateName }
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!loginId) {
      navigate('/')
      return
    }
    registrationApi.getInfo(loginId)
      .then(res => setInfo(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Registration information not found. Please check your Application ID.')
        } else {
          setError('Unable to load registration information. Please try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [loginId])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading registration details...</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-circle text-red-500 text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Link to="/" className="text-emerald-600 hover:underline text-sm">← Back to Home</Link>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <PublicLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-xl mx-auto">

          {/* Success card — mirrors ShowRegistrationInfo.aspx layout */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

            {/* Green success header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-check-circle text-white text-3xl" />
              </div>
              <h1 className="text-white text-xl font-bold">Registration Successful!</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Your application has been registered successfully.
              </p>
            </div>

            {/* Details */}
            <div className="px-6 py-6 space-y-5">

              {/* Application ID — the most important detail */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-center">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2">
                  Your Login ID / Application Number
                </p>
                <p className="text-4xl font-extrabold text-amber-600 tracking-widest">
                  {info?.loginID ?? loginId}
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Please note this number carefully. You will need it to log in.
                </p>
              </div>

              {/* Candidate Name */}
              <div className="bg-gray-50 rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">Candidate Name</p>
                  <p className="text-base font-bold text-gray-800">{info?.candidateName}</p>
                </div>
              </div>

              {/* Important notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-[13px] text-blue-800 font-semibold mb-1 flex items-center gap-1.5">
                  <i className="fas fa-info-circle" /> Important
                </p>
                <ul className="text-[12.5px] text-blue-700 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">›</span>
                    Your Login ID and Password have been sent to your registered Mobile Number and Email ID.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">›</span>
                    Use your Login ID and Password to log in and fill the Application Form.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">›</span>
                    Do not share your Login ID or Password with anyone.
                  </li>
                </ul>
              </div>

            </div>

            {/* Footer actions */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-sign-in-alt" /> Log In Now
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-print" /> Print / Save
              </button>
            </div>

          </div>

          {/* Back link */}
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  )
}
