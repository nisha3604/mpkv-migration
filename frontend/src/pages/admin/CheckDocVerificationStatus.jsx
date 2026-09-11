import { useState, useEffect } from 'react'
import { candidateUtilsApi } from '../../services/api'

/**
 * CheckDocVerificationStatus — mirrors Admin/CheckDocumentVerificationStatus.aspx.
 *
 * Flow:
 *  1. Enter Application ID → Search → resolves CandidateID
 *  2. Shows read-only document grid:
 *     Sr. | Document Name (* compulsory) | Uploaded | Status | Comments | View
 *
 * SPs: Base_GetCandidateID, Base_GetCandidateName, Base_GetApplicationID,
 *      ApplicationForm_GetRequiredDocumentsList
 */
export default function CheckDocVerificationStatus() {
  const [appId,     setAppId]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [data,      setData]      = useState(null)
  const [viewUrl,   setViewUrl]   = useState(null)

  // Auto-search if appId passed via query param (from EVC/Admin CandidateAction)
  const [searchParams] = (typeof window !== 'undefined' ? [new URLSearchParams(window.location.search)] : [new URLSearchParams()])
  useEffect(() => {
    const paramAppId = searchParams.get('appId')
    if (paramAppId) { setAppId(paramAppId); doSearch(paramAppId) }
  }, [])

  const doSearch = async (id) => {
    if (!id?.trim()) return
    setSearching(true); setSearchErr(''); setData(null); setViewUrl(null)
    try {
      const r1 = await candidateUtilsApi.getPasswordInfo(id.trim().toUpperCase())
      if (!r1.data.success) { setSearchErr(r1.data.message || 'Invalid Application ID.'); return }
      const r2 = await candidateUtilsApi.getDocStatus(r1.data.candidateID)
      if (r2.data.success) setData(r2.data)
      else setSearchErr(r2.data.message || 'No documents found.')
    } catch { setSearchErr('Server error. Please try again.') }
    finally { setSearching(false) }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setSearchErr('Please Enter Application ID.'); return }
    doSearch(appId)
  }

  const resolveUrl = (url) => {
    if (!url) return ''
    let cur = url
    for (let i = 0; i < 5; i++) {
      if (cur.includes('ViewFile.aspx') && cur.includes('FileURL=')) {
        const m = cur.match(/FileURL=([^&\s]+)/); if (!m?.[1]) break
        const x = decodeURIComponent(m[1]); if (x === cur) break; cur = x
      } else break
    }
    return cur
  }

  const V = { navy:'#14212e', primary:'#059669', danger:'#dc2626', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d' }
  const cardHeader = (text) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
    </div>
  )
  const statusBadge = (status) => {
    const isVerified = status?.toLowerCase() === 'verified'
    return (
      <span style={{ background:isVerified?'#d1fae5':'#fee2e2', color:isVerified?'#065f46':'#991b1b', border:`1px solid ${isVerified?'#86efac':'#fca5a5'}`, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
        {status || 'Pending'}
      </span>
    )
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Search form */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Check Document Verification Status')}
          <div style={{ padding:'20px', background:V.white }}>
            <form onSubmit={handleSearch}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'flex-end', maxWidth:600 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>
                    Application ID <span style={{ color:V.danger }}>*</span>
                  </label>
                  <input value={appId} onChange={e => setAppId(e.target.value.toUpperCase())}
                    placeholder="Enter Application ID"
                    style={{ width:'100%', padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=V.primary}
                    onBlur={e=>e.target.style.borderColor=V.border}/>
                  {searchErr && <div style={{ color:V.danger, fontSize:12, marginTop:4 }}>{searchErr}</div>}
                </div>
                <button type="submit" disabled={searching}
                  style={{ background:searching?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'8px 24px', borderRadius:5, fontSize:13.5, fontWeight:700, cursor:searching?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8, marginBottom:searchErr?20:0 }}>
                  {searching ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Searching...</> : <><i className="fas fa-search"/>Search</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Document grid */}
        {data && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader(`Documents Verification Status — ${data.candidateName} (${data.applicationID})`)}
            <div style={{ background:V.white }}>
              {data.documents.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:V.muted, fontSize:13 }}>No documents found.</div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:V.navy }}>
                          {['Sr.','Document Name','Uploaded','Verification Status','Comments','View'].map((h,i) => (
                            <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===1?'left':'center', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.documents.map((doc, i) => {
                          const isCompulsory = doc.isDocumentCompulsory === 'YES' || doc.isDocumentCompulsory === '1'
                          const isUploaded   = doc.isDocumentUploaded   === 'YES' || doc.documentUploadedURL?.length > 0
                          const docUrl = resolveUrl(doc.documentUploadedURL)
                          return (
                            <tr key={doc.documentID} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}>
                              <td style={{ padding:'9px 12px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                              <td style={{ padding:'9px 12px', fontWeight:600 }}>
                                {isCompulsory && <span style={{ color:V.danger, marginRight:3 }}>*</span>}
                                <span dangerouslySetInnerHTML={{ __html: doc.documentName }}/>
                              </td>
                              <td style={{ padding:'9px 12px', textAlign:'center' }}>
                                <span style={{ background:isUploaded?'#d1fae5':'#fee2e2', color:isUploaded?'#065f46':'#991b1b', border:`1px solid ${isUploaded?'#86efac':'#fca5a5'}`, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
                                  {isUploaded ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td style={{ padding:'9px 12px', textAlign:'center' }}>{statusBadge(doc.documentVerificationStatus)}</td>
                              <td style={{ padding:'9px 12px', color:V.muted, fontSize:12 }}>{doc.documentVerificationComments || '—'}</td>
                              <td style={{ padding:'9px 12px', textAlign:'center' }}>
                                {docUrl ? (
                                  <button onClick={() => setViewUrl(docUrl)} title="View Document"
                                    style={{ background:'#0d6efd', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                                    <i className="fas fa-search"/>
                                  </button>
                                ) : <span style={{ color:'#d1d5db' }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'8px 14px', background:V.bg, borderTop:`1px solid ${V.border}`, fontSize:12, color:V.muted }}>
                    <span style={{ color:V.danger }}>*</span> Compulsory Document
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document preview modal */}
      {viewUrl && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:9999, display:'flex', flexDirection:'column' }}
          onClick={e => { if (e.target === e.currentTarget) setViewUrl(null) }}>
          <div style={{ background:V.navy, padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Document Preview</span>
            <button onClick={() => setViewUrl(null)}
              style={{ background:'#dc2626', color:'#fff', border:'none', padding:'4px 12px', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <iframe src={`/api/file/preview?url=${encodeURIComponent(viewUrl)}`}
              title="Document"
              style={{ width:'100%', height:'100%', border:'none' }}/>
          </div>
        </div>
      )}
    </div>
  )
}
