import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { candidateUtilsApi } from '../../services/api'

/**
 * SearchCandidate — mirrors Admin/SearchCandidate.aspx.
 * Also used as the entry point for Change Mobile/Email, Change Security Question,
 * Check Payment History, Print Application Form — admin searches for candidate first,
 * then views their full application where those actions are available.
 * SP: Base_SearchCandidate(@SearchCandidateBy, @SearchQuery)
 */
const SEARCH_OPTIONS = [
  { value:'ApplicationID', label:'Application ID'         },
  { value:'CandidateName', label:'Candidate Name'         },
  { value:'MobileNo',      label:'Registered Mobile No.'  },
  { value:'EMailID',       label:'Registered E-Mail ID'   },
]

// Context hints shown at top depending on which menu item navigated here
const ACTION_HINTS = {
  '/admin/candidates/change-mobile':     { icon:'fa-mobile-alt',  color:'#0ea5e9', text:'Change Mobile No. / E-Mail ID — search for the candidate first, then use the action from their application view.' },
  '/admin/candidates/change-security':   { icon:'fa-key',         color:'#7c3aed', text:'Change Security Question — search for the candidate first, then use the action from their application view.' },
  '/admin/candidates/payment-history':   { icon:'fa-rupee-sign',  color:'#059669', text:'Check Payment History — search for the candidate first to view their payment records.' },
  '/admin/candidates/print-application': { icon:'fa-print',       color:'#2563eb', text:'Print Application Form — search for the candidate first, then print from their application view.' },
}

export default function SearchCandidate() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const hint         = ACTION_HINTS[location.pathname]
  const [searchBy,   setSearchBy]   = useState('ApplicationID')
  const [searchText, setSearchText] = useState('')
  const [items,      setItems]      = useState([])
  const [searched,   setSearched]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchText.trim()) { setError('Please enter search text.'); return }
    setLoading(true); setError(''); setItems([]); setSearched(false)
    try {
      const res = await candidateUtilsApi.search({ searchBy, searchText: searchText.trim() })
      if (res.data.success) { setItems(res.data.items ?? []); setSearched(true) }
      else setError(res.data.message || 'No records found.')
    } catch (err) { setError(err.response?.data?.message || err.message || 'Search failed. Please try again.') }
    finally { setLoading(false) }
  }

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }
  const cardHeader = (text) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
    </div>
  )
  const label = SEARCH_OPTIONS.find(o => o.value === searchBy)?.label ?? 'Search Text'

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Action context hint — shown when navigated from a specific menu item */}
        {hint && (
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:7, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:10, color:'#1e40af' }}>
            <i className={`fas ${hint.icon}`} style={{ color:hint.color, fontSize:15, flexShrink:0 }}/>
            {hint.text}
          </div>
        )}

        {/* Search form */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Search Candidate')}
          <div style={{ padding:'20px', background:V.white }}>
            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:13 }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
              </div>
            )}
            <form onSubmit={handleSearch}>
              <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16, alignItems:'flex-end' }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Search Student By</label>
                  <select value={searchBy} onChange={e => { setSearchBy(e.target.value); setSearchText('') }}
                    style={{ width:'100%', padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
                    {SEARCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Enter {label} <span style={{ color:V.danger }}>*</span></label>
                  <div style={{ display:'flex', gap:10 }}>
                    <input value={searchText} onChange={e => setSearchText(e.target.value)}
                      placeholder={`Enter ${label}...`}
                      style={{ flex:1, padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none' }}
                      onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor=V.border}/>
                    <button type="submit" disabled={loading}
                      style={{ background:loading?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'7px 24px', borderRadius:5, fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}>
                      {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Searching...</> : <><i className="fas fa-search"/>Search</>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader(`Search Results (${items.length} record${items.length !== 1 ? 's' : ''})`)}
            <div style={{ background:V.white }}>
              {items.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:V.muted, fontSize:13 }}>No records found.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:V.navy }}>
                        {['Sr.','Application ID','Candidate Name','Gender','Date of Birth','Mobile No.','E-Mail ID','Action'].map((h,i) => (
                          <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===0||i===7?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={item.candidateID} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}
                          onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#f8f9fa'}>
                          <td style={{ padding:'8px 12px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                          <td style={{ padding:'8px 12px' }}>
                            <button onClick={() => navigate(`/admin/candidates/view/${item.applicationID}`, { state: { applicationID: item.applicationID, candidateName: item.candidateName } })}
                              style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontWeight:700, color:'#0d6efd', fontSize:13, fontFamily:'inherit', textDecoration:'underline', textDecorationStyle:'dotted' }}>
                              {item.applicationID}
                            </button>
                          </td>
                          <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.candidateName}</td>
                          <td style={{ padding:'8px 12px', color:V.muted }}>{item.gender}</td>
                          <td style={{ padding:'8px 12px', color:V.muted }}>{item.dob}</td>
                          <td style={{ padding:'8px 12px', color:V.muted }}>{item.mobileNo}</td>
                          <td style={{ padding:'8px 12px', color:V.muted, fontSize:12 }}>{item.eMailID}</td>
                          <td style={{ padding:'8px 12px', textAlign:'center' }}>
                            <button onClick={() => navigate(`/admin/candidates/view/${item.applicationID}`, { state: { applicationID: item.applicationID, candidateName: item.candidateName } })}
                              style={{ background:'#059669', color:'#fff', border:'none', padding:'4px 14px', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}
                              onMouseEnter={e=>e.currentTarget.style.background='#047857'}
                              onMouseLeave={e=>e.currentTarget.style.background='#059669'}>
                              <i className="fas fa-eye" style={{ fontSize:11 }}/>View
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
        )}
      </div>
    </div>
  )
}
