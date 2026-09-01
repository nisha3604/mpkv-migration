import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'

/**
 * Check Allotment Status — mirrors CheckAllotmentStatus.aspx + .aspx.cs
 *
 * Exact functionality preserved:
 *  1. Page Load:
 *     - GetPhaseList(UserTypeID, Flag) → populate Round dropdown
 *     - Candidate (91): ApplicationID pre-filled from loginID + disabled
 *     - Auto-select current phase via Admission_GetCurrentPhaseID
 *     - Auto-check if both ApplicationID and Phase already set
 *
 *  2. Check Allotment Status button:
 *     - Base_GetCandidateID(ApplicationID) → CandidateID
 *     - Admission_GetCategoryConversionFeeDetails → check category conversion fee
 *     - Admission_GetAllotmentStatus(PhaseID, CandidateID) → full details
 *     - College (61): verify AllottedCollegeCode == userLoginID
 *
 *  3. Shows sections:
 *     - Personal Details (candidate info + photo/signature + points table)
 *     - Current Seat Allotment Status
 *     - Refusal Fee Payment List (if any)
 *     - Download Allotment Letter (with YES/NO questions + conditional sub-questions)
 *
 *  4. "Would you like to take admission?" → YES=show Download button, NO=show Refuse Q (phases 1,5,8 only)
 *  5. "Would you like to refuse?" → YES=show fee + gateway + Pay Refusal Fee button
 *  6. Download Allotment Letter → SaveDownloadAllotmentLetterStatus → open print popup
 *  7. Pay Refusal Fee → Fee_SetFeeTransaction → redirect to gateway
 */
export default function CheckAllotmentStatus() {
  const { user }               = useAuth()
  const isCandidate            = user?.userTypeID === 91
  const isCollege              = user?.userTypeID === 61
  const isAdmin                = user?.userTypeID === 11 || user?.userTypeID === 12

  // ── Form state ────────────────────────────────────────────────────────────
  const [applicationID,  setApplicationID]  = useState(isCandidate ? (user?.userLoginID ?? '') : '')
  const [phaseID,        setPhaseID]        = useState('-1')
  const [phases,         setPhases]         = useState([])
  const [paymentGateways,setPaymentGateways]= useState([{ value:'1', text:'NSDL' }, { value:'2', text:'BillDesk' }])
  const [selectedGW,     setSelectedGW]     = useState('1')

  // ── Data state ────────────────────────────────────────────────────────────
  const [allotment,   setAllotment]   = useState(null)  // AllotmentStatusDto
  const [loading,     setLoading]     = useState(false)
  const [phasesLoaded,setPhasesLoaded]= useState(false)
  const [error,       setError]       = useState('')
  const [infoMsg,     setInfoMsg]     = useState('')

  // ── Download section state (mirrors divDownloadAllotmentLetter logic) ─────
  const [showDownloadSection,   setShowDownloadSection]   = useState(false)
  const [wishToTakeAdmission,   setWishToTakeAdmission]   = useState('')   // '1'=YES '0'=NO
  const [admissionRadioEnabled, setAdmissionRadioEnabled] = useState(true)
  const [showRefuseQ,           setShowRefuseQ]           = useState(false)
  const [wishToRefuse,          setWishToRefuse]          = useState('')   // '1'=YES '0'=NO
  const [showRefusalFee,        setShowRefusalFee]        = useState(false)
  const [showPaymentGateway,    setShowPaymentGateway]    = useState(false)
  const [showPayBtn,            setShowPayBtn]            = useState(false)
  const [showDownloadBtn,       setShowDownloadBtn]       = useState(false)

  // ── Action state ──────────────────────────────────────────────────────────
  const [checking,    setChecking]    = useState(false)
  const [paying,      setPaying]      = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // ── Load phases on mount ──────────────────────────────────────────────────
  useEffect(() => {
    admissionApi.getPhases()
      .then(res => {
        if (res.data.phases?.length > 0) {
          setPhases(res.data.phases)
          setPhasesLoaded(true)
          // Auto-select current phase
          const curId = res.data.currentPhaseID?.toString() ?? ''
          const exists = res.data.phases.find(p => p.value === curId)
          if (exists) setPhaseID(curId)
          else setPhaseID(res.data.phases[0]?.value ?? '-1')
        } else {
          setInfoMsg(res.data.message || 'Allotment is Not Published for Any Phase.')
        }
      })
      .catch(() => setInfoMsg('Failed to load rounds. Please refresh.'))
  }, [])

  // ── Auto-check when candidate (91) + phase loaded ─────────────────────────
  useEffect(() => {
    if (isCandidate && phasesLoaded && applicationID.length > 0 && phaseID !== '-1') {
      handleCheck()
    }
  }, [phasesLoaded])

  // ── Validate form ─────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!applicationID.trim()) e.applicationID = 'Please Enter Application ID.'
    if (phaseID === '-1' || !phaseID) e.phaseID = 'Please Select Round.'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Check Allotment Status (mirrors btnCheckAllotment_Click + CheckAllotment()) ─
  const handleCheck = async () => {
    if (!validate()) return
    setChecking(true)
    setError(''); setInfoMsg('')
    // Reset all sections
    setAllotment(null)
    resetDownloadSection()

    try {
      const res = await admissionApi.checkAllotment({
        applicationID: applicationID.trim().toUpperCase(),
        phaseID      : parseInt(phaseID),
      })
      if (res.data.success) {
        const data = res.data.data
        setAllotment(data)

        // Determine if download section should show
        // For college/admin: always show when allotment is found
        // For candidate: mirrors old project phase-based logic
        const pid = parseInt(phaseID)
        const showDownload = (isCollege || isAdmin)
          ? true
          : (([1,5,8].includes(pid) && data.refusalRemainingFee > 0) ||
             [2,3,4,6,7,9,10,11,12].includes(pid))

        if (showDownload) {
          if (isCandidate) {
            if (data.isAllotmentLetterDownloaded) {
              setWishToTakeAdmission('1')
              setAdmissionRadioEnabled(false)
              setShowDownloadSection(true)
              setShowDownloadBtn(true)
            } else if (data.isEligibleToDownloadAllotmentLetter) {
              setShowDownloadSection(true)
            }
          } else if (isCollege || isAdmin) {
            setShowDownloadSection(true)
            if (data.isAllotmentLetterDownloaded) {
              setWishToTakeAdmission('1')
              setAdmissionRadioEnabled(false)
              setShowDownloadBtn(true)
            }
          }
        }
      } else {
        setError(res.data.message || 'No allotment found.')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'An error occurred. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  // ── Reset download section state ─────────────────────────────────────────
  const resetDownloadSection = () => {
    setShowDownloadSection(false)
    setWishToTakeAdmission('')
    setAdmissionRadioEnabled(true)
    setShowRefuseQ(false)
    setWishToRefuse('')
    setShowRefusalFee(false)
    setShowPaymentGateway(false)
    setShowPayBtn(false)
    setShowDownloadBtn(false)
  }

  // ── "Would you like to take admission?" change
  //    mirrors: rbnlstIsWishToTakeAdmissionInAllottedCollege_SelectedIndexChanged ─
  const handleWishToTakeAdmission = (val) => {
    setWishToTakeAdmission(val)
    setShowRefuseQ(false)
    setShowRefusalFee(false)
    setShowPaymentGateway(false)
    setShowPayBtn(false)
    setShowDownloadBtn(false)
    setWishToRefuse('')

    if (val === '1') {
      setShowDownloadBtn(true)
    } else {
      // Show refuse Q only for phases 1, 5, 8
      const pid = parseInt(phaseID)
      if ([1, 5, 8].includes(pid)) {
        setShowRefuseQ(true)
      }
    }
  }

  // ── "Would you like to refuse?" change
  //    mirrors: rbnlstIsWishToRefuseAllottedCollege_SelectedIndexChanged ─────
  const handleWishToRefuse = (val) => {
    setWishToRefuse(val)
    setShowRefusalFee(false)
    setShowPaymentGateway(false)
    setShowPayBtn(false)
    setShowDownloadBtn(false)

    if (val === '1') {
      setShowRefusalFee(true)
      setShowPaymentGateway(true)
      setShowPayBtn(true)
    }
  }

  // ── Pay Refusal Fee (mirrors btnPayRefusalFee_Click) ──────────────────────
  const handlePayRefusalFee = async () => {
    if (!selectedGW) { setFieldErrors(p => ({...p, gateway:'Please Select Payment Gateway.'})); return }
    if (!allotment) return
    setPaying(true); setError('')
    try {
      const res = await admissionApi.payRefusalFee({
        candidateID     : allotment.candidateID,
        phaseID         : allotment.phaseID,
        paymentGatewayID: parseInt(selectedGW),
      })
      if (res.data.success && res.data.paymentGatewayURL) {
        window.location.href = res.data.paymentGatewayURL
      } else {
        setError(res.data.message || 'Some error has occurred. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Some error has occurred. Please try again.')
    } finally { setPaying(false) }
  }

  // ── Download Allotment Letter (mirrors btnDownloadAllotmentLetter_Click) ──
  const handleDownloadLetter = async () => {
    if (!allotment) return
    setDownloading(true); setError('')
    try {
      const res = await admissionApi.downloadLetter({
        candidateID: allotment.candidateID,
        collegeID  : allotment.collegeID,
        phaseID    : allotment.phaseID,
      })
      if (res.data.success && res.data.printUrl) {
        // Open print popup — mirrors: window.open("AllotmentLetterPrint.aspx?P1=...&P2=...&R1=...")
        window.open(
          `http://localhost:7002${res.data.printUrl}`,
          'AllotmentLetter',
          'width=1000,height=600,resizable=yes,scrollbars=yes'
        )
      } else {
        setError(res.data.message || 'Failed to prepare allotment letter.')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'An error occurred.')
    } finally { setDownloading(false) }
  }

  // ── Design tokens ─────────────────────────────────────────────────────────
  const V = {
    navy    : '#14212e',
    primary : '#059669',
    teal    : '#0d9488',
    danger  : '#dc2626',
    border  : '#e2e8f0',
    borderLt: '#f1f5f9',
    bg      : '#f5f6fa',
    tealLt  : '#f0fdf4',
    textSec : '#64748b',
  }

  const inp = (err) => ({
    width: '100%', padding: '10px 14px', border: `1.5px solid ${err ? '#fca5a5' : V.border}`,
    borderRadius: 8, fontSize: 13.5, background: err ? '#fef2f2' : '#fff',
    boxSizing: 'border-box', fontFamily: 'inherit',
    outline: 'none',
  })

  // ── Section header (matches .cas-sec-header style) ─────────────────────────
  const SecHeader = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: V.tealLt, borderBottom: `1px solid ${V.border}` }}>
      <span style={{ width: 3, height: 14, background: V.primary, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
    </div>
  )

  // ── Info row (matches .info-row style) ─────────────────────────────────────
  const InfoRow = ({ label, value, danger }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', borderBottom: `1px solid ${V.borderLt}`, background: '#fff' }}>
      <div style={{ padding: '10px 14px', fontSize: 13, color: V.textSec, fontWeight: 500, background: '#f8fafc', borderRight: `1px solid ${V.border}` }}>{label}</div>
      <div style={{ padding: '10px 14px', fontSize: 13, color: danger ? V.danger : '#0f172a', fontWeight: 700 }}>{value || '—'}</div>
    </div>
  )

  return (
    <>
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        {/* Info message */}
        {infoMsg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-info-circle" /> {infoMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── SEARCH CARD — mirrors divCheckAllotmentStatus ─────────────── */}
        {phases.length > 0 && (
          <div className="card mb-5 overflow-hidden shadow-sm">
            <div style={{ background: `linear-gradient(135deg, ${V.navy}, #0d3d2e)` }} className="px-5 py-3.5 flex items-center gap-3">
              <i className="fas fa-search text-emerald-400 text-sm" />
              <h3 className="text-white font-bold text-base m-0">Check Allotment Status</h3>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-5">

                {/* Application ID */}
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                    Application ID <span className="text-red-500">*</span>
                  </label>
                  {/* Candidate: pre-filled + disabled (mirrors txtApplicationID.Enabled=false) */}
                  <input
                    value={applicationID}
                    onChange={e => { setApplicationID(e.target.value.toUpperCase()); setFieldErrors(p => ({...p, applicationID:''})) }}
                    disabled={isCandidate}
                    maxLength={15}
                    placeholder="Enter Application ID"
                    style={inp(!!fieldErrors.applicationID)}
                    className={isCandidate ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                  />
                  {fieldErrors.applicationID && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.applicationID}</p>}
                </div>

                {/* Round dropdown */}
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                    Round <span className="text-red-500">*</span>
                  </label>
                  <select value={phaseID} onChange={e => { setPhaseID(e.target.value); setFieldErrors(p => ({...p, phaseID:''})) }}
                    style={{ ...inp(!!fieldErrors.phaseID) }}>
                    <option value="-1">-- Select Round --</option>
                    {phases.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}
                  </select>
                  {fieldErrors.phaseID && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.phaseID}</p>}
                </div>
              </div>
            </div>

            {/* Check button */}
            <div className="flex justify-center px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={handleCheck} disabled={checking}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-9 py-3 rounded-lg text-sm shadow-md transition-colors">
                {checking
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking...</>
                  : <><i className="fas fa-play" /> Check Allotment Status</>}
              </button>
            </div>
          </div>
        )}

        {/* ── ALLOTMENT DETAILS — mirrors divAllotmentStatus ──────────── */}
        {allotment && (
          <>

            {/* ── Personal Details section ──────────────────────────── */}
            <div className="card mb-4 overflow-hidden shadow-sm">
              <SecHeader title="Personal Details" />
              <div className="px-5 py-4 flex gap-5 items-start">

                {/* Left: info grid + points table */}
                <div style={{ flex: 1 }}>
                  {/* Applied Course + Application ID — full width */}
                  <div style={{ border: `1px solid ${V.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <InfoRow label="Applied Course"  value={allotment.appliedCourse} />
                    <InfoRow label="Application ID"  value={allotment.applicationID} />
                  </div>

                  {/* 2-column info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: V.border, border: `1px solid ${V.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                    <InfoRow label="Candidate's Name"         value={allotment.candidateName}     />
                    <InfoRow label="Gender"                    value={allotment.gender}             />
                    <InfoRow label="Date of Birth"             value={allotment.dob}                />
                    <InfoRow label="Father's Domicile District"value={allotment.domicileDistrict}   />
                    <InfoRow label="Category"                  value={allotment.category}           />
                  </div>

                  {/* Points table — mirrors 5-row pts-table */}
                  <div style={{ border: `1px solid ${V.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: V.navy }}>
                          <th style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left', width: '5%' }}>Sr.</th>
                          <th style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left' }}>Description</th>
                          <th style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left', width: '10%' }}>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { sr: '1.', desc: 'Academic Marks Standard',                                                                                                                                                                                              val: allotment.academicWeightage     },
                          { sr: '2.', desc: '7/12 of agricultural land given by Talathi / Patwari in the year 2020-2021 or 2021-2022 / Khasra in the name of candidate or in the name of his / her parents or his / her grandparents',                              val: allotment.weightage712           },
                          { sr: '3.', desc: 'NCC / MCC / Scout Guide Certificate (Certificate of Taluka / District Commandant / Headmaster) (Class 8th to 10th)',                                                                                                   val: allotment.nccWeightage           },
                          { sr: '4.', desc: 'Participation in Taluka / District Level Sports / Cultural Proficiency / Debate / Drama etc. (Class 8th to 10th)',                                                                                                    val: allotment.sportWeightage         },
                          { sr: '5.', desc: 'Son / Daughter of Current / Ex. Employee of State Agricultural University',                                                                                                                                            val: allotment.mpkvEmployeeWeightage  },
                        ].map((row, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${V.borderLt}` }}>
                            <td style={{ padding: '10px 14px' }}>{row.sr}</td>
                            <td style={{ padding: '10px 14px' }}>{row.desc}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>{row.val || '0'}</td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr style={{ background: '#f0fdf9', fontWeight: 700 }}>
                          <td colSpan={2} style={{ padding: '10px 20px', textAlign: 'right', fontSize: 13 }}>Total Points</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: V.teal, fontSize: 14 }}>{allotment.totalWeightage || '0'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Photo + Signature */}
                <div style={{ width: 120, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ border: `2px solid ${V.border}`, borderRadius: 8, overflow: 'hidden', background: '#f8fafc' }}>
                    {allotment.photoURL
                      ? <img src={allotment.photoURL.startsWith('http') ? allotment.photoURL : `http://localhost:7002${allotment.photoURL}`}
                          width={100} height={128} alt="Photograph" style={{ display: 'block', objectFit: 'cover' }} />
                      : <div style={{ width: 100, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                          <i className="fas fa-user" style={{ fontSize: 40, color: '#cbd5e1' }} />
                        </div>
                    }
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: V.textSec, textTransform: 'uppercase', letterSpacing: '.06em' }}>Photograph</span>

                  <div style={{ border: `2px solid ${V.border}`, borderRadius: 8, overflow: 'hidden', background: '#f8fafc', marginTop: 6 }}>
                    {allotment.signURL
                      ? <img src={allotment.signURL.startsWith('http') ? allotment.signURL : `http://localhost:7002${allotment.signURL}`}
                          width={100} height={42} alt="Signature" style={{ display: 'block', objectFit: 'contain' }} />
                      : <div style={{ width: 100, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                          <i className="fas fa-signature" style={{ fontSize: 20, color: '#cbd5e1' }} />
                        </div>
                    }
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: V.textSec, textTransform: 'uppercase', letterSpacing: '.06em' }}>Signature</span>
                </div>
              </div>
            </div>

            {/* ── Current Seat Allotment Status ─────────────────────── */}
            <div className="card mb-4 overflow-hidden shadow-sm">
              <SecHeader title={`Current Seat Allotment Status (${allotment.allotmentPhase})`} />
              <div className="px-5 py-4">
                <div style={{ border: `1px solid ${V.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <InfoRow label="Name of the School"                   value={allotment.allottedCollege}  />
                  <InfoRow label="Name of the Course"                   value={allotment.allottedCourse}   />
                  <InfoRow label="Allotted Category / Special Category" value={allotment.allottedCategory} />
                  <InfoRow label="Allotted Gender Quota"                value={allotment.allottedType}     />
                  <InfoRow label="Admission Schedule"                   value={allotment.admissionSchedule} danger />
                </div>
              </div>
            </div>

            {/* ── Refusal Fee Payment List — mirrors divRefusalFeePaymentList ─ */}
            {allotment.refusalFeePayments?.length > 0 && (
              <div className="card mb-4 overflow-hidden shadow-sm">
                <SecHeader title="Refusal Fee Payment List" />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: V.navy }}>
                        {['Sr. No.','Transaction ID','Fee Amount','Transaction Date','Payment Date','Bank Reference No.','Purpose'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allotment.refusalFeePayments.map((r, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${V.borderLt}` }}>
                          <td style={{ padding: '10px 14px' }}>{i+1}.</td>
                          <td style={{ padding: '10px 14px' }}>{r.transactionID}</td>
                          <td style={{ padding: '10px 14px' }}>₹ {r.feeAmount}</td>
                          <td style={{ padding: '10px 14px' }}>{r.transactionDate}</td>
                          <td style={{ padding: '10px 14px' }}>{r.paymentDate}</td>
                          <td style={{ padding: '10px 14px' }}>{r.bankReferenceNo}</td>
                          <td style={{ padding: '10px 14px' }}>{r.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Download Allotment Letter section — mirrors divDownloadAllotmentLetter ─ */}
            {showDownloadSection && (
              <div className="card overflow-hidden shadow-sm">
                <SecHeader title="Download Allotment Letter" />
                <div className="px-5 py-4 space-y-3">

                  {/* Q1: Would you like to take admission? (mirrors rbnlstIsWishToTakeAdmissionInAllottedCollege) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1.5px solid ${V.border}`, borderRadius: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, paddingRight: 16 }}>
                      Would you like to take admission in this allotted college?
                    </span>
                    <div className="flex items-center gap-6">
                      {['1','0'].map(val => (
                        <label key={val} className={`flex items-center gap-2 text-sm font-semibold ${!admissionRadioEnabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
                          <input type="radio" name="wishAdmission" value={val}
                            checked={wishToTakeAdmission === val}
                            onChange={() => admissionRadioEnabled && handleWishToTakeAdmission(val)}
                            disabled={!admissionRadioEnabled}
                            className="accent-emerald-600" />
                          {val === '1' ? 'YES' : 'NO'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Would you like to refuse? (mirrors rbnlstIsWishToRefuseAllottedCollege — shown only for phases 1,5,8) */}
                  {showRefuseQ && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1.5px solid ${V.border}`, borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, paddingRight: 16 }}>
                        Would you like to refuse this allotted college?
                      </span>
                      <div className="flex items-center gap-6">
                        {['1','0'].map(val => (
                          <label key={val} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                            <input type="radio" name="wishRefuse" value={val}
                              checked={wishToRefuse === val}
                              onChange={() => handleWishToRefuse(val)}
                              className="accent-emerald-600" />
                            {val === '1' ? 'YES' : 'NO'}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refusal fee amount (mirrors divRefusalFeeToPay) */}
                  {showRefusalFee && (
                    <div className="flex items-center gap-4 py-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: V.textSec }}>
                        Fee to be Paid for Refusal of Allotted Seat (₹)
                      </span>
                      <div style={{ background: V.navy, color: '#fff', fontSize: 16, fontWeight: 800, padding: '8px 20px', borderRadius: 8 }}>
                        ₹ {allotment.refusalRemainingFee}/-
                      </div>
                    </div>
                  )}

                  {/* Payment Gateway (mirrors rbnlstPaymentGateway) */}
                  {showPaymentGateway && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: V.textSec, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                        Payment Gateway
                      </div>
                      <div className="flex items-center gap-6">
                        {paymentGateways.map(gw => (
                          <label key={gw.value} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                            <input type="radio" name="gateway" value={gw.value}
                              checked={selectedGW === gw.value}
                              onChange={() => { setSelectedGW(gw.value); setFieldErrors(p => ({...p, gateway:''})) }}
                              className="accent-emerald-600" />
                            {gw.text}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.gateway && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.gateway}</p>}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '18px 22px', borderTop: `1px solid ${V.borderLt}`, background: '#f8fafc', flexWrap: 'wrap' }}>

                  {/* Download Allotment Letter (mirrors btnDownloadAllotmentLetter) */}
                  {showDownloadBtn && (
                    <button onClick={handleDownloadLetter} disabled={downloading}
                      style={{ background: V.primary, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: downloading ? 0.6 : 1, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(5,150,105,.25)' }}>
                      {downloading
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing...</>
                        : <><i className="fas fa-download" /> Download Allotment Letter</>}
                    </button>
                  )}

                  {/* Pay Refusal Fee (mirrors btnPayRefusalFee) */}
                  {showPayBtn && (
                    <button onClick={handlePayRefusalFee} disabled={paying}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: paying ? 0.6 : 1, fontFamily: 'inherit' }}>
                      {paying
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting...</>
                        : <><i className="fas fa-play" /> Pay Refusal Fee</>}
                    </button>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>

    
    </>
  )
}
