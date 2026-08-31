import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardApi } from '../../services/api'
import ProgressStepper from '../../components/ProgressStepper'

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth()
  const navigate           = useNavigate()
  const [data,    setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getDashboard()
        setData(res.data)
        // isFormLocked comes from dashboard response Table 0 ApplicationFormStatus
        if (updateUser) updateUser({ formLocked: res.data?.isFormLocked ?? false })
      } catch (err) {
        if (err.response?.status === 401) {
          logout()
          navigate('/login')
        } else {
          setError('Failed to load dashboard. Please refresh.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const handleProceed = () => {
    // Map SP nextStepUrl (old .aspx filename) → React route
    const routeMap = {
      'Personal.aspx':                        '/candidate/personal',
      'Address.aspx':                         '/candidate/address',
      'CategoryAndOtherReservation.aspx':     '/candidate/category',
      'Qualification.aspx':                   '/candidate/qualification',
      'SportsDetails.aspx':                   '/candidate/sports',
      'ShortListOptions.aspx':                '/candidate/shortlist',
      'SetPreferences.aspx':                  '/candidate/preferences',
      'UploadPhotoAndSign.aspx':              '/candidate/photo-sign',
      'UploadRequiredDocuments.aspx':         '/candidate/documents',
      'PayApplicationFee.aspx':              '/candidate/fee',
      'ApplicationFee.aspx':                 '/candidate/fee',
      'ApplicationFormSummary.aspx':         '/candidate/summary',
    }

    // Try SP-provided nextStepUrl first
    const nextUrl = data?.progress?.nextStepUrl
    if (nextUrl) {
      const filename = nextUrl.split('/').pop()
      const route    = routeMap[filename]
      if (route) { navigate(route); return }
    }

    // Fallback — derive next page from progress flags in order
    const p = data?.progress
    if (!p) { navigate('/candidate/personal'); return }
    if (!p.personalDetails)      { navigate('/candidate/personal');      return }
    if (!p.addressDetails)       { navigate('/candidate/address');       return }
    if (!p.categoryDetails)      { navigate('/candidate/category');      return }
    if (!p.qualificationDetails) { navigate('/candidate/qualification'); return }
    if (!p.sportsDetails)        { navigate('/candidate/sports');        return }
    if (!p.shortlistOptions)     { navigate('/candidate/shortlist');     return }
    if (!p.setPreferences)       { navigate('/candidate/preferences');   return }
    if (!p.photoAndSign)         { navigate('/candidate/photo-sign');    return }
    if (!p.requiredDocuments)    { navigate('/candidate/documents');     return }
    if (!p.feePayment)           { navigate('/candidate/fee');           return }
    navigate('/candidate/summary')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading dashboard...</p>
          </div>
        </div>
    )
  }

  const completedSteps = data?.progress?.completedSteps ?? 1
  const totalSteps     = data?.progress?.totalSteps ?? 6
  const isLocked       = data?.isFormLocked ?? false

  return (
    <>
    <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* ── Status Banner ─────────────────────────────────────────────── */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-5 py-4 mb-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
              Application Form Status
            </p>
            <p className="text-2xl font-bold text-amber-600 leading-tight">
              {data?.applicationFormStatus ?? 'Loading...'}
              <em className="not-italic font-normal text-sm text-amber-800 ml-2">
                {isLocked
                  ? `— all ${totalSteps} steps completed`
                  : `— step ${completedSteps + 1} of ${totalSteps}`}
              </em>
            </p>
          </div>

          {!isLocked && (
            <button onClick={handleProceed} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <i className="fas fa-arrow-right" />
              Proceed to fill application form
            </button>
          )}
        </div>

        {/* ── Document Verification (only if form locked) ───────────────── */}
        {data?.isFormLocked && data?.documentVerificationStatus && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-0.5">
              Document Verification Status
            </p>
            <p className="text-red-700 font-bold text-sm">{data.documentVerificationStatus}</p>
          </div>
        )}

        {/* ── Rejected Documents (if any) ───────────────────────────────── */}
        {data?.rejectedDocuments?.length > 0 && (
          <div className="card mb-4 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-amber-100 text-amber-800">
                <tr>
                  <th className="px-4 py-2 text-left w-10">#</th>
                  <th className="px-4 py-2 text-left">Document Name</th>
                  <th className="px-4 py-2 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {data.rejectedDocuments.map((doc, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{i + 1}.</td>
                    <td className="px-4 py-2">{doc.document}</td>
                    <td className="px-4 py-2 text-gray-600">{doc.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Application Progress Stepper ──────────────────────────────── */}
        <ProgressStepper progress={data?.progress} />

        {/* ── Bottom Row: Session Details + Important Dates ─────────────── */}
        <div className="flex gap-5 flex-wrap mt-1">

          {/* Session Details */}
          <div className="flex-1 min-w-[340px]">
            <h2 className="text-[15px] font-bold text-gray-700 mb-4 pl-3 border-l-4 border-teal-500">
              Session Details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'User Login ID',       value: user?.userLoginID },
                { label: 'IP Address',          value: 'N/A' },
                { label: 'User Type',           value: 'Candidate' },
                { label: 'Current Login Time',  value: user?.currentLoginDateTime || data?.currentLoginDateTime || new Date().toLocaleString('en-IN') },
                { label: 'User Name',           value: user?.userName },
                { label: 'Previous Login Time', value: (user?.lastLoginDateTime && user.lastLoginDateTime.trim().length > 0)
                    ? user.lastLoginDateTime
                    : (data?.lastLoginDateTime && data.lastLoginDateTime.trim().length > 0
                        ? data.lastLoginDateTime
                        : 'First Login') },
              ].map((item, i) => (
                <div key={i} className="card px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  <p className="text-[15px] font-bold text-gray-800 leading-snug break-all">
                    {item.value ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-gray-900 text-white rounded-xl px-6 py-5 min-w-[270px] max-w-[340px] self-start shadow">
            <h2 className="text-base font-bold mb-4 pb-3 border-b border-gray-700">
              Important Dates
            </h2>
            {[
              { label: 'Application Form Closes', value: '25 July 2026' },
              { label: 'Round 1 Allotment',       value: '02 Aug 2026'  },
              { label: 'Classes Commence',         value: '20 Aug 2026'  },
            ].map((d, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {d.label}
                </p>
                <p className="text-[15px] font-bold text-white">{d.value}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 mt-4">
        © {new Date().getFullYear()} Mahatma Phule Krishi Vidyapeeth, Rahuri
      </footer>
    </>
  )
}
