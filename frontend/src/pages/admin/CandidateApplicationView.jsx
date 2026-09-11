import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { candidateUtilsApi } from '../../services/api'

/**
 * CandidateApplicationView — Admin read-only view of a candidate's full application.
 * Mirrors ApplicationFormSummary.aspx but without lock/declaration.
 * Entry: Click Application ID in SearchCandidate.jsx → /admin/candidates/view/:candidateId
 * Data: GET /api/admin/candidates/:candidateId/application
 *       → ApplicationForm_GetFormSummary (same SP as candidate's own summary page)
 */

// Strip ViewFile.aspx wrapper from blob URLs
function resolveUrl(url) {
  if (!url) return ''
  let cur = url
  while (cur.includes('ViewFile.aspx') && cur.includes('FileURL=')) {
    const m = cur.match(/FileURL=([^&\s]+)/)
    if (!m?.[1]) break
    const ex = decodeURIComponent(m[1])
    if (ex === cur) break
    cur = ex
  }
  return cur
}

export default function CandidateApplicationView() {
  const { applicationId } = useParams()
  const navigate          = useNavigate()
  const location          = useLocation()

  // Optional hint passed via router state from SearchCandidate
  const hint = location.state ?? {}

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Unlock state
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [unlocking,         setUnlocking]         = useState(false)
  const [unlockSuccess,     setUnlockSuccess]     = useState('')
  const [unlockError,       setUnlockError]       = useState('')

  useEffect(() => {
    if (!applicationId) { setError('No application ID provided.'); setLoading(false); return }
    candidateUtilsApi.getApplication(applicationId)
      .then(r => {
        if (r.data?.success) setData(r.data.data)
        else setError(r.data?.message || 'Could not load application data.')
      })
      .catch(e => {
        if (e.response?.status === 403) setError('Access denied.')
        else setError('Failed to load candidate application. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [applicationId])

  // ── CSS tokens (match project style) ──────────────────────────────────────
  const V = {
    navy        : '#14212e',
    primary     : '#059669',
    teal        : '#0d9488',
    tealLight   : '#f0fdfb',
    tealBorder  : '#ccfbf1',
    border      : '#e2e8f0',
    borderLight : '#f1f5f9',
    textPrimary : '#0f172a',
    textSecond  : '#64748b',
    bg          : '#f5f6fa',
    danger      : '#ef4444',
  }

  // ── Sub-components ─────────────────────────────────────────────────────────

  const InfoRow = ({ label, value, fullWidth }) => (
    <div style={{ display:'grid', gridTemplateColumns: fullWidth ? '220px 1fr' : '200px 1fr', borderTop:`1px solid ${V.border}` }}>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textSecond, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
      <div style={{ padding:'10px 14px', fontSize:13, color:V.textPrimary, fontWeight:600 }} dangerouslySetInnerHTML={{ __html: value || '—' }} />
    </div>
  )

  const Badge = ({ val }) => {
    const yes = val?.toUpperCase() === 'YES'
    return (
      <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20,
        background: yes ? '#dcfce7' : '#f1f5f9', color: yes ? '#166534' : V.textSecond,
        border:`1px solid ${yes ? '#bbf7d0' : V.border}` }}>{val || '—'}</span>
    )
  }

  const BoolRow = ({ question, value, even }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${V.borderLight}`, background: even ? '#fafbfc' : '#fff', fontSize:13 }}>
      <span style={{ color:V.textPrimary, flex:1, paddingRight:12 }}>{question}</span>
      <Badge val={value} />
    </div>
  )

  const SecHeader = ({ title, icon }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
      <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }} />
      {icon && <i className={icon} style={{ color:V.teal, fontSize:13 }} />}
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )

  const SectionHeader = ({ title, icon, color = V.navy }) => (
    <div style={{ background:color, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
      {icon && <i className={`fas ${icon}`} style={{ color:'#fff', fontSize:13 }} />}
      <span style={{ color:'#fff', fontWeight:700, fontSize:13.5, textTransform:'uppercase', letterSpacing:'.04em' }}>{title}</span>
    </div>
  )

  // ── Unlock handler ────────────────────────────────────────────────────────
  const handleUnlock = async () => {
    setUnlocking(true); setShowUnlockConfirm(false); setUnlockError(''); setUnlockSuccess('')
    try {
      const res = await candidateUtilsApi.unlockForm(applicationId)
      if (res.data?.success) {
        setUnlockSuccess(res.data.message || 'Application form unlocked successfully.')
        // Refresh the page data so formStatus updates
        setLoading(true)
        const r2 = await candidateUtilsApi.getApplication(applicationId)
        if (r2.data?.success) setData(r2.data.data)
        setLoading(false)
      } else {
        setUnlockError(res.data?.message || 'Failed to unlock. Please try again.')
      }
    } catch {
      setUnlockError('Server error. Please try again.')
    } finally { setUnlocking(false) }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p style={{ color:V.textSecond, fontSize:14 }}>Loading candidate application...</p>
      </div>
    </div>
  )

  // ── Short-circuit error ────────────────────────────────────────────────────
  if (error && !data) return (
    <div style={{ padding:'28px', background:V.bg, minHeight:'100vh' }}>
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:8, padding:'14px 18px', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <i className="fas fa-exclamation-circle" />{error}
      </div>
      <button onClick={() => navigate(-1)}
        style={{ background:V.navy, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
        <i className="fas fa-arrow-left" />Back
      </button>
    </div>
  )

  // ── Derived values ─────────────────────────────────────────────────────────
  const p   = data?.personal       ?? {}
  const a   = data?.address        ?? {}
  const cat = data?.category       ?? {}
  const q   = data?.qualification  ?? {}
  const spt = data?.sports         ?? {}
  const ps  = data?.photoSign      ?? {}
  const st  = data?.status         ?? {}

  const catID     = cat.categoryID ?? 0
  const showCaste = catID >= 2
  const showNCL   = catID > 3 && catID < 11
  const showEWS   = catID === 11

  const buildAddr = (l1, l2, state, dist, city, pin) =>
    [l1, l2].filter(Boolean).join(', ')
    + (state ? `<br/>State: ${state}` : '')
    + (dist  ? `, District: ${dist}`  : '')
    + (city  ? `, City/Town: ${city}` : '')
    + (pin   ? `, PIN: ${pin}`        : '')

  const permAddr = buildAddr(a.addressLine1, a.addressLine2, a.state, a.district, a.city, a.pincode)
  const corrAddr = a.isCorrAddressSameAsPermanent
    ? permAddr
    : buildAddr(a.corrAddressLine1, a.corrAddressLine2, a.corrState, a.corrDistrict, a.corrCity, a.corrPincode)

  const photoUrl = resolveUrl(ps.photoUploadedURL)
  const signUrl  = resolveUrl(ps.signUploadedURL)

  // ── Completion status chips ────────────────────────────────────────────────
  const steps = [
    { label:'Personal',      done: st.isPersonalDetailsFilled                    },
    { label:'Address',       done: st.isAddressDetailsFilled                     },
    { label:'Category',      done: st.isCategoryAndOtherReservationDetailsFilled },
    { label:'Qualification', done: st.isQualificationDetailsFilled               },
    { label:'Sports',        done: st.isSportsDetailsFilled                      },
    { label:'Colleges',      done: st.isAppliedForColleges                       },
    { label:'Photo & Sign',  done: st.isPhotoAndSignUploaded                     },
    { label:'Documents',     done: st.isAllCompulsoryDocumentsUploaded            },
    { label:'Fee Paid',      done: st.isApplicationFeePaid                       },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>
      <style>{`@media print { nav,header,footer,.site-header,.site-footer { display:none !important; } }`}</style>

      {/* ── Admin info bar ──────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 24px' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ background:'transparent', border:`1px solid ${V.border}`, color:V.textSecond, padding:'5px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, marginRight:8 }}
          onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <i className="fas fa-arrow-left" />Back to Search
        </button>

        {/* Admin badge */}
        <span style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:700, color:'#92400e', letterSpacing:'.05em' }}>
          <i className="fas fa-user-shield" style={{ marginRight:4 }} />Admin View — Read Only
        </span>

        {/* Identity info */}
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{p.applicationID || hint.applicationID || '—'}</span>
        {p.appliedCourse && <>
          <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Applied Course</span>
          <span style={{ fontSize:14, fontWeight:600, color:V.textPrimary }}>{p.appliedCourse}</span>
        </>}
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Form Status</span>
        <span style={{
          display:'inline-block', fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:20,
          background: st.formStatus?.toLowerCase() === 'locked' ? '#dcfce7' : '#fef3c7',
          color:      st.formStatus?.toLowerCase() === 'locked' ? '#166534' : '#92400e',
          border:    `1px solid ${st.formStatus?.toLowerCase() === 'locked' ? '#bbf7d0' : '#fde68a'}`,
        }}>{st.formStatus || 'Incomplete'}</span>

        {/* Unlock button — only when form is Locked */}
        {st.formStatus?.toLowerCase() === 'locked' && !unlockSuccess && (
          <button
            onClick={() => setShowUnlockConfirm(true)}
            disabled={unlocking}
            style={{ marginLeft:8, display:'inline-flex', alignItems:'center', gap:6, background: unlocking ? '#d97706' : '#f59e0b', color:'#fff', border:'none', padding:'5px 16px', borderRadius:6, fontSize:12.5, fontWeight:700, cursor: unlocking ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}
            onMouseEnter={e => { if (!unlocking) e.currentTarget.style.background='#d97706' }}
            onMouseLeave={e => { if (!unlocking) e.currentTarget.style.background='#f59e0b' }}>
            {unlocking
              ? <><span style={{ width:12, height:12, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'daspin .7s linear infinite' }} />Unlocking...</>
              : <><i className="fas fa-lock-open" />Unlock Form</>}
          </button>
        )}
      </div>

      {/* ── Step completion bar ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'14px 24px', flexWrap:'wrap', background:'#fff', borderBottom:`1px solid ${V.border}` }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:700, padding:'4px 10px', borderRadius:20,
            background: s.done ? '#dcfce7' : '#fef2f2',
            color:      s.done ? '#166534' : '#dc2626',
            border:    `1px solid ${s.done ? '#bbf7d0' : '#fecaca'}` }}>
            <i className={`fas ${s.done ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ fontSize:10 }} />
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 0' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
          </div>
        )}

        {/* Unlock success banner */}
        {unlockSuccess && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-check-circle" style={{ color:'#16a34a', fontSize:15 }} />
            <span>{unlockSuccess}</span>
          </div>
        )}

        {/* Unlock error banner */}
        {unlockError && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle" />{unlockError}
          </div>
        )}

        {/* ── Main card ──────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.06)' }}>

          {/* Card header */}
          <div style={{ background:V.navy, padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'.06em' }}>Candidate Application (Read-Only)</p>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', margin:0 }}>{p.candidateName || hint.candidateName || 'Candidate Application'}</h2>
            </div>
            {photoUrl && (
              <img src={photoUrl} alt="Candidate Photo" style={{ width:64, height:80, objectFit:'cover', border:'2px solid rgba(255,255,255,.3)', borderRadius:6 }} />
            )}
          </div>

          {/* ── Personal Details ──────────────────────────────────────── */}
          <SectionHeader title="Personal Details" icon="fa-user" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <InfoRow label="Candidate Name"      value={p.candidateName}     />
            <InfoRow label="Father's Name"       value={p.fatherName}        />
            <InfoRow label="Mother's Name"       value={p.motherName}        />
            <InfoRow label="Gender"              value={p.gender}            />
            <InfoRow label="Date of Birth"       value={p.dob}               />
            <InfoRow label="Age"                 value={p.age}               />
            <InfoRow label="Mobile No."          value={p.mobileNo}          />
            <InfoRow label="E-Mail ID"           value={p.eMailID}           />
            <InfoRow label="Is Resident of India?" value={p.isResidentOfIndia} />
          </div>

          {/* Photo & Signature */}
          {(photoUrl || signUrl) && (
            <>
              <SecHeader title="Photo & Signature" icon="fas fa-image" />
              <div style={{ display:'flex', gap:32, padding:'20px 24px', background:'#fff' }}>
                {photoUrl && (
                  <div style={{ textAlign:'center' }}>
                    <img src={photoUrl} alt="Photograph" style={{ height:120, width:96, objectFit:'cover', border:`1px solid ${V.border}`, borderRadius:4 }} />
                    <p style={{ fontSize:11, color:V.textSecond, margin:'6px 0 0', textTransform:'uppercase', letterSpacing:'.06em' }}>Photograph</p>
                  </div>
                )}
                {signUrl && (
                  <div style={{ textAlign:'center' }}>
                    <img src={signUrl} alt="Signature" style={{ height:60, width:180, objectFit:'contain', border:`1px solid ${V.border}`, borderRadius:4, marginTop:30 }} />
                    <p style={{ fontSize:11, color:V.textSecond, margin:'6px 0 0', textTransform:'uppercase', letterSpacing:'.06em' }}>Signature</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Address Details ───────────────────────────────────────── */}
          <SectionHeader title="Address Details" icon="fa-map-marker-alt" />
          <div>
            <InfoRow label="Permanent Address" value={permAddr} fullWidth />
            <InfoRow label="Correspondence Address" value={corrAddr} fullWidth />
          </div>

          {/* ── Category & Other Reservation ──────────────────────────── */}
          <SectionHeader title="Category & Other Reservation Details" icon="fa-id-card" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <InfoRow label="Domicile District" value={cat.domicileDistrict} />
            <InfoRow label="Domicile Village"  value={cat.domicileVillage}  />
            <InfoRow label="Category"          value={cat.category ? `${cat.category} (${cat.caste})` : '—'} />
            <InfoRow label="Final Category"    value={cat.finalCategory}    />
            {showEWS && <InfoRow label="Has EWS Certificate" value={cat.hasEWSCertificate} />}
          </div>
          <SecHeader title="Reservation Details" icon="fas fa-list-check" />
          {[
            { q:'Is Orphan',                              v: cat.isOrphan                  },
            { q:'Is Person with Disability (PWD)',        v: cat.isPWD                     },
            { q:'Is Ex-Serviceman',                       v: cat.isExServiceman            },
            { q:'Is Freedom Fighter',                     v: cat.isFreedomFighter          },
            { q:'Is Project Affected',                    v: cat.isProjectAffected         },
            { q:'Is NCC',                                 v: cat.isNCC                     },
            { q:'Is Sports',                              v: cat.isSports                  },
            { q:'Is MPKV Employee',                       v: cat.isMPKVEmployee            },
            { q:'Is Landless Farm Labourer',              v: cat.isLandlessFarmLabourer    },
            { q:'Is Income Source Agriculture',           v: cat.isIncomeSourceAgriculture },
            { q:'Has Farm',                               v: cat.hasFarm                   },
            ...(showCaste ? [{ q:'Has Caste Certificate', v: cat.hasCasteCertificate }] : []),
            ...(showCaste && cat.hasCasteCertificate === 'NO' ? [{ q:'Has Receipt of Caste Certificate', v: cat.hasReceiptCasteCertificate }] : []),
            ...(showNCL ? [{ q:'Has Non-Creamy Layer (NCL) Certificate', v: cat.hasNCLCertificate }] : []),
            ...(showNCL && cat.hasNCLCertificate === 'NO' ? [{ q:'Has Receipt of NCL Certificate', v: cat.hasNCLReceipt }] : []),
          ].map((item, i) => <BoolRow key={i} question={item.q} value={item.v} even={i%2===0} />)}

          {/* ── Qualification ─────────────────────────────────────────── */}
          <SectionHeader title="Qualification Details" icon="fa-graduation-cap" />
          <SecHeader title="Highest Qualification" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <InfoRow label="Highest Qualification" value={q.highestQualification} />
            <InfoRow label="Is Educational Gap"    value={q.isEducationalGap}     />
            {q.isEducationalGap?.toUpperCase() === 'YES' && <>
              <InfoRow label="Educational Gap (Years)" value={q.educationalGapYears}  />
              <InfoRow label="Reason for Gap"          value={q.educationalGapReason} />
            </>}
          </div>
          <SecHeader title={`Eligibility Qualification: ${q.eligibilityQualification ?? ''}`} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <InfoRow label="Seat No."          value={q.seatNo}          />
            <InfoRow label="No. of Attempts"   value={q.noOfAttempts}    />
            <InfoRow label="Passing District"  value={q.passingDistrict} />
            <InfoRow label="Passing Year"      value={q.passingYear}     />
            <InfoRow label="Board / University" value={q.board}          />
            <InfoRow label="Marks"             value={q.marksObtained && q.marksOutOf ? `${q.marksObtained} / ${q.marksOutOf} (${q.percentage}%)` : '—'} />
          </div>

          {/* ── Sports ───────────────────────────────────────────────── */}
          {spt.candidateID > 0 && (
            <>
              <SectionHeader title="Sports Details" icon="fa-running" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                <InfoRow label="Has Sports Certificate" value={spt.isSportsCertificate} />
                {spt.isSportsCertificate?.toUpperCase() === 'YES' && (
                  <InfoRow label="Certificate Type" value={spt.certificateType} />
                )}
              </div>
            </>
          )}

          {/* ── Applied Colleges ──────────────────────────────────────── */}
          {data?.appliedColleges?.length > 0 && (
            <>
              <SectionHeader title="Shortlisted & Preferenced Colleges" icon="fa-university" />
              <div style={{ padding:'0', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:`1px solid ${V.border}` }}>
                      {['Pref. No.','College Code','College Name','District','Course Status'].map((h,i) => (
                        <th key={i} style={{ padding:'9px 14px', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', color:V.textSecond, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.appliedColleges.map((c, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding:'9px 14px', fontWeight:700, color:V.primary }}>{c.preferenceNo}</td>
                        <td style={{ padding:'9px 14px', fontWeight:600 }}>{c.collegeCode}</td>
                        <td style={{ padding:'9px 14px' }}>{c.collegeName}</td>
                        <td style={{ padding:'9px 14px', color:V.textSecond }}>{c.district}</td>
                        <td style={{ padding:'9px 14px', color:V.textSecond }}>{c.courseStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Required Documents ────────────────────────────────────── */}
          {data?.documents?.length > 0 && (
            <>
              <SectionHeader title="Required Documents" icon="fa-file-alt" />
              <div style={{ padding:'0', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:`1px solid ${V.border}` }}>
                      {['Sr.','Document Name','Compulsory','Uploaded','Verification Status','Comments','Date'].map((h,i) => (
                        <th key={i} style={{ padding:'9px 14px', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', color:V.textSecond, textAlign:i===0?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.documents.map((doc, i) => {
                      const uploaded = doc.isDocumentUploaded?.toUpperCase() === 'YES'
                      const verified = doc.documentVerificationStatus?.toUpperCase() === 'VERIFIED'
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ padding:'9px 14px', textAlign:'center', color:V.textSecond }}>{i+1}.</td>
                          <td style={{ padding:'9px 14px', fontWeight:500 }}>
                            {doc.documentUploadedURL ? (
                              <a href={resolveUrl(doc.documentUploadedURL)} target="_blank" rel="noreferrer"
                                style={{ color:V.primary, textDecoration:'underline', textDecorationStyle:'dotted' }}>
                                {doc.documentName}
                              </a>
                            ) : doc.documentName}
                          </td>
                          <td style={{ padding:'9px 14px' }}><Badge val={doc.isDocumentCompulsory} /></td>
                          <td style={{ padding:'9px 14px' }}><Badge val={doc.isDocumentUploaded}   /></td>
                          <td style={{ padding:'9px 14px' }}>
                            <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 10px', borderRadius:20,
                              background: verified ? '#dcfce7' : uploaded ? '#fef3c7' : '#f1f5f9',
                              color:      verified ? '#166534' : uploaded ? '#92400e' : V.textSecond,
                              border:    `1px solid ${verified ? '#bbf7d0' : uploaded ? '#fde68a' : V.border}` }}>
                              {doc.documentVerificationStatus || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding:'9px 14px', fontSize:12, color:V.textSecond }}>{doc.documentVerificationComments || '—'}</td>
                          <td style={{ padding:'9px 14px', fontSize:12, color:V.textSecond, whiteSpace:'nowrap' }}>{doc.documentVerificationDate || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Fee Payment History ───────────────────────────────────── */}
          {data?.feePayments?.length > 0 && (
            <>
              <SectionHeader title="Fee Payment History" icon="fa-rupee-sign" />
              <div style={{ padding:'0', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:`1px solid ${V.border}` }}>
                      {['Transaction ID','Purpose','Amount','Transaction Date','Payment Date','Bank Ref. No.','Status'].map((h,i) => (
                        <th key={i} style={{ padding:'9px 14px', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', color:V.textSecond, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.feePayments.map((fee, i) => {
                      const paid = fee.paidStatus?.toUpperCase() === 'SUCCESS' || fee.paidStatus?.toUpperCase() === 'PAID'
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ padding:'9px 14px', fontWeight:600, color:V.primary }}>{fee.transactionID}</td>
                          <td style={{ padding:'9px 14px' }}>{fee.purpose}</td>
                          <td style={{ padding:'9px 14px', fontWeight:700 }}>₹{fee.feeAmount}</td>
                          <td style={{ padding:'9px 14px', color:V.textSecond, whiteSpace:'nowrap' }}>{fee.transactionDate}</td>
                          <td style={{ padding:'9px 14px', color:V.textSecond, whiteSpace:'nowrap' }}>{fee.paymentDate || '—'}</td>
                          <td style={{ padding:'9px 14px', color:V.textSecond }}>{fee.bankReferenceNo || '—'}</td>
                          <td style={{ padding:'9px 14px' }}>
                            <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 10px', borderRadius:20,
                              background: paid ? '#dcfce7' : '#fef2f2',
                              color:      paid ? '#166534' : '#dc2626',
                              border:    `1px solid ${paid ? '#bbf7d0' : '#fecaca'}` }}>
                              {fee.paidStatus || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div style={{ padding:'16px 24px', borderTop:`1px solid ${V.border}`, background:'#fafbfc', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ fontSize:12, color:V.textSecond }}>
              <i className="fas fa-info-circle" style={{ marginRight:6 }} />
              This is a read-only administrative view. Last modified: {st.lastModifiedOn || '—'}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => window.open(`/candidate/application-form/print?appId=${p.applicationID || hint.applicationID || applicationId}`, '_blank')}
                style={{ background:'#2563eb', color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}
                onMouseEnter={e=>e.currentTarget.style.background='#1d4ed8'}
                onMouseLeave={e=>e.currentTarget.style.background='#2563eb'}>
                <i className="fas fa-print" />Print Application Form
              </button>
              <button onClick={() => navigate(-1)}
                style={{ background:V.navy, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}
                onMouseEnter={e=>e.currentTarget.style.background='#1e293b'}
                onMouseLeave={e=>e.currentTarget.style.background=V.navy}>
                <i className="fas fa-arrow-left" />Back to Search
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Unlock Confirm Modal ─────────────────────────────────────────── */}
      {showUnlockConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(2px)' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'32px 36px', maxWidth:420, width:'90%', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ width:56, height:56, background:'#fef3c7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <i className="fas fa-lock-open" style={{ color:'#d97706', fontSize:22 }} />
            </div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 8px' }}>Confirm Unlock</h3>
            <p style={{ fontSize:14, color:'#64748b', margin:'0 0 6px' }}>
              Are you sure you want to unlock the application form of:
            </p>
            <p style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>
              {p.candidateName || hint.candidateName || '—'}
            </p>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 20px' }}>
              Application ID: <strong>{p.applicationID || hint.applicationID || applicationId}</strong>
            </p>
            <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:22, fontSize:12.5, color:'#92400e', textAlign:'left' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight:6 }} />
              The candidate will be able to edit their form again after unlocking. This action is logged against your admin account.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setShowUnlockConfirm(false)}
                style={{ background:'#f1f5f9', border:'none', color:'#374151', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleUnlock}
                style={{ background:'#f59e0b', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                <i className="fas fa-lock-open" />Yes, Unlock Form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
