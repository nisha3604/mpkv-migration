import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { admissionApi } from '../../services/api'

/**
 * CheckApplicationID — same backend logic, redesigned UI
 * Handles: ConfirmAdmission | CancelAdmission | PrintAdmissionLetter |
 *          PrintAdmissionRejectionLetter | PrintAdmissionCancellationLetter
 */
export default function CheckApplicationID() {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin  = user?.userTypeID === 11 || user?.userTypeID === 12

  const getFlag = () => {
    if (location.state?.flag) return location.state.flag
    const path = location.pathname
    if (path.includes('confirm'))             return 'ConfirmAdmission'
    if (path.includes('cancel'))              return 'CancelAdmission'
    if (path.includes('cancellation-letter')) return 'PrintAdmissionCancellationLetter'
    if (path.includes('rejection-letter'))    return 'PrintAdmissionRejectionLetter'
    if (path.includes('admission-letter'))    return 'PrintAdmissionLetter'
    return 'ConfirmAdmission'
  }
  const flag = getFlag()

  const flagConfig = {
    ConfirmAdmission                : { label:'Confirm Admission',                icon:'fa-user-check',    color:'#059669', gradient:'linear-gradient(135deg,#059669,#047857)' },
    CancelAdmission                 : { label:'Cancel Admission',                 icon:'fa-user-times',    color:'#dc2626', gradient:'linear-gradient(135deg,#dc2626,#b91c1c)' },
    PrintAdmissionLetter            : { label:'Print Admission Letter',           icon:'fa-file-alt',      color:'#0ea5e9', gradient:'linear-gradient(135deg,#0ea5e9,#0284c7)' },
    PrintAdmissionCancellationLetter: { label:'Print Admission Cancellation Letter', icon:'fa-file-times', color:'#f59e0b', gradient:'linear-gradient(135deg,#f59e0b,#d97706)' },
    PrintAdmissionRejectionLetter   : { label:'Print Admission Rejection Letter', icon:'fa-file-excel',   color:'#8b5cf6', gradient:'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  }
  const cfg       = flagConfig[flag] ?? flagConfig.ConfirmAdmission
  const showPhase = flag === 'ConfirmAdmission'

  const [applicationID, setApplicationID] = useState('')
  const [phaseID,       setPhaseID]       = useState('-1')
  const [phases,        setPhases]        = useState([])
  const [result,        setResult]        = useState(null)
  const [message,       setMessage]       = useState({ text:'', type:'' })
  const [searching,     setSearching]     = useState(false)
  const [fieldErrors,   setFieldErrors]   = useState({})

  useEffect(() => {
    if (!showPhase) return
    admissionApi.getPhases()
      .then(res => {
        if (res.data.success && res.data.phases?.length > 0) {
          setPhases(res.data.phases)
          const cur    = res.data.currentPhaseID?.toString()
          const exists = res.data.phases.find(p => p.value === cur)
          setPhaseID(exists ? cur : res.data.phases[0]?.value ?? '-1')
        }
      })
      .catch(() => {})
  }, [showPhase])

  const validate = () => {
    const e = {}
    if (!applicationID.trim()) e.applicationID = 'Please Enter Application Number.'
    if (showPhase && (phaseID === '-1' || !phaseID)) e.phaseID = 'Please Select Round.'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSearch = async () => {
    if (!validate()) return
    setSearching(true); setResult(null); setMessage({ text:'', type:'' })
    try {
      const res = await admissionApi.checkApplicationID({
        applicationID: applicationID.trim().toUpperCase(),
        phaseID      : parseInt(phaseID) || 0,
        flag,
      })
      if (res.data.success) setResult(res.data)
      else setMessage({ text: res.data.message || 'No records found.', type:'info' })
    } catch (err) {
      setMessage({ text: err.response?.data?.message ?? 'An error occurred. Please try again.', type:'error' })
    } finally { setSearching(false) }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch() }

  const handleProceed = (proceedUrl) => {
    const match = proceedUrl.match(/href=['"]([^'"]+)['"]/i)
    if (match) {
      const href     = match[1]
      const params   = new URLSearchParams(href.split('?')[1] ?? '')
      const targetFlag = params.get('Flag') ?? flag
      window.location.href = `/college/admission/summary?p1=${params.get('P1')??''}&p2=${params.get('P2')??''}&p3=${params.get('P3')??''}&flag=${targetFlag}`
    }
  }

  const msgStyle = message.type === 'error'
    ? { bg:'#fef2f2', border:'#fecaca', color:'#dc2626', icon:'fa-exclamation-circle' }
    : { bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8', icon:'fa-info-circle' }

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', padding:'28px 20px 48px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:820, margin:'0 auto' }}>

        {/* ── Page header card ──────────────────────────────────────────── */}
        <div style={{ background:cfg.gradient, borderRadius:20, padding:'26px 32px', marginBottom:24, position:'relative', overflow:'hidden', boxShadow:`0 16px 48px rgba(0,0,0,.15)` }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={`fas ${cfg.icon}`} style={{ color:'#fff', fontSize:24 }} />
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 4px' }}>
                Admission Menu
              </p>
              <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:0, lineHeight:1.2 }}>
                {cfg.label}
              </h1>
            </div>
          </div>
        </div>

        {/* ── Search card ───────────────────────────────────────────────── */}
        <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.07)', marginBottom:20 }}>

          {/* Card header */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:4, height:20, borderRadius:99, background:cfg.gradient }} />
            <span style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Search Candidate</span>
          </div>

          <div style={{ padding:'24px' }}>

            {/* Message */}
            {message.text && (
              <div style={{ display:'flex', alignItems:'center', gap:10, background:msgStyle.bg, border:`1px solid ${msgStyle.border}`, color:msgStyle.color, borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13.5, fontWeight:500 }}>
                <i className={`fas ${msgStyle.icon} flex-shrink-0`} />
                {message.text}
              </div>
            )}

            {/* Fields row */}
            <div style={{ display:'grid', gridTemplateColumns: showPhase ? '1fr 1fr' : '1fr', gap:16, marginBottom:20 }}>

              {/* Application ID */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                  Application ID <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <div style={{ position:'relative' }}>
                  <i className="fas fa-id-card" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14 }} />
                  <input
                    value={applicationID}
                    onChange={e => { setApplicationID(e.target.value.toUpperCase()); setFieldErrors(p=>({...p,applicationID:''})) }}
                    onKeyDown={handleKeyDown}
                    maxLength={15}
                    placeholder="Enter Application ID"
                    style={{ width:'100%', paddingLeft:40, paddingRight:14, paddingTop:11, paddingBottom:11, border:`1.5px solid ${fieldErrors.applicationID?'#fca5a5':'#e2e8f0'}`, borderRadius:10, fontSize:14, background: fieldErrors.applicationID?'#fef2f2':'#f8fafc', fontFamily:'inherit', outline:'none', boxSizing:'border-box', fontWeight:600, color:'#0f172a', transition:'border-color .15s,box-shadow .15s' }}
                    onFocus={e => { e.target.style.borderColor=cfg.color; e.target.style.background='#fff'; e.target.style.boxShadow=`0 0 0 3px ${cfg.color}20` }}
                    onBlur={e  => { e.target.style.borderColor=fieldErrors.applicationID?'#fca5a5':'#e2e8f0'; e.target.style.background=fieldErrors.applicationID?'#fef2f2':'#f8fafc'; e.target.style.boxShadow='none' }}
                  />
                </div>
                {fieldErrors.applicationID && (
                  <p style={{ margin:'5px 0 0', fontSize:11, color:'#ef4444', display:'flex', alignItems:'center', gap:4 }}>
                    <i className="fas fa-exclamation-circle" /> {fieldErrors.applicationID}
                  </p>
                )}
              </div>

              {/* Round dropdown — ConfirmAdmission only */}
              {showPhase && (
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                    Round <span style={{ color:'#ef4444' }}>*</span>
                  </label>
                  <div style={{ position:'relative' }}>
                    <i className="fas fa-layer-group" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:13, pointerEvents:'none' }} />
                    <select
                      value={phaseID}
                      onChange={e => { setPhaseID(e.target.value); setFieldErrors(p=>({...p,phaseID:''})) }}
                      disabled={!isAdmin}
                      style={{ width:'100%', paddingLeft:40, paddingRight:14, paddingTop:11, paddingBottom:11, border:`1.5px solid ${fieldErrors.phaseID?'#fca5a5':'#e2e8f0'}`, borderRadius:10, fontSize:14, background:!isAdmin?'#f1f5f9':'#f8fafc', fontFamily:'inherit', outline:'none', boxSizing:'border-box', fontWeight:600, color:!isAdmin?'#94a3b8':'#0f172a', cursor:!isAdmin?'not-allowed':'pointer', appearance:'none' }}>
                      <option value="-1">Select Round</option>
                      {phases.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}
                    </select>
                    <i className="fas fa-chevron-down" style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:11, pointerEvents:'none' }} />
                  </div>
                  {fieldErrors.phaseID && (
                    <p style={{ margin:'5px 0 0', fontSize:11, color:'#ef4444', display:'flex', alignItems:'center', gap:4 }}>
                      <i className="fas fa-exclamation-circle" /> {fieldErrors.phaseID}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Search button */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <button onClick={handleSearch} disabled={searching}
                style={{ display:'flex', alignItems:'center', gap:10, background:cfg.gradient, color:'#fff', border:'none', borderRadius:12, padding:'13px 40px', fontSize:14, fontWeight:700, cursor:searching?'not-allowed':'pointer', opacity:searching?.7:1, fontFamily:'inherit', boxShadow:`0 6px 20px ${cfg.color}40`, transition:'transform .15s,box-shadow .15s' }}
                onMouseEnter={e => { if(!searching){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 28px ${cfg.color}50` } }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 20px ${cfg.color}40` }}>
                {searching
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
                  : <><i className="fas fa-search" /> Search Candidate</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Results card ──────────────────────────────────────────────── */}
        {result && (
          <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.07)', animation:'fadeIn .3s ease' }}>

            {/* Results header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:20, borderRadius:99, background:'linear-gradient(180deg,#059669,#0ea5e9)' }} />
              <span style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Search Results</span>
              <span style={{ marginLeft:'auto', background:'#f0fdf4', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid #bbf7d0' }}>
                {result.items?.length ?? 0} record{result.items?.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* Candidate info row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#f1f5f9', padding:'0 0 1px', margin:'0 0 1px' }}>
              {[
                { label:'Application ID',  value: result.applicationID },
                { label:'Candidate Name',  value: result.candidateName },
              ].map((item, i) => (
                <div key={i} style={{ background:'#f8fafc', padding:'14px 24px' }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 4px' }}>{item.label}</p>
                  <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-.01em' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Results table */}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#0f172a' }}>
                    {['Select','School Name','Course','Status'].map((h, i) => (
                      <th key={i} style={{ padding:'12px 16px', color:'#fff', fontWeight:700, fontSize:11.5, textAlign:i===1?'left':'center', whiteSpace:'nowrap', letterSpacing:'.04em', textTransform:'uppercase', width:i===0?'8%':i===1?'62%':'15%' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i}
                      style={{ borderBottom:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa', transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f0fdf9'}
                      onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <button onClick={() => handleProceed(item.proceedURL)}
                          style={{ background:cfg.gradient, color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 3px 10px ${cfg.color}30`, transition:'transform .15s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                          Select
                        </button>
                      </td>
                      <td style={{ padding:'12px 16px', fontWeight:600, color:'#1e293b', fontSize:13.5 }}>
                        {item.collegeName}
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center', fontWeight:600, color:'#374151', whiteSpace:'nowrap', fontSize:12.5 }}>
                        {item.course}
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center', whiteSpace:'nowrap' }}>
                        <span style={{
                          background : item.courseStatus?.toLowerCase().includes('government') ? '#f0fdf4' : '#eff6ff',
                          color      : item.courseStatus?.toLowerCase().includes('government') ? '#166534' : '#1d4ed8',
                          border     : `1px solid ${item.courseStatus?.toLowerCase().includes('government') ? '#bbf7d0' : '#bfdbfe'}`,
                          borderRadius: 99, padding:'3px 12px', fontSize:11, fontWeight:700,
                        }}>
                          {item.courseStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
