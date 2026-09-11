import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { eVerificationApi } from '../../services/api'

/**
 * CandidateListForEVerification — mirrors CandidateListForEVerification.aspx
 * SP: EV_GetCandidateListForEVerification(@ApplicationStatus, @UserLoginID)
 * Filter by status dropdown → list → click Verify → allot → go to EVerifyDocuments
 */
const STATUS_OPTIONS = [
  { value:'',  label:'-- Select Status --'   },
  { value:'N', label:'Not Verified'          },
  { value:'P', label:'Re-Uploaded'           },
  { value:'R', label:'Partially Verified'    },
  { value:'F', label:'Fully Verified'        },
]

export default function CandidateList() {
  const navigate                   = useNavigate()
  const [searchParams]             = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [items,     setItems]      = useState([])
  const [loading,   setLoading]    = useState(false)
  const [error,     setError]      = useState('')
  const [allotting, setAllotting]  = useState(null)

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  useEffect(() => {
    if (status) load(status)
  }, [status])

  const load = (st) => {
    setLoading(true); setError(''); setItems([])
    eVerificationApi.getCandidates(st)
      .then(r => { if (r.data.success) setItems(r.data.items ?? []); else setError(r.data.message || 'No records found.') })
      .catch(() => setError('Server error. Please refresh.'))
      .finally(() => setLoading(false))
  }

  const handleVerify = async (item) => {
    // Check form is locked first (done in service), then allot and navigate
    setAllotting(item.candidateID)
    try {
      const r = await eVerificationApi.allot(item.candidateID)
      if (r.data.success) {
        navigate(`/everification/verify/${item.candidateID}?status=${status}`)
      } else {
        setError(r.data.message || 'Failed to allot candidate.')
      }
    } catch {
      setError('Server error. Please try again.')
    } finally { setAllotting(null) }
  }

  const handleExport = () => {
    const rows = items.map((it, i) =>
      `<tr><td>${i+1}</td><td>${it.applicationID}</td><td>${it.candidateName}</td><td>${it.course}</td><td>${it.mobileNo}</td><td>${it.status}</td></tr>`
    ).join('')
    const html = `<table border="1"><thead><tr><th>Sr.</th><th>Application ID</th><th>Candidate Name</th><th>Course</th><th>Mobile</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='CandidateListEVerification.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
            <i className="fas fa-list" style={{ marginRight:8 }} />Candidate List for e-Verification
          </h5>
          <button onClick={handleExport} disabled={items.length === 0}
            style={{ background:'#dc2626', color:'#fff', border:'none', padding:'6px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
            <i className="fas fa-file-excel" />Export
          </button>
        </div>

        {/* Filter */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#374151', flexShrink:0 }}>Application Status:</label>
          <select value={status} onChange={e => {
            const val = e.target.value
            setStatus(val)
            navigate(`/everification/candidates?status=${val}`, { replace: true })
          }}
            style={{ padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', minWidth:220, outline:'none', cursor:'pointer' }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderTop:'none', color:V.danger, padding:'10px 18px', fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
          </div>
        )}

        {/* Table */}
        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          {!status ? (
            <div style={{ textAlign:'center', padding:48, color:V.muted, fontSize:13, background:V.white }}>
              Select a status above to view candidates.
            </div>
          ) : loading ? (
            <div style={{ textAlign:'center', padding:48, background:V.white }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:V.muted, fontSize:13 }}>Loading...</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    {['Sr.','Application ID','Candidate Name','Course','Mobile No.','Status','Action'].map((h,i) => (
                      <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===0||i===6?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:36, color:V.muted }}>No records found.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.candidateID} style={{ background:i%2===0?V.white:V.bg, borderBottom:`1px solid ${V.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?V.white:V.bg}>
                      <td style={{ padding:'8px 12px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                      <td style={{ padding:'8px 12px', fontWeight:600, color:'#2563eb' }}>{item.applicationID}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.candidateName}</td>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{item.course}</td>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{item.mobileNo}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 10px', borderRadius:20,
                          background: item.status==='F'?'#dcfce7':item.status==='R'?'#fef3c7':item.status==='P'?'#ede9fe':'#fef2f2',
                          color:      item.status==='F'?'#166534':item.status==='R'?'#92400e':item.status==='P'?'#6d28d9':'#dc2626',
                          border:    `1px solid ${item.status==='F'?'#bbf7d0':item.status==='R'?'#fde68a':item.status==='P'?'#ddd6fe':'#fecaca'}` }}>
                          {item.status==='F'?'Fully Verified':item.status==='R'?'Partially Verified':item.status==='P'?'Re-Uploaded':'Not Verified'}
                        </span>
                      </td>
                      <td style={{ padding:'7px 12px', textAlign:'center' }}>
                        <button onClick={() => handleVerify(item)} disabled={allotting === item.candidateID}
                          style={{ background:'#059669', color:'#fff', border:'none', padding:'4px 14px', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}
                          onMouseEnter={e=>e.currentTarget.style.background='#047857'}
                          onMouseLeave={e=>e.currentTarget.style.background='#059669'}>
                          {allotting === item.candidateID ? '...' : <><i className="fas fa-check-circle" style={{ fontSize:11 }} />Verify</>}
                        </button>
                      </td>
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
