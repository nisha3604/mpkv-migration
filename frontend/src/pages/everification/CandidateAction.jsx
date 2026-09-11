import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateUtilsApi } from '../../services/api'

/**
 * EVC Candidate Action — mirrors Admin/CheckApplicationID.aspx for EVC users.
 * Used for: Print Application Form, Check Doc Verification Status,
 *           Change Mobile/Email, Change Security Question, Reset Password flags.
 *
 * EVC users search by Application ID → find candidate → click the action.
 * Print Application Form → navigates to /everification/candidate-action/view/:appId
 * which shows CandidateApplicationView (read-only, same as admin view).
 */
export default function EVCCandidateAction() {
  const navigate                 = useNavigate()
  const [appId,    setAppId]     = useState('')
  const [candidate, setCandidate]= useState(null)
  const [loading,  setLoading]   = useState(false)
  const [error,    setError]     = useState('')

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setError('Please enter Application ID.'); return }
    setLoading(true); setError(''); setCandidate(null)
    try {
      const r = await candidateUtilsApi.getPasswordInfo(appId.trim())
      if (r.data.success) {
        setCandidate(r.data)
      } else {
        setError(r.data.message || 'Candidate not found.')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setLoading(false) }
  }

  const actions = candidate ? [
    {
      label: 'Print Application Form',
      icon:  'fa-print',
      color: '#059669',
      desc:  'View and print the locked application form',
      onClick: () => window.open(`/candidate/application-form/print?appId=${candidate.applicationID}`, '_blank')
    },
    {
      label: 'Document Verification Status',
      icon:  'fa-file-alt',
      color: '#2563eb',
      desc:  'Check the document verification status',
      onClick: () => navigate(`/everification/candidate-action/doc-status?appId=${candidate.applicationID}`)
    },
  ] : []

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Search form */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ background:V.navy, padding:'10px 18px' }}>
            <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
              <i className="fas fa-search" style={{ marginRight:8 }} />Candidate Application — Search by Application ID
            </h5>
          </div>
          <div style={{ padding:'20px', background:V.white }}>
            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:13 }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
              </div>
            )}
            <form onSubmit={handleSearch}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>
                    Application ID <span style={{ color:V.danger }}>*</span>
                  </label>
                  <input value={appId} onChange={e => setAppId(e.target.value)}
                    placeholder="Enter Application ID..."
                    style={{ width:'100%', padding:'8px 12px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor=V.border} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ background: loading?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'8px 24px', borderRadius:5, fontSize:13.5, fontWeight:700, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Searching...</> : <><i className="fas fa-search" />Search</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Candidate info + actions */}
        {candidate && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ background:V.navy, padding:'10px 18px' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>Candidate Information</h5>
            </div>
            <div style={{ padding:'20px', background:V.white }}>
              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:V.border, border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:20 }}>
                {[
                  ['Application ID',  candidate.applicationID],
                  ['Candidate Name',  candidate.candidateName],
                  ['Current Password','(hidden for security)'],
                ].map(([label, val], i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr', background:V.white,
                    borderBottom:`1px solid ${V.border}`, borderLeft: i%2===1 ? `1px solid ${V.border}` : 'none' }}>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.muted, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                    <div style={{ padding:'10px 14px', fontSize:13, color:'#0f172a', fontWeight:600 }}>{val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {actions.map((action, i) => (
                  <button key={i} onClick={action.onClick}
                    style={{ display:'flex', alignItems:'center', gap:14, background:'#f8fafc', border:`1.5px solid ${V.border}`, borderRadius:12, padding:'16px 18px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${action.color}10`; e.currentTarget.style.borderColor=`${action.color}50`; e.currentTarget.style.transform='translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform='none' }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`${action.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <i className={`fas ${action.icon}`} style={{ color:action.color, fontSize:18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{action.label}</div>
                      <div style={{ fontSize:12, color:V.muted, marginTop:3 }}>{action.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
