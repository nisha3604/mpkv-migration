import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * ApplicationForm — read-only locked form view.
 * Mirrors ApplicationForm.aspx — shown after locking the form.
 *
 * Same data as Summary page but:
 *  - No declaration checkbox
 *  - No lock button
 *  - Has Print button (opens print view)
 *  - Declaration section shows Date, Locked On, Locked By, and Signature
 *  - Only accessible when form is locked (IsApplicationFormLocked = true)
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

export default function ApplicationForm() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    applicationFormApi.getSummary()
      .then(res => {
        const d = res.data
        if (!d.success) { setError(d.message || 'Failed to load.'); return }
        // Store lock status so Navbar updates immediately
        if (updateUser) updateUser({ formLocked: d.status?.formStatus?.toLowerCase() === 'locked' || true })
        setData(d)
      })
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load application form.'))
      .finally(() => setLoading(false))
  }, [])

  const handlePrint = () =>
    window.open('/candidate/application-form/print', '_blank', 'width=1000,height=700,resizable=yes,scrollbars=yes')

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  const Badge = ({ val }) => {
    const yes = val?.toUpperCase() === 'YES'
    return (
      <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20,
        background: yes ? '#dcfce7' : '#f1f5f9', color: yes ? '#166534' : '#64748b',
        border: `1px solid ${yes ? '#bbf7d0' : '#e2e8f0'}` }}>{val || '—'}</span>
    )
  }

  const SecHeader = ({ title, icon }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
      <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
      {icon && <i className={icon} style={{ color:V.teal, fontSize:13 }}/>}
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:V.textSecond, fontSize:14 }}>Loading Application Form...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ padding:'24px' }}>
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'12px 16px', fontSize:13 }}>
        <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
      </div>
    </div>
  )

  const p   = data?.personal      ?? {}
  const a   = data?.address       ?? {}
  const cat = data?.category      ?? {}
  const q   = data?.qualification ?? {}
  const spt = data?.sports        ?? {}
  const ps  = data?.photoSign     ?? {}
  const st  = data?.status        ?? {}

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

  const catID = cat.categoryID ?? 0
  const showCaste    = catID >= 2
  const showNCL      = catID > 3 && catID < 11
  const showEWS      = catID === 11
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
        {/* ── Main card ─────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header with Print button */}
          <div style={{ background:V.navy, padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-file-alt" style={{ marginRight:8 }}/>Print Application Form
            </h3>
            <button
              type="button"
              onClick={handlePrint}
              style={{ background:V.primary, color:'#fff', border:'none', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background=V.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background=V.primary}>
              <i className="fas fa-print"/> Print Application Form
            </button>
          </div>

          {/* ══ PERSONAL DETAILS ════════════════════════════════════════ */}
          <SecHeader title="Personal Details" icon="fas fa-user"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff' }}>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>Candidate's Full Name</div>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{p.candidateName || '—'}</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  {[
                    ["Father's Full Name",     p.fatherName],
                    ["Mother's Full Name",      p.motherName],
                    ["Date of Birth",           p.dob],
                    ["Gender",                  p.gender],
                    ["Age (as on 01/07/2026)",  p.age],
                    ["Resident of India?",      p.isResidentOfIndia],
                    ["Mobile Number",           p.mobileNo],
                    ["E-Mail ID",               p.emailID],
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
                  {[["Permanent Address", permAddr], ["Correspondence Address", corrAddr]].map(([label, value], i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff', borderTop: i > 0 ? `1px solid ${V.border}` : 'none' }}>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }} dangerouslySetInnerHTML={{ __html: value || '—' }}/>
                    </div>
                  ))}
                </div>
              </div>
              {/* photograph only (no signature in personal section) */}
              <div style={{ width:120, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <div style={{ border:`2px solid ${V.border}`, borderRadius:8, overflow:'hidden', background:'#f8fafc', width:100, height:128, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {ps.photoUploadedURL
                    ? <img src={resolveUrl(ps.photoUploadedURL)} alt="Photograph" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                    : <i className="fas fa-user" style={{ fontSize:36, color:V.textLight }}/>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:V.textSecond, textTransform:'uppercase', letterSpacing:'.06em' }}>Photograph</span>
              </div>
            </div>
          </div>

          {/* ══ CATEGORY ════════════════════════════════════════════════ */}
          <SecHeader title="Category & Other Reservation Details" icon="fas fa-id-card"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:14 }}>
              {[
                ["Father's Domicile District", cat.domicileDistrict],
                ["Father's Domicile Village",  cat.domicileVillage],
                ["Category",                   cat.category ? `${cat.category} (${cat.caste})` : '—'],
                ["Category for Admission",     cat.finalCategory],
              ].map(([label, value], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'190px 1fr', background:'#fff', borderTop: i >= 2 ? `1px solid ${V.border}` : 'none', borderLeft: i%2===1 ? `1px solid ${V.border}` : 'none' }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color: (label==='Category for Admission' && cat.categoryID !== cat.finalCategoryID) ? V.danger : V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              {showCaste    && <BoolRow question="Do You have Caste Certificate?"                         value={cat.hasCasteCertificate}        even={false}  V={V}/>}
              {showCasteRcp && <BoolRow question="Do You have Caste Certificate Receipt?"                 value={cat.hasReceiptCasteCertificate} even={true}   V={V}/>}
              {showNCL      && <BoolRow question="Do You have Non-Creamy Layer Certificate?"              value={cat.hasNCLCertificate}          even={showCaste} V={V}/>}
              {showNCLRcp   && <BoolRow question="Do You have Non-Creamy Layer Certificate Receipt?"      value={cat.hasNCLReceipt}              even={true}   V={V}/>}
              {showEWS      && <BoolRow question="Do You have Economically Weaker Section Certificate?"   value={cat.hasEWSCertificate}          even={false}  V={V}/>}
              {[
                ["Are you an Orphan?", cat.isOrphan],
                ["Are you a Person with Disability (Divyang)?", cat.isPWD],
                ["Are you an Ex-Serviceman or Son / Daughter of an Ex-Serviceman?", cat.isExServiceman],
                ["Are you Son / Daughter of a Freedom Fighter?", cat.isFreedomFighter],
                ["Are you Project Affected?", cat.isProjectAffected],
                ["Are you Son / Daughter of a Landless Farm Labourer?", cat.isLandlessFarmLabourer],
                ["Are you Son / Daughter of a Farmer / Farm Labourer whose only source of income is Agriculture?", cat.isIncomeSourceAgriculture],
                ["Do you hold agricultural land? (Farmer Category [AG Category]?)", cat.hasFarm],
                ["Have you participated in NCC / MCC / Scout?", cat.isNCC],
                ["Are you Son / Daughter of an Employee of MPKV?", cat.isMPKVEmployee],
                ["Have you participated in Sports / Debate / Essay / Cultural events?", cat.isSports],
              ].map(([q, v], i) => <BoolRow key={i} question={q} value={v} even={i%2===1} V={V}/>)}
            </div>
          </div>

          {/* ══ QUALIFICATION ═══════════════════════════════════════════ */}
          <SecHeader title="Highest Qualification Details" icon="fas fa-graduation-cap"/>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              {[
                ["Highest Qualification", q.highestQualification],
                ["Is Any Educational Gap?", q.isEducationalGap],
                ...(q.isEducationalGap?.toUpperCase()==='YES' ? [
                  ["Educational Gap (In Years)", q.educationalGapYears],
                  ["Reason of Educational Gap",  q.educationalGapReason],
                ] : []),
              ].map(([label, value], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'200px 1fr', background:'#fff', borderTop: i>=2?`1px solid ${V.border}`:'none', borderLeft: i%2===1?`1px solid ${V.border}`:'none' }}>
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
              {[["Roll No. / Seat No.", q.seatNo], ["No. of Attempts", q.noOfAttempts], ["District of Passing", q.passingDistrict], ["Year of Passing", q.passingYear]].map(([label, value], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'180px 1fr', background:'#fff', borderTop: i>=2?`1px solid ${V.border}`:'none', borderLeft: i%2===1?`1px solid ${V.border}`:'none' }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
              {[["Board", q.board], ["Marks", q.marksObtained && q.marksOutOf ? `${q.marksObtained} / ${q.marksOutOf} (${q.percentage}%)` : '—']].map(([label, value], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff', borderTop: i>0?`1px solid ${V.border}`:'none' }}>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                  <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SPORTS ══════════════════════════════════════════════════ */}
          {spt.candidateID > 0 && (
            <>
              <SecHeader title="Sports Details" icon="fas fa-running"/>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff' }}>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>Do you have any Sports Certificate?</div>
                    <div style={{ padding:'10px 14px', fontSize:13 }}><Badge val={spt.isSportsCertificate}/></div>
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

          {/* ══ APPLIED COLLEGES ════════════════════════════════════════ */}
          {data?.appliedColleges?.length > 0 && (
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

          {/* ══ FEE PAYMENT ═════════════════════════════════════════════ */}
          <SecHeader title="Online Application Fee Payment List" icon="fas fa-receipt"/>
          <div style={{ padding:'20px 24px' }}>
            {data?.feePayments?.length > 0 ? (
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

          {/* ══ REQUIRED DOCUMENTS ══════════════════════════════════════ */}
          <SecHeader title="Required Document List" icon="fas fa-folder-open"/>
          <div style={{ padding:'20px 24px' }}>
            {data?.documents?.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden' }}>
                <thead><tr style={{ background:V.navy }}>
                  {['Sr.','Document Name','View'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', textAlign: h==='View'?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.documents.map((doc, i) => (
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
            ) : <p style={{ fontSize:13, color:V.textSecond, margin:0 }}>No documents found.</p>}
          </div>

          {/* ══ DECLARATION (read-only, with locked metadata + signature) */}
          <SecHeader title="Declaration / Undertaking by the Candidate" icon="fas fa-pen-fancy"/>
          <div style={{ padding:'20px 24px' }}>
            {/* declaration text */}
            <div style={{ background:'#fff', border:`1.5px solid ${V.border}`, borderRadius:10, padding:'20px 24px', fontSize:13, color:V.textPrimary, lineHeight:1.8, marginBottom:16 }}>
              I hereby declare that all the information given by me in this application is true and correct to
              the best of my knowledge and belief and nothing has been concealed. I also undertake that if any
              of the above statements or information are found to be incorrect or false or any information or
              particulars have been suppressed or omitted therefrom, I am liable to be disqualified and my
              candidature/admission may be cancelled without any notice. I have read and understood the contents
              of the Information Brochure. I acknowledge that filling of this form does not guarantee admission.
            </div>

            {/* metadata + signature */}
            <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden' }}>
                  {[
                    ["Date",        st.lastModifiedOn || '—'],
                    ["Locked On",   st.lastModifiedOn || '—'],
                    ["Locked By",   p.candidateName   || '—'],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'220px 1fr', background:'#fff', borderTop: i>0?`1px solid ${V.border}`:'none' }}>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* signature */}
              <div style={{ width:180, flexShrink:0, border:`1.5px solid ${V.border}`, borderRadius:10, background:'#fff', padding:16, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ width:140, height:48, border:`1px solid ${V.border}`, borderRadius:6, overflow:'hidden', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {ps.signUploadedURL
                    ? <img src={resolveUrl(ps.signUploadedURL)} alt="Signature" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                    : <i className="fas fa-pen-nib" style={{ fontSize:20, color:V.textLight }}/>}
                </div>
                <span style={{ fontSize:11, color:V.textSecond, fontWeight:600, textAlign:'center' }}>Signature of the Candidate</span>
                <span style={{ fontSize:12, color:V.textSecond }}>({p.candidateName || '—'})</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* scroll-to-top */}
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      {/* Print styles */}
      <style>{`
        @media print {
          button, nav, header { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}

function BoolRow({ question, value, even, V }) {
  const yes = value?.toUpperCase() === 'YES'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${V.borderLight}`, background: even ? '#fafbfc' : '#fff', fontSize:13 }}>
      <span style={{ color:V.textPrimary, flex:1, paddingRight:12 }}>{question}</span>
      <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background: yes?'#dcfce7':'#f1f5f9', color: yes?'#166534':'#64748b', border: `1px solid ${yes?'#bbf7d0':'#e2e8f0'}` }}>{value || '—'}</span>
    </div>
  )
}
