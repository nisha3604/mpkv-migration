import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * UnlockForm — mirrors ApplicationFormUnlock.aspx exactly.
 *
 * Flow (same as old project):
 *  1. Page load → GET /api/applicationform/unlock/eligibility
 *     → Checks ApplicationForm_GetEligibilityFlagForUnlockForm SP
 *     → If NOT allowed: shows error message, hides form
 *     → If allowed: load full summary via GET /api/applicationform/summary
 *  2. User reads summary, ticks declaration checkbox
 *  3. Click "Unlock Application Form" → shows confirm modal
 *  4. Confirm → POST /api/applicationform/unlock
 *     → On success: updateUser({ formLocked: false }) → navigate('/candidate/summary')
 *     → On failure: show error
 */

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

export default function UnlockForm() {
  const navigate             = useNavigate()
  const { user, updateUser } = useAuth()

  const [eligibility, setEligibility] = useState(null)   // null = loading
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [confirmed,   setConfirmed]   = useState(false)
  const [unlocking,   setUnlocking]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Step 1: check eligibility on mount ───────────────────────────────────
  useEffect(() => {
    applicationFormApi.getUnlockEligibility()
      .then(res => {
        setEligibility(res.data)
        if (res.data.isAllowed) {
          // Load full summary to display
          return applicationFormApi.getSummary()
            .then(s => setData(s.data))
        }
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load page.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Step 4: unlock ────────────────────────────────────────────────────────
  const handleUnlock = async () => {
    setUnlocking(true); setShowConfirm(false); setError('')
    try {
      const res = await applicationFormApi.unlockForm()
      if (res.data.success) {
        // Form is now unlocked — update navbar menu, navigate to summary
        if (updateUser) updateUser({ formLocked: false })
        navigate('/candidate/summary', { replace: true })
      } else {
        setError(res.data.message || 'Failed to unlock form.')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to unlock form.')
    } finally { setUnlocking(false) }
  }

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  // ── Sub-components ────────────────────────────────────────────────────────
  const SecHeader = ({ title, icon }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
      <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
      {icon && <i className={icon} style={{ color:V.teal, fontSize:13 }}/>}
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )

  const Badge = ({ val }) => {
    const yes = val?.toUpperCase() === 'YES'
    return (
      <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20,
        background: yes?'#dcfce7':'#f1f5f9', color: yes?'#166534':'#64748b',
        border:`1px solid ${yes?'#bbf7d0':'#e2e8f0'}` }}>{val || '—'}</span>
    )
  }

  const BoolRow = ({ question, value, even }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${V.borderLight}`, background: even?'#fafbfc':'#fff', fontSize:13 }}>
      <span style={{ color:V.textPrimary, flex:1, paddingRight:12 }}>{question}</span>
      <Badge val={value}/>
    </div>
  )

  const InfoGrid2 = ({ items }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
      {items.map(([label, value], i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'180px 1fr', background:'#fff',
          borderTop: i>=2 ? `1px solid ${V.border}` : 'none',
          borderLeft: i%2===1 ? `1px solid ${V.border}` : 'none' }}>
          <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
          <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
        </div>
      ))}
    </div>
  )

  const InfoFull = ({ label, value }) => (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff', borderTop:`1px solid ${V.border}` }}>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }} dangerouslySetInnerHTML={{ __html: value || '—' }}/>
    </div>
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:V.textSecond, fontSize:14 }}>Checking unlock eligibility...</p>
      </div>
    </div>
  )

  const p   = data?.personal      ?? {}
  const a   = data?.address       ?? {}
  const cat = data?.category      ?? {}
  const q   = data?.qualification ?? {}
  const spt = data?.sports        ?? {}
  const ps  = data?.photoSign     ?? {}

  const buildAddr = (l1, l2, state, dist, city, pin) =>
    [l1, l2].filter(Boolean).join(', ')
    + (state ? `<br/>State: ${state}`   : '')
    + (dist  ? `, District: ${dist}`    : '')
    + (city  ? `, City/Town: ${city}`   : '')
    + (pin   ? `, PIN: ${pin}`          : '')

  const permAddr = buildAddr(a.addressLine1, a.addressLine2, a.state, a.district, a.city, a.pincode)
  const corrAddr = a.isCorrAddressSameAsPermanent
    ? permAddr
    : buildAddr(a.corrAddressLine1, a.corrAddressLine2, a.corrState, a.corrDistrict, a.corrCity, a.corrPincode)

  const catID     = cat.categoryID ?? 0
  const showCaste = catID >= 2
  const showNCL   = catID > 3 && catID < 11
  const showEWS   = catID === 11
  const showCasteRcp = showCaste && cat.hasCasteCertificate === 'NO' && cat.hasReceiptCasteCertificate === 'YES'
  const showNCLRcp   = showNCL   && cat.hasNCLCertificate   === 'NO' && cat.hasNCLReceipt              === 'YES'

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

      <div style={{ padding:'20px 24px 0' }}>

        {/* global error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* NOT ELIGIBLE — show reason only */}
        {eligibility && !eligibility.isAllowed && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12, padding:'24px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#fee2e2', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fas fa-lock" style={{ color:V.danger, fontSize:22 }}/>
            </div>
            <p style={{ fontSize:15, fontWeight:600, color:'#dc2626', margin:'0 0 8px' }}>Unlock Not Allowed</p>
            <p style={{ fontSize:13, color:'#7f1d1d', margin:0 }}>
              {eligibility.reason || 'You are not eligible to unlock the application form at this time.'}
            </p>
          </div>
        )}

        {/* ELIGIBLE — show full summary + unlock button */}
        {eligibility?.isAllowed && data && (
          <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* card header */}
            <div style={{ background:V.navy, padding:'16px 24px' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
                <i className="fas fa-lock-open" style={{ marginRight:8 }}/>Unlock Application Form
              </h3>
            </div>

            {/* ══ PERSONAL ════════════════════════════════════════════ */}
            <SecHeader title="Personal Details" icon="fas fa-user"/>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  {/* full-width name */}
                  <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                    <InfoFull label="Candidate's Full Name" value={p.candidateName}/>
                  </div>
                  {/* 2-col grid */}
                  <InfoGrid2 items={[
                    ["Father's Full Name",     p.fatherName],
                    ["Mother's Full Name",      p.motherName],
                    ["Date of Birth",           p.dob],
                    ["Gender",                  p.gender],
                    ["Age (as on 01/07/2026)",  p.age],
                    ["Resident of India?",      p.isResidentOfIndia],
                    ["Mobile Number",           p.mobileNo],
                    ["E-Mail ID",               p.emailID],
                  ]}/>
                  {/* address */}
                  <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                    <InfoFull label="Permanent Address"      value={permAddr}/>
                    <InfoFull label="Correspondence Address" value={corrAddr}/>
                  </div>
                </div>
                {/* photo + signature */}
                <div style={{ width:120, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ border:`2px solid ${V.border}`, borderRadius:8, overflow:'hidden', background:'#f8fafc', width:100, height:128, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {ps.photoUploadedURL
                      ? <img src={resolveUrl(ps.photoUploadedURL)} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                      : <i className="fas fa-user" style={{ fontSize:36, color:V.textLight }}/>}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.06em' }}>Photograph</span>
                  <div style={{ border:`2px solid ${V.border}`, borderRadius:8, overflow:'hidden', background:'#f8fafc', width:100, height:42, display:'flex', alignItems:'center', justifyContent:'center', marginTop:4 }}>
                    {ps.signUploadedURL
                      ? <img src={resolveUrl(ps.signUploadedURL)} alt="Sign" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                      : <i className="fas fa-pen-nib" style={{ fontSize:18, color:V.textLight }}/>}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.06em' }}>Signature</span>
                </div>
              </div>
            </div>

            {/* ══ CATEGORY ════════════════════════════════════════════ */}
            <SecHeader title="Category & Other Reservation Details" icon="fas fa-id-card"/>
            <div style={{ padding:'20px 24px' }}>
              <InfoGrid2 items={[
                ["Father's Domicile District", cat.domicileDistrict],
                ["Father's Domicile Village",  cat.domicileVillage],
                ["Category",                   cat.category ? `${cat.category} (${cat.caste})` : '—'],
                ["Category for Admission",     cat.finalCategory],
              ]}/>
              <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                {showCaste    && <BoolRow question="Do You have Caste Certificate?"                       value={cat.hasCasteCertificate}        even={false}/>}
                {showCasteRcp && <BoolRow question="Do You have Caste Certificate Receipt?"               value={cat.hasReceiptCasteCertificate} even={true}/>}
                {showNCL      && <BoolRow question="Do You have Non-Creamy Layer Certificate?"            value={cat.hasNCLCertificate}          even={showCaste}/>}
                {showNCLRcp   && <BoolRow question="Do You have Non-Creamy Layer Certificate Receipt?"    value={cat.hasNCLReceipt}              even={true}/>}
                {showEWS      && <BoolRow question="Do You have Economically Weaker Section Certificate?" value={cat.hasEWSCertificate}          even={false}/>}
                {[
                  ["Are you an Orphan?",                                                                                                        cat.isOrphan],
                  ["Are you a Person with Disability (Divyang)?",                                                                               cat.isPWD],
                  ["Are you an Ex-Serviceman or Son / Daughter of an Ex-Serviceman?",                                                           cat.isExServiceman],
                  ["Are you Son / Daughter of a Freedom Fighter?",                                                                              cat.isFreedomFighter],
                  ["Are you Project Affected?",                                                                                                  cat.isProjectAffected],
                  ["Are you Son / Daughter of a Landless Farm Labourer?",                                                                       cat.isLandlessFarmLabourer],
                  ["Are you Son / Daughter of a Farmer / Farm Labourer whose only source of income is Agriculture?",                            cat.isIncomeSourceAgriculture],
                  ["Do you hold agricultural land? (Farmer Category [AG Category]?)",                                                           cat.hasFarm],
                  ["Have you participated in NCC / MCC / Scout?",                                                                               cat.isNCC],
                  ["Are you Son / Daughter of an Employee of Mahatma Phule Agriculture University (MPKV)?",                                     cat.isMPKVEmployee],
                  ["Have you participated in Sports / Debate / Essay / Cultural events or represented your school?",                             cat.isSports],
                ].map(([q, v], i) => <BoolRow key={i} question={q} value={v} even={i%2===1}/>)}
              </div>
            </div>

            {/* ══ QUALIFICATION ═══════════════════════════════════════ */}
            <SecHeader title="Highest Qualification Details" icon="fas fa-graduation-cap"/>
            <div style={{ padding:'20px 24px' }}>
              <InfoGrid2 items={[
                ["Highest Qualification", q.highestQualification],
                ["Is Any Educational Gap?", q.isEducationalGap],
                ...(q.isEducationalGap?.toUpperCase()==='YES'
                  ? [["Educational Gap (In Years)", q.educationalGapYears], ["Reason of Educational Gap", q.educationalGapReason]]
                  : []),
              ]}/>
            </div>

            {/* ══ EXAM DETAILS ════════════════════════════════════════ */}
            <SecHeader title={`${q.eligibilityQualification || ''} Examination Details`} icon="fas fa-file-alt"/>
            <div style={{ padding:'20px 24px' }}>
              <InfoGrid2 items={[
                ["Roll No. / Seat No.", q.seatNo],
                ["No. of Attempts",     q.noOfAttempts],
                ["District of Passing", q.passingDistrict],
                ["Year of Passing",     q.passingYear],
              ]}/>
              <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                <InfoFull label="Board"  value={q.board}/>
                <InfoFull label="Marks"  value={q.marksObtained && q.marksOutOf
                  ? `${q.marksObtained} / ${q.marksOutOf} <span style="color:#059669;font-weight:600;">(${q.percentage}%)</span>`
                  : '—'}/>
              </div>
            </div>

            {/* ══ SPORTS (conditional) ════════════════════════════════ */}
            {spt.candidateID > 0 && (
              <>
                <SecHeader title="Sports Details" icon="fas fa-running"/>
                <div style={{ padding:'20px 24px' }}>
                  <InfoGrid2 items={[
                    ["Do you have any Sports Certificate?", spt.isSportsCertificate],
                    ...(spt.isSportsCertificate?.toUpperCase()==='YES' ? [["Certificate Type", spt.certificateType]] : []),
                  ]}/>
                </div>
              </>
            )}

            {/* ══ APPLIED COLLEGES ════════════════════════════════════ */}
            {data.appliedColleges?.length > 0 && (
              <>
                <SecHeader title="Applied College List" icon="fas fa-university"/>
                <div style={{ padding:'20px 24px' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                    <thead><tr style={{ background:V.navy }}>
                      {['Pref. No.','College Code','College Name','District','Status'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{data.appliedColleges.map((c, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1?'#fafbfc':'#fff' }}>
                        <td style={{ padding:'10px 14px', fontSize:13, textAlign:'center', fontWeight:700 }}>{c.preferenceNo}</td>
                        <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{c.collegeCode}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{c.collegeName}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{c.district}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}><span style={{ display:'inline-block', background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, border:'1px solid #bbf7d0' }}>{c.courseStatus}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )}

            {/* ══ FEE PAYMENTS ════════════════════════════════════════ */}
            <SecHeader title="Online Application Fee Payment List" icon="fas fa-receipt"/>
            <div style={{ padding:'20px 24px' }}>
              {data.feePayments?.length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                  <thead><tr style={{ background:V.navy }}>
                    {['Sr.','Transaction ID','Fee Amount','Transaction Date','Payment Date','Bank Ref. No.','Purpose'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{data.feePayments.map((f, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1?'#fafbfc':'#fff' }}>
                      <td style={{ padding:'10px 14px', fontSize:13 }}>{i+1}.</td>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{f.transactionID}</td>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:V.primary }}>₹ {f.feeAmount}</td>
                      <td style={{ padding:'10px 14px', fontSize:13 }}>{f.transactionDate}</td>
                      <td style={{ padding:'10px 14px', fontSize:13 }}>{f.paymentDate}</td>
                      <td style={{ padding:'10px 14px', fontSize:13 }}>{f.bankReferenceNo}</td>
                      <td style={{ padding:'10px 14px', fontSize:13 }}>{f.purpose}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p style={{ fontSize:13, color:V.textSecond, margin:0 }}>No fee payment records found.</p>}
            </div>

            {/* ══ REQUIRED DOCUMENTS ══════════════════════════════════ */}
            <SecHeader title="Required Document List" icon="fas fa-folder-open"/>
            <div style={{ padding:'20px 24px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                <thead><tr style={{ background:V.navy }}>
                  {['Sr.','Document Name','View'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign: h==='View'?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{(data.documents ?? []).map((doc, i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1?'#fafbfc':'#fff' }}>
                    <td style={{ padding:'10px 14px', fontSize:13 }}>{i+1}.</td>
                    <td style={{ padding:'10px 14px', fontSize:13 }}>{doc.documentName}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                      {doc.documentUploadedURL?.length > 0 && (
                        <a href={resolveUrl(doc.documentUploadedURL)} target="_blank" rel="noopener noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, border:`1.5px solid ${V.border}`, borderRadius:6, background:'#f8fafc', color:V.teal, fontSize:12, textDecoration:'none' }}>
                          <i className="fas fa-search"/>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            {/* ══ DECLARATION (mirrors decl-box in old project) ═══════ */}
            <SecHeader title="Declaration / Undertaking by the Candidate" icon="fas fa-pen-fancy"/>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'20px 24px', fontSize:13, color:'#92400e', lineHeight:1.7, display:'flex', gap:12, alignItems:'flex-start' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ marginTop:3, flexShrink:0, width:16, height:16, cursor:'pointer', accentColor:'#dc2626' }}
                />
                <span>
                  I hereby declare &amp; understand that, I am entirely responsible for unlocking my application form.
                </span>
              </div>
            </div>

            {/* ══ FOOTER — Unlock button ═══════════════════════════════ */}
            <div style={{ display:'flex', justifyContent:'center', padding:'20px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={!confirmed || unlocking}
                title={!confirmed ? 'Please read and accept the declaration above' : ''}
                style={{
                  background: (!confirmed || unlocking) ? '#94a3b8' : '#dc2626',
                  color:'#fff', border:'none',
                  padding:'13px 36px', borderRadius:8,
                  fontSize:14, fontWeight:700,
                  cursor: (!confirmed || unlocking) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:8,
                  fontFamily:'inherit',
                  boxShadow: (!confirmed || unlocking) ? 'none' : '0 0 18px rgba(220,38,38,.25)'
                }}
                onMouseEnter={e => { if(confirmed && !unlocking) e.currentTarget.style.background='#b91c1c' }}
                onMouseLeave={e => { if(confirmed && !unlocking) e.currentTarget.style.background='#dc2626' }}>
                {unlocking
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Unlocking...</>
                  : <><i className="fas fa-lock-open"/> Unlock Application Form</>}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* scroll-to-top */}
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      {/* ── Confirm modal (mirrors mpeConfirmBox / ConfirmBox.ascx) ─── */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:460, overflow:'hidden', fontFamily:'inherit' }}>
            {/* modal header */}
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(220,38,38,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="fas fa-lock-open" style={{ color:'#fca5a5', fontSize:14 }}/>
                </div>
                <span style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Unlock Application Form</span>
              </div>
              <button onClick={() => setShowConfirm(false)}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
            </div>
            {/* modal body */}
            <div style={{ padding:'24px 24px 8px', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#fef2f2', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ color:'#dc3545', fontSize:22 }}/>
              </div>
              <p style={{ fontSize:15, fontWeight:600, color:V.textPrimary, margin:'0 0 10px' }}>Are you sure you want to unlock?</p>
              <p style={{ fontSize:13, color:V.textSecond, margin:0, lineHeight:1.7 }}>
                Are you sure you want to unlock your Application Form?<br/>
                You will be able to edit your form after unlocking.
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
              <button onClick={handleUnlock}
                style={{ flex:1, padding:'10px 0', background:'#dc2626', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background='#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background='#dc2626'}>
                <i className="fas fa-lock-open" style={{ fontSize:13 }}/> Yes, Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
