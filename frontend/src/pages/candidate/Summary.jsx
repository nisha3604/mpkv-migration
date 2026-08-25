import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// Resolve photo/sign URL — strips legacy ViewFile.aspx wrapper
function resolveUrl(url) {
  if (!url) return ''
  let current = url
  while (current.includes('ViewFile.aspx') && current.includes('FileURL=')) {
    const match = current.match(/FileURL=([^&\s]+)/)
    if (!match?.[1]) break
    const extracted = decodeURIComponent(match[1])
    if (extracted === current) break
    current = extracted
  }
  return current
}

export default function Summary() {
  const navigate    = useNavigate()
  const { user, updateUser } = useAuth()

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [confirmed,  setConfirmed]  = useState(false)   // declaration checkbox
  const [locking,    setLocking]    = useState(false)
  const [showConfirm,setShowConfirm]= useState(false)   // confirm modal

  useEffect(() => {
    applicationFormApi.getSummary()
      .then(res => {
        const d = res.data
        // If form is already locked → go to ApplicationForm page, update navbar
        if (d.status?.formStatus?.toLowerCase() === 'locked') {
          if (updateUser) updateUser({ formLocked: true })
          navigate('/candidate/application-form', { replace: true })
          return
        }
        // If any step incomplete → redirect there
        if (d.redirectTo) { navigate(d.redirectTo, { replace: true }); return }
        setData(d)
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load summary.'))
      .finally(() => setLoading(false))
  }, [])

  // Lock form — mirrors CloseConfirmBoxYes → LockApplicationForm → Response.Redirect
  const handleLock = async () => {
    setLocking(true); setShowConfirm(false); setError('')
    try {
      const res = await applicationFormApi.lockForm()
      if (res.data.success) {
        if (updateUser) updateUser({ formLocked: true })
        navigate('/candidate/application-form')
      }
      else setError(res.data.message || 'Failed to lock form.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to lock form.')
    } finally { setLocking(false) }
  }

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    primaryDark: '#047857',
    teal:        '#0d9488',
    tealLight:   '#f0fdfb',
    tealBorder:  '#ccfbf1',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    textLight:   '#94a3b8',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
  }

  const steps = [
    { label:'Application Form',               done:true,  active:false },
    { label:'College Selection & Preference', done:true,  active:false },
    { label:'Documents Upload',               done:true,  active:false },
    { label:'Fee Payment',                    done:true,  active:false },
    { label:'Lock Form',                      done:false, active:true  },
  ]

  // ── helpers ───────────────────────────────────────────────────────────────
  // Label/value info row
  const InfoRow = ({ label, value, fullWidth }) => (
    <div style={{
      display:'grid',
      gridTemplateColumns: fullWidth ? '220px 1fr' : '200px 1fr',
      background:'#fff',
      borderTop:`1px solid ${V.border}`
    }}>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>
        {label}
      </div>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}
        dangerouslySetInnerHTML={{ __html: value || '—' }}/>
    </div>
  )

  // YES / NO badge
  const Badge = ({ val }) => {
    const yes = val?.toUpperCase() === 'YES'
    return (
      <span style={{
        display:'inline-block', fontSize:11, fontWeight:700,
        padding:'2px 10px', borderRadius:20,
        background: yes ? '#dcfce7' : '#f1f5f9',
        color:      yes ? '#166534' : '#64748b',
        border:     `1px solid ${yes ? '#bbf7d0' : '#e2e8f0'}`
      }}>{val || '—'}</span>
    )
  }

  // Bool row for category questions
  const BoolRow = ({ question, value, even }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${V.borderLight}`, background: even ? '#fafbfc' : '#fff', fontSize:13 }}>
      <span style={{ color:V.textPrimary, flex:1, paddingRight:12 }}>{question}</span>
      <Badge val={value}/>
    </div>
  )

  // Section sub-header
  const SecHeader = ({ title, icon }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
      <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
      {icon && <i className={icon} style={{ color:V.teal, fontSize:13 }}/>}
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:V.textSecond, fontSize:14 }}>Loading Application Summary...</p>
      </div>
    </div>
  )

  const p   = data?.personal     ?? {}
  const a   = data?.address      ?? {}
  const cat = data?.category     ?? {}
  const q   = data?.qualification ?? {}
  const spt = data?.sports        ?? {}
  const ps  = data?.photoSign     ?? {}
  const st  = data?.status        ?? {}

  // Build address strings same as old project
  const buildAddr = (line1, line2, state, dist, city, pin) =>
    [line1, line2].filter(Boolean).join(', ')
    + (state  ? `<br/>State: ${state}`   : '')
    + (dist   ? `, District: ${dist}`    : '')
    + (city   ? `, City/Town: ${city}`   : '')
    + (pin    ? `, PIN: ${pin}`          : '')

  const permAddr = buildAddr(a.addressLine1, a.addressLine2, a.state, a.district, a.city, a.pincode)
  const corrAddr = a.isCorrAddressSameAsPermanent
    ? permAddr
    : buildAddr(a.corrAddressLine1, a.corrAddressLine2, a.corrState, a.corrDistrict, a.corrCity, a.corrPincode)

  // Category-conditional visibility (mirrors old C# visibility logic)
  const catID = cat.categoryID ?? 0
  const showCaste    = catID >= 2
  const showNCL      = catID > 3 && catID < 11
  const showEWS      = catID === 11
  const showCasteRcp = showCaste && cat.hasCasteCertificate === 'NO' && cat.hasReceiptCasteCertificate === 'YES'
  const showNCLRcp   = showNCL   && cat.hasNCLCertificate   === 'NO' && cat.hasNCLReceipt              === 'YES'

  // Eligibility error (hides declaration + lock button)
  const isEligible    = st.isEligible !== false
  const eligibilityErr = !isEligible ? st.errorMsg : ''

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{p.applicationID || user?.userLoginID || '—'}</span>
        {p.appliedCourse && <>
          <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginLeft:16 }}>Applied Course</span>
          <span style={{ fontSize:14, fontWeight:600, color:V.textPrimary }}>{p.appliedCourse}</span>
        </>}
      </div>

      {/* step bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600,
              background:s.active ? V.primary : s.done ? V.tealLight : V.borderLight,
              color:s.active ? '#fff' : s.done ? V.teal : V.textSecond,
              border:`1px solid ${s.active ? V.primary : s.done ? V.tealBorder : V.border}` }}>
              {s.done && !s.active && <i className="fas fa-check" style={{ fontSize:9 }}/>}
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i < arr.length-1 && <span style={{ color:V.textLight, fontSize:14 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 0' }}>

        {/* global error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* eligibility error */}
        {eligibilityErr && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}
            dangerouslySetInnerHTML={{ __html: `<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>${eligibilityErr}` }}/>
        )}

        {/* ── Main card ─────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* card header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-lock" style={{ marginRight:8 }}/>Lock Application Form
            </h3>
          </div>

          {/* ══ PERSONAL DETAILS ════════════════════════════════════════ */}
          <SecHeader title="Personal Details" icon="fas fa-user"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

              {/* left — info grid */}
              <div style={{ flex:1 }}>
                {/* full-width name row */}
                <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <InfoRow label="Candidate's Full Name" value={p.candidateName} fullWidth/>
                </div>

                {/* 2-column grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  {[
                    ["Father's Full Name",       p.fatherName],
                    ["Mother's Full Name",        p.motherName],
                    ["Date of Birth",             p.dob],
                    ["Gender",                    p.gender],
                    ["Age (as on 01/07/2026)",    p.age],
                    ["Resident of India?",        p.isResidentOfIndia],
                    ["Mobile Number",             p.mobileNo],
                    ["E-Mail ID",                 p.emailID],
                  ].map(([label, value], i) => (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'1fr',
                      borderTop: i >= 2 ? `1px solid ${V.border}` : 'none',
                      borderLeft: i % 2 === 1 ? `1px solid ${V.border}` : 'none'
                    }}>
                      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', background:'#fff' }}>
                        <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                        <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* address rows */}
                <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                  <InfoRow label="Permanent Address"      value={permAddr} fullWidth/>
                  <InfoRow label="Correspondence Address" value={corrAddr} fullWidth/>
                </div>
              </div>

              {/* right — photo & signature */}
              <div style={{ width:120, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                {/* photograph 100×128 */}
                <div style={{ border:`2px solid ${V.border}`, borderRadius:8, overflow:'hidden', background:'#f8fafc', width:100, height:128, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {ps.photoUploadedURL
                    ? <img src={resolveUrl(ps.photoUploadedURL)} alt="Photograph" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                    : <i className="fas fa-user" style={{ fontSize:36, color:V.textLight }}/>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.06em' }}>Photograph</span>

                {/* signature 100×42 */}
                <div style={{ border:`2px solid ${V.border}`, borderRadius:8, overflow:'hidden', background:'#f8fafc', width:100, height:42, display:'flex', alignItems:'center', justifyContent:'center', marginTop:4 }}>
                  {ps.signUploadedURL
                    ? <img src={resolveUrl(ps.signUploadedURL)} alt="Signature" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                    : <i className="fas fa-pen-nib" style={{ fontSize:18, color:V.textLight }}/>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.06em' }}>Signature</span>
              </div>
            </div>
          </div>

          {/* ══ CATEGORY & OTHER RESERVATION ════════════════════════════ */}
          <SecHeader title="Category & Other Reservation Details" icon="fas fa-id-card"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:14 }}>
              {[
                ["Father's Domicile District", cat.domicileDistrict],
                ["Father's Domicile Village",  cat.domicileVillage],
                ["Category",                   cat.category ? `${cat.category} (${cat.caste})` : '—'],
                ["Category for Admission",     cat.finalCategory],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'190px 1fr',
                  background:'#fff',
                  borderTop: i >= 2 ? `1px solid ${V.border}` : 'none',
                  borderLeft: i % 2 === 1 ? `1px solid ${V.border}` : 'none'
                }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color: (label === 'Category for Admission' && cat.categoryID !== cat.finalCategoryID) ? V.danger : V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>

            {/* boolean questions */}
            <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              {showCaste && <BoolRow question="Do You have Caste Certificate?"                                                                  value={cat.hasCasteCertificate}        even={false}/>}
              {showCasteRcp && <BoolRow question="Do You have Caste Certificate Receipt?"                                                       value={cat.hasReceiptCasteCertificate} even={true}/>}
              {showNCL && <BoolRow question="Do You have Non-Creamy Layer Certificate?"                                                         value={cat.hasNCLCertificate}          even={showCaste}/>}
              {showNCLRcp && <BoolRow question="Do You have Non-Creamy Layer Certificate Receipt?"                                              value={cat.hasNCLReceipt}              even={true}/>}
              {showEWS && <BoolRow question="Do You have Economically Weaker Section Certificate?"                                              value={cat.hasEWSCertificate}          even={false}/>}
              {[
                ["Are you an Orphan?",                                                                                                                cat.isOrphan],
                ["Are you a Person with Disability (Divyang)?",                                                                                       cat.isPWD],
                ["Are you an Ex-Serviceman or Son / Daughter of an Ex-Serviceman?",                                                                   cat.isExServiceman],
                ["Are you Son / Daughter of a Freedom Fighter?",                                                                                      cat.isFreedomFighter],
                ["Are you Project Affected?",                                                                                                         cat.isProjectAffected],
                ["Are you Son / Daughter of a Landless Farm Labourer?",                                                                               cat.isLandlessFarmLabourer],
                ["Are you Son / Daughter of a Farmer / Farm Labourer whose only source of income is Agriculture?",                                    cat.isIncomeSourceAgriculture],
                ["Do you hold agricultural land? (Do you wish to avail reservation under Farmer Category [AG Category]?)",                            cat.hasFarm],
                ["Have you participated in NCC / MCC / Scout?",                                                                                       cat.isNCC],
                ["Are you Son / Daughter of an Employee of Mahatma Phule Agriculture University (MPKV)?",                                             cat.isMPKVEmployee],
                ["Have you participated in Sports / Debate / Essay / Cultural events or represented your school?",                                     cat.isSports],
              ].map(([q, v], i) => <BoolRow key={i} question={q} value={v} even={i%2===1}/>)}
            </div>
          </div>

          {/* ══ QUALIFICATION ═══════════════════════════════════════════ */}
          <SecHeader title="Highest Qualification Details" icon="fas fa-graduation-cap"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              {[
                ["Highest Qualification",        q.highestQualification],
                ["Is Any Educational Gap?",       q.isEducationalGap],
                ...(q.isEducationalGap?.toUpperCase()==='YES' ? [
                  ["Educational Gap (In Years)",  q.educationalGapYears],
                  ["Reason of Educational Gap",   q.educationalGapReason],
                ] : []),
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'200px 1fr',
                  background:'#fff',
                  borderTop: i >= 2 ? `1px solid ${V.border}` : 'none',
                  borderLeft: i % 2 === 1 ? `1px solid ${V.border}` : 'none'
                }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ EXAM DETAILS ════════════════════════════════════════════ */}
          <SecHeader title={`${q.eligibilityQualification || ''} Examination Details`} icon="fas fa-file-alt"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:1 }}>
              {[
                ["Roll No. / Seat No.",   q.seatNo],
                ["No. of Attempts",       q.noOfAttempts],
                ["District of Passing",   q.passingDistrict],
                ["Year of Passing",       q.passingYear],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'180px 1fr',
                  background:'#fff',
                  borderTop: i >= 2 ? `1px solid ${V.border}` : 'none',
                  borderLeft: i % 2 === 1 ? `1px solid ${V.border}` : 'none'
                }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              <InfoRow label="Board"  value={q.board} fullWidth/>
              <InfoRow label="Marks"  value={q.marksObtained && q.marksOutOf ? `${q.marksObtained} / ${q.marksOutOf} <span style="color:#059669;font-size:12px;font-weight:600;margin-left:6px;">(${q.percentage}%)</span>` : '—'} fullWidth/>
            </div>
          </div>

          {/* ══ SPORTS DETAILS (conditional) ════════════════════════════ */}
          {spt.candidateID > 0 && (
            <>
              <SecHeader title="Sports Details" icon="fas fa-running"/>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff' }}>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>Do you have any Sports Certificate?</div>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}><Badge val={spt.isSportsCertificate}/></div>
                  </div>
                  {spt.isSportsCertificate?.toUpperCase() === 'YES' && (
                    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff', borderLeft:`1px solid ${V.border}` }}>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>Certificate Type</div>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{spt.certificateType || '—'}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ APPLIED COLLEGE LIST (conditional) ══════════════════════ */}
          {data?.appliedColleges?.length > 0 && (
            <>
              <SecHeader title="Applied College List" icon="fas fa-university"/>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                    <thead>
                      <tr style={{ background:V.navy }}>
                        {['Pref. No.','College Code','College Name','District','Status'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.appliedColleges.map((c, i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1 ? '#fafbfc' : '#fff' }}>
                          <td style={{ padding:'10px 14px', fontSize:13, textAlign:'center', fontWeight:700 }}>{c.preferenceNo}</td>
                          <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{c.collegeCode}</td>
                          <td style={{ padding:'10px 14px', fontSize:13 }}>{c.collegeName}</td>
                          <td style={{ padding:'10px 14px', fontSize:13 }}>{c.district}</td>
                          <td style={{ padding:'10px 14px', fontSize:13 }}>
                            <span style={{ display:'inline-block', background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, border:'1px solid #bbf7d0' }}>{c.courseStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ FEE PAYMENT LIST ════════════════════════════════════════ */}
          <SecHeader title="Online Application Fee Payment List" icon="fas fa-receipt"/>
          <div style={{ padding:'20px 24px' }}>
            {data?.feePayments?.length > 0 ? (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Transaction ID','Fee Amount','Transaction Date','Payment Date','Bank Ref. No.','Purpose'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.feePayments.map((f, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1 ? '#fafbfc' : '#fff' }}>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{i+1}.</td>
                        <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{f.transactionID}</td>
                        <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:V.primary }}>₹ {f.feeAmount}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{f.transactionDate}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{f.paymentDate}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{f.bankReferenceNo}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{f.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize:13, color:V.textSecond, margin:0 }}>No fee payment records found.</p>
            )}
          </div>

          {/* ══ REQUIRED DOCUMENTS ══════════════════════════════════════ */}
          <SecHeader title="Required Document List" icon="fas fa-folder-open"/>
          <div style={{ padding:'20px 24px' }}>
            {data?.documents?.length > 0 ? (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Document Name','Compulsory','Uploaded','View'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign: h==='View' ? 'center' : 'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.documents.map((doc, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1 ? '#fafbfc' : '#fff' }}>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{i+1}.</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{doc.documentName}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}><Badge val={doc.isDocumentCompulsory === '1' || doc.isDocumentCompulsory?.toUpperCase() === 'YES' ? 'YES' : 'NO'}/></td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}><Badge val={doc.isDocumentUploaded?.toUpperCase() === 'YES' || doc.documentUploadedURL?.length > 0 ? 'YES' : 'NO'}/></td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          {doc.documentUploadedURL?.length > 0 && (
                            <a href={resolveUrl(doc.documentUploadedURL)} target="_blank" rel="noopener noreferrer"
                              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, border:`1.5px solid ${V.border}`, borderRadius:6, background:'#f8fafc', color:V.teal, fontSize:12, textDecoration:'none' }}
                              title="View Document">
                              <i className="fas fa-search"/>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize:13, color:V.textSecond, margin:0 }}>No documents found.</p>
            )}
          </div>

          {/* ══ DECLARATION (hidden if not eligible) ════════════════════ */}
          {isEligible && (
            <>
              <SecHeader title="Declaration / Undertaking by the Candidate" icon="fas fa-pen-fancy"/>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ background:'#fff', border:`1.5px solid ${V.border}`, borderRadius:10, padding:'20px 24px', fontSize:13, color:V.textPrimary, lineHeight:1.8, display:'flex', gap:14, alignItems:'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    style={{ marginTop:4, flexShrink:0, width:16, height:16, cursor:'pointer', accentColor:V.primary }}
                  />
                  <span>
                    I hereby declare that all the information given by me in this application is true and correct to
                    the best of my knowledge and belief and nothing has been concealed. I also undertake that if any
                    of the above statements or information are found to be incorrect or false or any information or
                    particulars have been suppressed or omitted therefrom, I am liable to be disqualified and my
                    candidature/admission may be cancelled without any notice. I have read and understood the contents
                    of the Information Brochure. I acknowledge that filling of this form does not guarantee admission.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ══ FOOTER ══════════════════════════════════════════════════ */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', gap:12 }}>
            {isEligible && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={!confirmed || locking}
                title={!confirmed ? 'Please read and accept the declaration above' : ''}
                style={{
                  background: (!confirmed || locking) ? '#94a3b8' : V.primary,
                  color:'#fff', border:'none',
                  padding:'13px 36px', borderRadius:8,
                  fontSize:14, fontWeight:700,
                  cursor: (!confirmed || locking) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  fontFamily:'inherit',
                  boxShadow: (!confirmed || locking) ? 'none' : '0 0 18px rgba(5,150,105,0.35)'
                }}
                onMouseEnter={e => { if(confirmed && !locking) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(confirmed && !locking) e.currentTarget.style.background=V.primary }}>
                {locking
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Locking...</>
                  : <><i className="fas fa-lock"/> Submit &amp; Lock Application Form</>}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* scroll-to-top */}
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      {/* ── Lock Confirmation Modal (mirrors ConfirmBox / mpeConfirmBox) ─ */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:460, overflow:'hidden', fontFamily:'inherit' }}>
            {/* modal header */}
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="fas fa-lock" style={{ color:'#fca5a5', fontSize:14 }}/>
                </div>
                <span style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Submit &amp; Lock Application Form</span>
              </div>
              <button onClick={() => setShowConfirm(false)}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
            </div>
            {/* modal body */}
            <div style={{ padding:'24px 24px 8px', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#fef2f2', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ color:'#dc3545', fontSize:22 }}/>
              </div>
              <p style={{ fontSize:15, fontWeight:600, color:V.textPrimary, margin:'0 0 10px' }}>Are you sure you want to submit &amp; lock?</p>
              <p style={{ fontSize:13, color:V.textSecond, margin:0, lineHeight:1.7 }}>
                You will <strong>not be able to modify</strong> your application once you submit and lock it.<br/>
                Are you sure you want to submit &amp; lock your Application Form?
              </p>
            </div>
            {/* modal footer */}
            <div style={{ padding:'16px 24px 24px', display:'flex', gap:12 }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex:1, padding:'10px 0', background:'#fff', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                Cancel
              </button>
              <button onClick={handleLock}
                style={{ flex:1, padding:'10px 0', background:'#dc3545', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background='#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background='#dc3545'}>
                <i className="fas fa-lock" style={{ fontSize:13 }}/> Yes, Submit &amp; Lock
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.sum-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
