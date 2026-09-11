import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eVerificationApi } from '../../services/api'

/**
 * EVerification CheckApplicationID — mirrors EVerification/CheckApplicationID.aspx
 * Search by ApplicationID → display candidate info → click Verify → allot → go to EVerifyDocuments
 */
export default function EVCheckApplicationID() {
  const navigate                 = useNavigate()
  const [appId,    setAppId]     = useState('')
  const [candidate, setCandidate]= useState(null)
  const [loading,  setLoading]   = useState(false)
  const [allotting,setAllotting] = useState(false)
  const [error,    setError]     = useState('')

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setError('Please enter Application ID.'); return }
    setLoading(true); setError(''); setCandidate(null)
    try {
      const r = await eVerificationApi.checkApplication(appId.trim())
      if (r.data.success) {
        setCandidate(r.data)
        if (!r.data.isFormLocked)
          setError('Application Form is not locked. Cannot proceed with verification.')
      } else {
        setError(r.data.message || 'Candidate not found.')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setLoading(false) }
  }

  const handleVerify = async () => {
    if (!candidate?.candidateID) return
    setAllotting(true); setError('')
    try {
      const r = await eVerificationApi.allot(candidate.candidateID)
      if (r.data.success) {
        navigate(`/everification/verify/${candidate.candidateID}`)
      } else {
        setError(r.data.message || 'Failed to allot candidate.')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setAllotting(false) }
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Search form */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ background:V.navy, padding:'10px 18px' }}>
            <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
              <i className="fas fa-search" style={{ marginRight:8 }} />Verify Document — Search by Application ID
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

        {/* Candidate info */}
        {candidate && candidate.isFormLocked && (
          <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ background:V.navy, padding:'10px 18px' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>Candidate Information</h5>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:V.border, border:`1px solid ${V.border}`, borderRadius:8, overflow:'hidden', marginBottom:20 }}>
                {[
                  ['Application ID',  candidate.applicationID],
                  ['Candidate Name',  candidate.candidateName],
                  ['Course',          candidate.course],
                  ['Mobile No.',      candidate.mobileNo],
                  ['Form Status',     'Locked ✓'],
                ].map(([label, val], i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr', background:V.white, borderBottom:`1px solid ${V.border}` }}>
                    <div style={{ padding:'10px 14px', fontSize:13, color:V.muted, fontWeight:500, background:'#f8fafc', borderRight:`1px solid ${V.border}` }}>{label}</div>
                    <div style={{ padding:'10px 14px', fontSize:13, color:'#0f172a', fontWeight:600 }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={handleVerify} disabled={allotting}
                  style={{ background: allotting?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'10px 28px', borderRadius:7, fontSize:14, fontWeight:700, cursor: allotting?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>{ if(!allotting) e.currentTarget.style.background='#047857' }}
                  onMouseLeave={e=>{ if(!allotting) e.currentTarget.style.background='#059669' }}>
                  {allotting ? 'Processing...' : <><i className="fas fa-check-circle" />Verify Documents</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
