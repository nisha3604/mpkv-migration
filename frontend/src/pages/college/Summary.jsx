import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

export default function CollegeSummary() {
  const { user, isAdmin }  = useAuth()
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const collegeIdQS        = searchParams.get('collegeId')

  const [college,   setCollege]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState({ show:false, msg:'', success:true })
  const [error,     setError]     = useState('')
  const [actioning, setActioning] = useState(false)

  const loadSummary = () => {
    setLoading(true); setError('')
    collegeApi.getSummary(collegeIdQS)
      .then(res => { if (res.data.success) setCollege(res.data.college); else setError(res.data.message || 'Failed to load.') })
      .catch(() => setError('Failed to load college details.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSummary() }, [collegeIdQS])
  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => setToast(p => ({ ...p, show:false })), 3500)
    return () => clearTimeout(t)
  }, [toast.show])

  const handleToggle = async (activate) => {
    if (actioning) return
    setActioning(true); setError('')
    try {
      const res = activate ? await collegeApi.activate(college.collegeID) : await collegeApi.deactivate(college.collegeID)
      if (res.data.success) { loadSummary(); setToast({ show:true, msg: activate ? 'College Activated Successfully.' : 'College Deactivated Successfully.', success:true }) }
      else setToast({ show:true, msg:res.data.message||'Action failed.', success:false })
    } catch { setToast({ show:true, msg:'An error occurred.', success:false }) }
    finally { setActioning(false) }
  }

  const handleEdit = () => isAdmin ? navigate(`/admin/college/edit?collegeId=${collegeIdQS||college?.collegeID}`) : navigate('/college/edit')
  const handleBack = () => navigate('/admin/college/list')

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  // ── Compact info field ────────────────────────────────────────────────────
  const F = ({ label, value, icon }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'10px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #f1f5f9', transition:'all .18s' }}
      onMouseEnter={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#bbf7d0' }}
      onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#f1f5f9' }}>
      <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', display:'flex', alignItems:'center', gap:5 }}>
        {icon && <i className={`fas ${icon}`} style={{ fontSize:9, color:'#0ea5e9' }} />}
        {label}
      </span>
      <span style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', lineHeight:1.3, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>{value || '—'}</span>
    </div>
  )

  // ── Section title ─────────────────────────────────────────────────────────
  const STitle = ({ icon, label, color }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingBottom:8, borderBottom:`2px solid ${color}20` }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={`fas ${icon}`} style={{ color, fontSize:12 }} />
      </div>
      <span style={{ fontSize:12, fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', padding:'20px 20px 32px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Toast */}
        {toast.show && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:toast.success?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.success?'#bbf7d0':'#fecaca'}`, color:toast.success?'#166534':'#dc2626', borderRadius:12, padding:'11px 18px', marginBottom:14, fontSize:13, fontWeight:600, boxShadow:'0 4px 14px rgba(0,0,0,.07)' }}>
            <i className={`fas ${toast.success?'fa-check-circle':'fa-exclamation-circle'}`} /> {toast.msg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:12, padding:'11px 18px', marginBottom:14, fontSize:13, fontWeight:600 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {college && (
          <>
            {/* ── Compact header + actions in one bar ──────────────────── */}
            <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f 55%,#0f172a)', borderRadius:18, padding:'20px 26px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 14px 40px rgba(15,23,42,.35)' }}>
              <div style={{ position:'absolute', top:-24, right:-24, width:130, height:130, borderRadius:'50%', background:'rgba(5,150,105,.12)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                {/* Row 1 — name + status */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <span style={{ background:'rgba(5,150,105,.25)', border:'1px solid rgba(5,150,105,.45)', borderRadius:7, padding:'2px 10px', color:'#34d399', fontSize:10.5, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase' }}>
                        <i className="fas fa-building" style={{ marginRight:4, fontSize:9 }} />Code : {college.collegeCode}
                      </span>
                      <span style={{ background:college.isActive?'#059669':'#dc2626', color:'#fff', fontSize:10.5, fontWeight:800, padding:'2px 10px', borderRadius:20, letterSpacing:'.05em' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,.7)', display:'inline-block', marginRight:4 }} />
                        {college.isActive?'ACTIVE':'INACTIVE'}
                      </span>
                    </div>
                    <h1 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:0, lineHeight:1.25, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>{college.collegeName}</h1>
                    <p style={{ color:'#94a3b8', fontSize:12, margin:'4px 0 0', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize:10 }} />
                      {[college.district, college.taluka, college.city, college.pincode].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    {isAdmin && (
                      <button onClick={handleBack}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', color:'#e2e8f0', border:'1px solid rgba(255,255,255,.2)', borderRadius:9, padding:'8px 16px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(220,38,38,.3)'; e.currentTarget.style.borderColor='rgba(220,38,38,.6)'; e.currentTarget.style.color='#fca5a5' }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,.2)'; e.currentTarget.style.color='#e2e8f0' }}>
                        <i className="fas fa-arrow-left" style={{ fontSize:10 }} /> Back
                      </button>
                    )}
                    {(!isAdmin || college.isActive) && (
                      <button onClick={handleEdit}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none', borderRadius:9, padding:'8px 18px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(5,150,105,.35)', transition:'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 7px 20px rgba(5,150,105,.45)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(5,150,105,.35)' }}>
                        <i className="fas fa-edit" style={{ fontSize:11 }} /> Edit Info
                      </button>
                    )}
                    {isAdmin && !college.isActive && (
                      <button onClick={() => handleToggle(true)} disabled={actioning}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none', borderRadius:9, padding:'8px 18px', fontSize:12.5, fontWeight:700, cursor:actioning?'not-allowed':'pointer', opacity:actioning?.7:1, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,99,235,.35)', transition:'all .18s' }}>
                        {actioning ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-check-circle" style={{ fontSize:11 }} />}
                        Activate
                      </button>
                    )}
                    {isAdmin && college.isActive && (
                      <button onClick={() => handleToggle(false)} disabled={actioning}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:9, padding:'8px 18px', fontSize:12.5, fontWeight:700, cursor:actioning?'not-allowed':'pointer', opacity:actioning?.7:1, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(220,38,38,.35)', transition:'all .18s' }}>
                        {actioning ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-times-circle" style={{ fontSize:11 }} />}
                        De-Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2-column section layout ──────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

              {/* Left column */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* College Details */}
                <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
                  <STitle icon="fa-building" label="College Details" color="#059669" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ gridColumn:'1/-1' }}><F icon="fa-university" label="College Name" value={college.collegeName} /></div>
                    <div style={{ gridColumn:'1/-1' }}><F icon="fa-map-marker-alt" label="Address" value={college.collegeAddress} /></div>
                    <F icon="fa-map"      label="District"   value={college.district} />
                    <F icon="fa-map-pin"  label="Taluka"     value={college.taluka} />
                    <F icon="fa-city"     label="City"       value={college.city} />
                    <F icon="fa-mail-bulk"label="PIN"        value={college.pincode} />
                    <F icon="fa-phone"    label="Mobile No." value={college.mobileNo} />
                    <F icon="fa-envelope" label="Email ID"   value={college.emailID} />
                  </div>
                </div>

                {/* Course Details */}
                <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
                  <STitle icon="fa-book-open" label="Course Details" color="#0ea5e9" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ gridColumn:'1/-1' }}><F icon="fa-graduation-cap" label="Course" value={college.course} /></div>
                    <F icon="fa-tag"      label="Status"           value={college.courseStatus} />
                    <F icon="fa-users"    label="Intake"           value={String(college.intake||'—')} />
                    <F icon="fa-briefcase"label="Management Quota" value={college.hasManagementQuota} />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Principal Details */}
                <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
                  <STitle icon="fa-user-tie" label="Principal Details" color="#8b5cf6" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
                    <F icon="fa-user"     label="Name"       value={college.principalName} />
                    <F icon="fa-envelope" label="Email ID"   value={college.principalEmailID} />
                    <F icon="fa-phone"    label="Mobile No." value={college.principalMobileNo} />
                  </div>
                </div>

                {/* Admission Incharge Details */}
                <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>
                  <STitle icon="fa-user-cog" label="Admission Incharge" color="#f59e0b" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
                    <F icon="fa-user"     label="Name"       value={college.admissionInchargeName} />
                    <F icon="fa-envelope" label="Email ID"   value={college.admissionInchargeEmailID} />
                    <F icon="fa-phone"    label="Mobile No." value={college.admissionInchargeMobileNo} />
                  </div>
                </div>

                {/* Quick info stats card */}
                <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 16px rgba(15,23,42,.25)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <i className="fas fa-info-circle" style={{ color:'#34d399', fontSize:14 }} />
                    <span style={{ fontSize:12, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'.06em' }}>Quick Stats</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { label:'Intake',          value: college.intake || 0,              color:'#34d399' },
                      { label:'Course Status',   value: college.courseStatus || '—',      color:'#60a5fa' },
                      { label:'Mgmt Quota',      value: college.hasManagementQuota||'NO', color:'#fbbf24' },
                      { label:'Status',          value: college.isActive?'Active':'Inactive', color: college.isActive?'#34d399':'#f87171' },
                    ].map((s,i) => (
                      <div key={i} style={{ background:'rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px' }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize:15, fontWeight:800, color:s.color, margin:0, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
