import { useState, useEffect } from 'react'
import { eVerificationApi } from '../../services/api'

/**
 * CandidatesEligibleForEVerification — mirrors Reports/CandidatesEligibleForEVerification.aspx
 * SP: Report_GetCandidatesEligibleForEverification(@UserLoginID, @CourseID)
 * Columns: AppliedCourse, ApplicationID, CandidateName, Category, AssignedTo, VerificationStatus
 */
export default function CandidatesEligibleForEVerification() {
  const [courseId, setCourseId] = useState(0)
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  const load = (cid) => {
    setLoading(true); setError('')
    eVerificationApi.getEligibleCandidates(cid)
      .then(r => { if (r.data.success) setItems(r.data.items ?? []); else setError(r.data.message || 'No records.') })
      .catch(() => setError('Server error. Please refresh.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  const handleExport = () => {
    const rows = items.map((it, i) => `
      <tr><td>${i+1}</td><td>${it.appliedCourse}</td><td>${it.applicationID}</td>
      <td>${it.candidateName}</td><td>${it.category}</td>
      <td>${it.assignedTo}</td><td>${it.verificationStatus}</td></tr>`).join('')
    const html = `<table border="1"><thead><tr>
      <th>Sr.</th><th>Applied Course</th><th>Application ID</th><th>Candidate Name</th>
      <th>Category</th><th>Assigned To</th><th>Verification Status</th>
    </tr></thead><tbody>${rows}</tbody></table>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='CandidatesEligibleForEVerification.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const statusBadge = (status) => {
    const s = status?.trim()
    const bg = s==='Fully Verified'?'#dcfce7':s==='Partially Verified'?'#fef3c7':s==='Re-Uploaded'?'#ede9fe':'#fef2f2'
    const c  = s==='Fully Verified'?'#166534':s==='Partially Verified'?'#92400e':s==='Re-Uploaded'?'#6d28d9':'#dc2626'
    const b  = s==='Fully Verified'?'#bbf7d0':s==='Partially Verified'?'#fde68a':s==='Re-Uploaded'?'#ddd6fe':'#fecaca'
    return <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 10px', borderRadius:20, background:bg, color:c, border:`1px solid ${b}` }}>{s||'—'}</span>
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
            <i className="fas fa-list" style={{ marginRight:8 }} />Candidates Eligible for e-Verification
          </h5>
          <button onClick={handleExport} disabled={items.length === 0}
            style={{ background:'#dc2626', color:'#fff', border:'none', padding:'6px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
            <i className="fas fa-file-excel" />Export
          </button>
        </div>

        {/* Course filter */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#374151', flexShrink:0 }}>Course:</label>
          <select value={courseId} onChange={e => { const v = Number(e.target.value); setCourseId(v); load(v) }}
            style={{ padding:'6px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
            <option value={0}>All Courses</option>
            <option value={1}>Diploma in Agriculture Course</option>
            <option value={2}>Agriculture Polytechnic Course</option>
            <option value={3}>Mali Training Course</option>
          </select>
          <span style={{ fontSize:12.5, color:V.muted }}>{items.length} record{items.length !== 1 ? 's' : ''}</span>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderTop:'none', color:V.danger, padding:'10px 18px', fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
          </div>
        )}

        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:48, background:V.white }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:V.muted, fontSize:13 }}>Loading...</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    {['Sr.','Applied Course','Application ID','Candidate Name','Category','Assigned To','Verification Status'].map((h,i) => (
                      <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===0?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:36, color:V.muted }}>No records found.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={i} style={{ background:i%2===0?V.white:V.bg, borderBottom:`1px solid ${V.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?V.white:V.bg}>
                      <td style={{ padding:'8px 12px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                      <td style={{ padding:'8px 12px', color:V.muted, fontSize:12 }}>{item.appliedCourse}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600, color:'#2563eb' }}>{item.applicationID}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.candidateName}</td>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{item.category}</td>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{item.assignedTo || '--'}</td>
                      <td style={{ padding:'8px 12px' }}>{statusBadge(item.verificationStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
