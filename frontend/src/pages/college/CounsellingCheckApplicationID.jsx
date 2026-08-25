import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { counsellingApi } from '../../services/api'

/**
 * Counselling CheckApplicationID — mirrors Counselling/CheckApplicationID.aspx.cs
 *
 * Exact functionality preserved:
 *
 * Page Load:
 *  1. Access check: UserTypeID must be 31 or 61 — others → Access Denied
 *  2. College restriction: UserTypeID=61 AND CourseID != 3 →
 *     hide form + "You are Not Authorized to Offer Seat in Spot Round."
 *  3. Load phases: Admission_GetPhaseList(UserTypeID, "Counselling", UserLoginID)
 *  4. Auto-select current phase via Admission_GetCurrentPhaseID
 *  5. OfferSeat flag: ddlPhase.Enabled = false (phase always disabled for OfferSeat)
 *
 * Search button:
 *  OfferSeat:
 *    → Base_GetCandidateID(ApplicationID) → CandidateID
 *    → Counselling_GetEligibilityFlagForCounselling(CandidateID, PhaseID, UserLoginID)
 *    → IsEligible=true  → navigate to /college/spot-round/offer-seat-form
 *    → IsEligible=false → show ErrMsg
 *
 *  CancelOfferedSeat:
 *    → Base_GetCandidateID(ApplicationID) → CandidateID
 *    → Counselling_GetEligibilityFlagForCancelOfferedSeat(CandidateID, PhaseID, DistrictID, UserLoginID)
 *    → IsEligible=true  → navigate to /college/spot-round/cancel-offered-seat-form
 *    → IsEligible=false → show ErrMsg
 */
export default function CounsellingCheckApplicationID() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()

  // Determine flag from route path
  const getFlag = () => {
    if (location.state?.flag) return location.state.flag
    const path = location.pathname
    if (path.includes('offer-seat'))         return 'OfferSeat'
    if (path.includes('cancel-offered'))     return 'CancelOfferedSeat'
    return 'OfferSeat'
  }
  const flag = getFlag()

  // Header label — mirrors switch(Flag) { lblHeader.Text = ... }
  const headerLabel = flag === 'OfferSeat'
    ? 'Offer Seat (Spot Round)'
    : 'Cancel Offered Seat (Spot Round)'

  // Phase dropdown disabled for OfferSeat — mirrors: ddlPhase.Enabled = false
  const phaseDisabled = flag === 'OfferSeat'

  // ── State ─────────────────────────────────────────────────────────────────
  const [phases,        setPhases]        = useState([])
  const [phaseID,       setPhaseID]       = useState('-1')
  const [applicationID, setApplicationID] = useState('')
  const [formVisible,   setFormVisible]   = useState(true)
  const [accessError,   setAccessError]   = useState('')
  const [message,       setMessage]       = useState({ text: '', type: '' })  // type: info|danger|success
  const [searching,     setSearching]     = useState(false)
  const [fieldErrors,   setFieldErrors]   = useState({})
  const [loading,       setLoading]       = useState(true)

  // ── Load phases on mount — mirrors Page_Load ──────────────────────────────
  useEffect(() => {
    counsellingApi.getPhases()
      .then(res => {
        // Access error or college restriction
        if (!res.data.formVisible || res.data.accessError) {
          setFormVisible(false)
          setAccessError(res.data.accessError || 'Access Denied.')
          return
        }
        if (res.data.phases?.length > 0) {
          setPhases(res.data.phases)
          const cur = res.data.currentPhaseID?.toString()
          const exists = res.data.phases.find(p => p.value === cur)
          setPhaseID(exists ? cur : res.data.phases[0]?.value ?? '-1')
        }
      })
      .catch(() => {
        setFormVisible(false)
        setAccessError('Failed to load page. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!applicationID.trim())               e.applicationID = 'Please Enter Application Number.'
    if (phaseID === '-1' || !phaseID)        e.phaseID = 'Please Select Round.'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Search — mirrors btnSearch_Click ──────────────────────────────────────
  const handleSearch = async () => {
    if (!validate()) return
    setSearching(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await counsellingApi.check({
        applicationID: applicationID.trim().toUpperCase(),
        phaseID      : parseInt(phaseID) || 0,
        flag,
      })

      if (res.data.success && res.data.navigateTo) {
        // Eligible → navigate to next page (OfferSeat or CancelOfferedSeat form)
        navigate(res.data.navigateTo)
      } else {
        setMessage({ text: res.data.message || 'An error occurred.', type: 'danger' })
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message ?? 'An error occurred. Please try again.', type: 'danger' })
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch() }

  // ── Design tokens ─────────────────────────────────────────────────────────
  const V = {
    navy   : '#14212e',
    primary: '#059669',
    danger : '#dc2626',
    amber  : '#f59e0b',
    border : '#e2e8f0',
    bg     : '#f5f6fa',
  }

  const inp = (err) => ({
    width: '100%', padding: '9px 14px',
    border: `1.5px solid ${err ? '#fca5a5' : V.border}`,
    borderRadius: 8, fontSize: 13.5,
    background: err ? '#fef2f2' : '#fff',
    boxSizing: 'border-box', fontFamily: 'inherit',
    outline: 'none',
  })

  const msgColors = {
    danger : { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: 'fa-exclamation-circle' },
    info   : { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: 'fa-info-circle'        },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: 'fa-check-circle'        },
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        {/* ── Access error / college restriction — mirrors Helper.ShowMessage() ─ */}
        {accessError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: V.danger, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
            <i className="fas fa-exclamation-circle flex-shrink-0" />
            {accessError}
          </div>
        )}

        {/* ── Main card — visible only when form is accessible ────────────── */}
        {formVisible && (
          <div className="card overflow-hidden shadow-sm">

            {/* Card header — orange gradient matching old Bootstrap card-header */}
            <div style={{ background: `linear-gradient(135deg, ${V.amber} 0%, #d97706 100%)`, padding: '12px 22px' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>
                {headerLabel}
              </h3>
            </div>

            <div className="px-6 py-5">

              {/* Inline message — mirrors Helper.ShowMessage() */}
              {message.text && (() => {
                const c = msgColors[message.type] ?? msgColors.danger
                return (
                  <div style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <i className={`fas ${c.icon} flex-shrink-0`} />
                    {message.text}
                  </div>
                )
              })()}

              {/* ── Form row — mirrors row justify-content-center ─────────── */}
              <div className="flex justify-center gap-5 flex-wrap mb-5">

                {/* Application ID */}
                <div style={{ minWidth: 240, flex: '0 0 240px' }}>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                    Application ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={applicationID}
                    onChange={e => { setApplicationID(e.target.value.toUpperCase()); setFieldErrors(p => ({...p, applicationID:''})) }}
                    onKeyDown={handleKeyDown}
                    maxLength={15}
                    placeholder="Enter Application ID"
                    style={inp(!!fieldErrors.applicationID)}
                  />
                  {fieldErrors.applicationID && (
                    <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle" /> {fieldErrors.applicationID}
                    </p>
                  )}
                </div>

                {/* Round — always shown, disabled for OfferSeat */}
                <div style={{ minWidth: 220, flex: '0 0 220px' }}>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                    Round <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={phaseID}
                    onChange={e => { setPhaseID(e.target.value); setFieldErrors(p => ({...p, phaseID:''})) }}
                    disabled={phaseDisabled}
                    style={{
                      ...inp(!!fieldErrors.phaseID),
                      background: phaseDisabled ? '#f1f5f9' : '#fff',
                      color     : phaseDisabled ? '#94a3b8' : '#0f172a',
                      cursor    : phaseDisabled ? 'not-allowed' : 'default',
                    }}>
                    <option value="-1">Select</option>
                    {phases.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}
                  </select>
                  {fieldErrors.phaseID && (
                    <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle" /> {fieldErrors.phaseID}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card footer — mirrors card-footer with btnSearch */}
            <div style={{ borderTop: `1px solid ${V.border}`, background: '#f8fafc', padding: '14px 22px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleSearch} disabled={searching}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-8 py-2.5 rounded-lg text-sm shadow transition-colors">
                {searching
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
                  : <><i className="fas fa-search" /> Search</>}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
    </>
  )
}
