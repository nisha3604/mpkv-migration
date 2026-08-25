import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { normalizedEventValue } from '../../utils/formInput'

/**
 * Qualification Details — exact UI match to Qualification.aspx
 *
 * Layout (same card style as Personal, Category, Sports):
 *   info-bar → step-bar → form-card
 *     card-header: "Qualification Details"
 *     sub-section: "Eligibility Qualification" (read-only label)
 *     field-grid-4:
 *       Row 1: Highest Qualification* | Is Educational Gap?* (Yes/No radio) | [gap years + reason if Yes]
 *       Row 2: Seat No* | No of Attempts* | Passing District* | Passing Year*
 *       Row 3: Board* | Marks Obtained* | Marks Out Of* | Percentage (auto-computed, read-only)
 *     form-footer: note | ← Back  Save & Next →
 *
 * Logic (mirrors Qualification.aspx exactly):
 *   IsEducationalGap = Yes → show EducationalGapYears + EducationalGapReason
 *   IsEducationalGap = No  → hide + clear gap fields (mirrors rbnlstIsEducationalGap_SelectedIndexChanged)
 *   Percentage = (MarksObtained / MarksOutOf) × 100 — computed live on change
 *   On save success → navigate to /candidate/sports (ApplicationFormSummary in old)
 */
export default function Qualification() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [masters,       setMasters]       = useState({ qualifications:[], passingDistricts:[], passingYears:[], boards:[], educationalGapYears:[], noOfAttempts:[] })
  const [pageLoading,   setPageLoading]   = useState(true)
  const [applicationId, setApplicationId] = useState('')

  // Eligibility qualification — read-only label from DB
  const [eligibilityQualification,   setEligibilityQualification]   = useState('')
  const [eligibilityQualificationID, setEligibilityQualificationID] = useState(0)

  const [form, setForm] = useState({
    highestQualificationID: '',
    isEducationalGap:       '',   // '1'=Yes, '0'=No
    educationalGapYears:    '',
    educationalGapReason:   '',
    seatNo:                 '',
    noOfAttempts:           '',
    passingDistrictID:      '',
    passingYear:            '',
    boardID:                '',
    marksObtained:          '',
    marksOutOf:             '',
  })

  const [percentage,  setPercentage]  = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error,       setError]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  // Educational gap section visibility — mirrors divEducationalGapYears.Visible
  const showGap = form.isEducationalGap === '1'

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setApplicationId(user?.userLoginID ?? '')
    Promise.all([
      applicationFormApi.getQualificationMasters(),
      applicationFormApi.getQualification(),
    ])
      .then(([mRes, dRes]) => {
        setMasters(mRes.data)
        const d = dRes.data
        if (d.found) {
          setEligibilityQualification(d.eligibilityQualification ?? '')
          setEligibilityQualificationID(d.eligibilityQualificationID ?? 0)
          const mo = d.marksObtained ?? 0
          const mof = d.marksOutOf ?? 0
          setForm({
            highestQualificationID: d.highestQualificationID?.toString() ?? '',
            isEducationalGap:       d.isEducationalGap?.toString()       ?? '',
            educationalGapYears:    d.educationalGapYears > 0 ? d.educationalGapYears.toString() : '',
            educationalGapReason:   d.educationalGapReason   ?? '',
            seatNo:                 d.seatNo                 ?? '',
            noOfAttempts:           d.noOfAttempts > 0 ? d.noOfAttempts.toString() : '',
            passingDistrictID:      d.passingDistrictID > 0 ? d.passingDistrictID.toString() : '',
            passingYear:            d.passingYear > 0 ? d.passingYear.toString() : '',
            boardID:                d.boardID > 0 ? d.boardID.toString() : '',
            marksObtained:          mo > 0 ? mo.toString() : '',
            marksOutOf:             mof > 0 ? mof.toString() : '',
          })
          if (mof > 0 && mo > 0) setPercentage(((mo * 100) / mof).toFixed(2))
        }
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    setForm(f => {
      const u = { ...f, [name]: value }
      // Clear gap fields when No selected — mirrors rbnlstIsEducationalGap_SelectedIndexChanged
      if (name === 'isEducationalGap' && value === '0') {
        u.educationalGapYears  = ''
        u.educationalGapReason = ''
      }
      return u
    })
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')

    // Auto-compute percentage on marks change
    if (name === 'marksObtained' || name === 'marksOutOf') {
      const mo  = name === 'marksObtained'  ? parseFloat(value) || 0 : parseFloat(form.marksObtained)  || 0
      const mof = name === 'marksOutOf'     ? parseFloat(value) || 0 : parseFloat(form.marksOutOf)     || 0
      setPercentage(mof > 0 && mo > 0 ? ((mo * 100) / mof).toFixed(2) : '')
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.highestQualificationID) e.highestQualificationID = 'Please Select Highest Qualification.'
    if (!form.isEducationalGap)       e.isEducationalGap       = 'Please Select Educational Gap Status.'
    if (showGap && !form.educationalGapYears)  e.educationalGapYears  = 'Please Select Educational Gap Years.'
    if (showGap && !form.educationalGapReason?.trim()) e.educationalGapReason = 'Please Enter Educational Gap Reason.'
    if (!form.seatNo?.trim())         e.seatNo         = 'Please Enter Seat No.'
    if (!form.noOfAttempts)           e.noOfAttempts   = 'Please Select No of Attempts.'
    if (!form.passingDistrictID)      e.passingDistrictID = 'Please Select Passing District.'
    if (!form.passingYear)            e.passingYear    = 'Please Select Passing Year.'
    if (!form.boardID)                e.boardID        = 'Please Select Board.'
    if (!form.marksObtained || parseFloat(form.marksObtained) <= 0) e.marksObtained = 'Please Enter Marks Obtained.'
    if (!form.marksOutOf    || parseFloat(form.marksOutOf)    <= 0) e.marksOutOf    = 'Please Enter Marks Out Of.'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setSubmitting(true); setError('')
    try {
      await applicationFormApi.saveQualification({
        highestQualificationID:  parseInt(form.highestQualificationID),
        isEducationalGap:        parseInt(form.isEducationalGap),
        educationalGapYears:     showGap ? parseInt(form.educationalGapYears) || 0 : 0,
        educationalGapReason:    showGap ? form.educationalGapReason.trim()   : '',
        eligibilityQualificationID: eligibilityQualificationID,
        seatNo:                  form.seatNo.trim(),
        noOfAttempts:            parseInt(form.noOfAttempts) || 0,
        passingDistrictID:       parseInt(form.passingDistrictID),
        passingYear:             parseInt(form.passingYear),
        boardID:                 parseInt(form.boardID),
        marksObtained:           parseInt(form.marksObtained),
        marksOutOf:              parseInt(form.marksOutOf),
      })
      navigate('/candidate/sports')
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Failed to save.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setSubmitting(false) }
  }

  if (pageLoading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b',fontSize:14 }}>Loading Qualification Details...</p>
      </div>
    </div>
  )

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  const steps = [
    { label:'Application Form', active:true },
    { label:'College Selection & Preference', active:false },
    { label:'Documents Upload', active:false },
    { label:'Fee Payment', active:false },
    { label:'Lock Form', active:false },
  ]

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{applicationId||'—'}</span>
      </div>

      {/* step-bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600, background:s.active?V.primary:V.borderLight, color:s.active?'#fff':V.textSecond, border:`1px solid ${s.active?V.primary:V.border}` }}>
              {s.active&&<i className="fas fa-circle" style={{ fontSize:8 }}/>} {s.label}
            </div>
            {i<arr.length-1&&<span style={{ color:V.textLight, fontSize:12 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 24px' }}>
        {error&&<div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}><i className="fas fa-exclamation-circle"/> {error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* card header */}
            <div style={{ background:V.navy, padding:'16px 24px' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Qualification Details</h3>
            </div>

            {/* Eligibility Qualification — read-only, same as lblEligibilityQualificationHeader */}
            {eligibilityQualification && (
              <div style={{ background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}`, padding:'12px 24px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.04em' }}>Eligibility Qualification :</span>
                <span style={{ fontSize:14, fontWeight:600, color:V.textPrimary }}>{eligibilityQualification}</span>
              </div>
            )}

            <div style={{ padding:24 }}>

              {/* Row 1 — Highest Qualification + Educational Gap */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px 20px', marginBottom:16 }} className="qual-grid">

                <PField label="Highest Qualification" required error={fieldErrors.highestQualificationID}>
                  <select name="highestQualificationID" value={form.highestQualificationID} onChange={handleChange} style={selS(!!fieldErrors.highestQualificationID)}>
                    <option value="">-- Select --</option>
                    {masters.qualifications.map(q=><option key={q.value} value={q.value}>{q.text}</option>)}
                  </select>
                </PField>

                {/* Educational Gap — Yes/No */}
                <div style={{ gridColumn:'span 1' }}>
                  <div style={{ padding:'0' }}>
                    <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:8 }}>
                      Is Educational Gap ? <span style={{ color:V.danger }}>*</span>
                    </label>
                    <div style={{ display:'flex', gap:16 }}>
                      {[{v:'1',l:'YES'},{v:'0',l:'NO'}].map(o=>(
                        <label key={o.v} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:13, fontWeight:600, color:V.textSecond }}>
                          <input type="radio" name="isEducationalGap" value={o.v} checked={form.isEducationalGap===o.v} onChange={handleChange} style={{ accentColor:V.primary, width:14, height:14, cursor:'pointer' }}/>
                          {o.l}
                        </label>
                      ))}
                    </div>
                    {fieldErrors.isEducationalGap&&<p style={{ fontSize:11, color:V.danger, margin:'4px 0 0' }}>{fieldErrors.isEducationalGap}</p>}
                  </div>
                </div>

                {/* Gap Years — only if YES */}
                {showGap ? (
                  <PField label="Educational Gap Years" required error={fieldErrors.educationalGapYears}>
                    <select name="educationalGapYears" value={form.educationalGapYears} onChange={handleChange} style={selS(!!fieldErrors.educationalGapYears)}>
                      <option value="">-- Select --</option>
                      {masters.educationalGapYears.map(y=><option key={y.value} value={y.value}>{y.text}</option>)}
                    </select>
                  </PField>
                ) : <div/>}

                {/* Gap Reason — only if YES */}
                {showGap ? (
                  <PField label="Educational Gap Reason" required error={fieldErrors.educationalGapReason}>
                    <input name="educationalGapReason" type="text" maxLength={200} value={form.educationalGapReason} onChange={handleChange} style={inpS(!!fieldErrors.educationalGapReason)} placeholder="Reason for educational gap"/>
                  </PField>
                ) : <div/>}

              </div>

              {/* Row 2 — Seat No, No of Attempts, Passing District, Passing Year */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px 20px', marginBottom:16 }} className="qual-grid">

                <PField label="Seat No" required error={fieldErrors.seatNo}>
                  <input name="seatNo" type="text" maxLength={20} value={form.seatNo} onChange={handleChange} style={inpS(!!fieldErrors.seatNo)} placeholder="Seat Number"/>
                </PField>

                <PField label="No of Attempts" required error={fieldErrors.noOfAttempts}>
                  <select name="noOfAttempts" value={form.noOfAttempts} onChange={handleChange} style={selS(!!fieldErrors.noOfAttempts)}>
                    <option value="">-- Select --</option>
                    {masters.noOfAttempts.map(n=><option key={n.value} value={n.value}>{n.text}</option>)}
                  </select>
                </PField>

                <PField label="Passing District" required error={fieldErrors.passingDistrictID}>
                  <select name="passingDistrictID" value={form.passingDistrictID} onChange={handleChange} style={selS(!!fieldErrors.passingDistrictID)}>
                    <option value="">-- Select --</option>
                    {masters.passingDistricts.map(d=><option key={d.value} value={d.value}>{d.text}</option>)}
                  </select>
                </PField>

                <PField label="Passing Year" required error={fieldErrors.passingYear}>
                  <select name="passingYear" value={form.passingYear} onChange={handleChange} style={selS(!!fieldErrors.passingYear)}>
                    <option value="">-- Select --</option>
                    {masters.passingYears.map(y=><option key={y.value} value={y.value}>{y.text}</option>)}
                  </select>
                </PField>

              </div>

              {/* Row 3 — Board, Marks Obtained, Marks Out Of, Percentage */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px 20px' }} className="qual-grid">

                <PField label="Board" required error={fieldErrors.boardID}>
                  <select name="boardID" value={form.boardID} onChange={handleChange} style={selS(!!fieldErrors.boardID)}>
                    <option value="">-- Select --</option>
                    {masters.boards.map(b=><option key={b.value} value={b.value}>{b.text}</option>)}
                  </select>
                </PField>

                <PField label="Marks Obtained" required error={fieldErrors.marksObtained}>
                  <input name="marksObtained" type="number" min={0} value={form.marksObtained} onChange={handleChange} style={inpS(!!fieldErrors.marksObtained)} placeholder="Marks Obtained"/>
                </PField>

                <PField label="Marks Out Of" required error={fieldErrors.marksOutOf}>
                  <input name="marksOutOf" type="number" min={0} value={form.marksOutOf} onChange={handleChange} style={inpS(!!fieldErrors.marksOutOf)} placeholder="Total Marks"/>
                </PField>

                {/* Percentage — read-only, auto-computed like old txtPercentage */}
                <PField label="Percentage (%)">
                  <input type="text" readOnly value={percentage ? `${percentage} %` : ''} placeholder="Auto-calculated" style={{ ...inpS(false), background:'#f1f5f9', color:'#475569', cursor:'not-allowed' }}/>
                </PField>

              </div>

            </div>

            {/* footer */}
            <div style={{ position:'relative', display:'flex', alignItems:'center', padding:'16px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', flexWrap:'wrap', gap:12 }}>
              <div style={{ fontSize:12, color:V.textSecond, flex:1 }}><span style={{ color:V.danger }}>*</span> Fields marked are mandatory</div>
              <div style={{ display:'flex', gap:10, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
                <button type="button" onClick={()=>navigate('/candidate/category')}
                  style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'10px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ← Back
                </button>
                <button type="submit" disabled={submitting}
                  style={{ background:submitting?'#86efac':V.primary, color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background=V.primaryDark }}
                  onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background=V.primary }}>
                  {submitting?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<>Save &amp; Next →</>}
                </button>
              </div>
              <div style={{ flex:1 }}/>
            </div>

          </div>
        </form>
      </div>

      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      <style>{`
        @media(max-width:768px){.qual-grid{grid-template-columns:1fr!important;}}
        @media(max-width:1024px) and (min-width:769px){.qual-grid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
    </div>
  )
}

function PField({ label, required, error, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#64748b', marginBottom:6 }}>
        {label} {required&&<span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {children}
      {error&&<p style={{ fontSize:11, color:'#ef4444', margin:'3px 0 0', display:'flex', alignItems:'center', gap:3 }}><i className="fas fa-exclamation-circle" style={{ fontSize:10 }}/> {error}</p>}
    </div>
  )
}

function inpS(err) {
  return { width:'100%', padding:'9px 12px', border:`1.5px solid ${err?'#f87171':'#e2e8f0'}`, borderRadius:8, fontSize:13.5, color:'#0f172a', background:'#fff', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }
}
function selS(err) { return { ...inpS(err), cursor:'pointer' } }
