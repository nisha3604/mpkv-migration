import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { eVerificationApi } from '../../services/api'

/**
 * EVerifyDocuments — mirrors EVerification/EVerifyDocuments.aspx
 * Loads candidate application summary + required documents.
 * EVC coordinator marks each doc as Verified/Not Verified with comments.
 * SP: ApplicationForm_GetFormSummary (for doc list) + EV_SaveDocumentsEVerificationStatus (save)
 */

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

export default function EVerifyDocuments() {
  const { candidateId }          = useParams()
  const [searchParams]           = useSearchParams()
  const navigate                 = useNavigate()

  const [data,    setData]       = useState(null)
  const [docs,    setDocs]       = useState([])   // mutable verification state
  const [loading, setLoading]    = useState(true)
  const [saving,  setSaving]     = useState(false)
  const [error,   setError]      = useState('')
  const [success, setSuccess]    = useState('')

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  useEffect(() => {
    if (!candidateId) { setError('No candidate ID.'); setLoading(false); return }
    eVerificationApi.getDocuments(candidateId)
      .then(r => {
        if (r.data.success) {
          setData(r.data)
          // Initialise verification state for each document
          setDocs(r.data.documents.map(doc => ({
            documentID         : doc.documentID,
            documentName       : doc.documentName,
            isCompulsory       : doc.isDocumentCompulsory,
            isUploaded         : doc.isDocumentUploaded?.toUpperCase() === 'YES',
            uploadedURL        : doc.documentUploadedURL,
            // Pre-fill existing status: "Verified" → "Y", "Not Verified" → "N", else "N"
            verificationStatus : doc.documentVerificationStatus === 'Verified' ? 'Y' : 'N',
            comments           : doc.documentVerificationStatus === 'Verified' ? '' : (doc.verificationComments || (doc.isDocumentUploaded?.toUpperCase() !== 'YES' ? 'Document not uploaded.' : '')),
          })))
        } else {
          setError(r.data.message || 'Failed to load documents.')
        }
      })
      .catch(() => setError('Server error. Please try again.'))
      .finally(() => setLoading(false))
  }, [candidateId])

  const updateDoc = (idx, field, val) => {
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d))
  }

  const handleSave = async () => {
    setError(''); setSuccess('')
    // Validation — rejected docs need comments
    for (const d of docs) {
      if (d.verificationStatus === 'N' && !d.comments.trim()) {
        setError(`Please enter comments for "${d.documentName}".`); return
      }
    }
    setSaving(true)
    try {
      const r = await eVerificationApi.saveVerification({
        candidateID: parseInt(candidateId),
        documents: docs.map(d => ({
          documentID          : d.documentID,
          verificationStatus  : d.verificationStatus,
          verificationComments: d.comments,
        }))
      })
      if (r.data.success) {
        setSuccess('Document verification saved successfully.')
        setTimeout(() => {
          const status = searchParams.get('status') || ''
          navigate(status ? `/everification/candidates?status=${status}` : '/everification/candidates')
        }, 1800)
      } else {
        setError(r.data.message || 'Save failed. Please try again.')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error && !data) return (
    <div style={{ padding:'28px', background:V.bg }}>
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:8, padding:'14px 18px', marginBottom:16, fontSize:13 }}>
        <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
      </div>
      <button onClick={() => navigate(-1)}
        style={{ background:V.navy, color:'#fff', border:'none', padding:'8px 18px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
        ← Back
      </button>
    </div>
  )

  const photoUrl = resolveUrl(data?.photoURL)
  const signUrl  = resolveUrl(data?.signURL)

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
              <i className="fas fa-file-alt" style={{ marginRight:8 }} />e-Verify Documents
            </h5>
            <p style={{ color:'#94a3b8', margin:'3px 0 0', fontSize:12 }}>
              {data?.candidateName} &nbsp;·&nbsp; {data?.applicationID}
            </p>
          </div>
          {/* Photo */}
          {photoUrl && (
            <img src={photoUrl} alt="Photo" style={{ width:52, height:64, objectFit:'cover', border:'2px solid rgba(255,255,255,.3)', borderRadius:4 }} />
          )}
        </div>

        {/* Alerts */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', padding:'0 18px' }}>
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 14px', margin:'14px 0', fontSize:13 }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
            </div>
          )}
          {success && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', borderRadius:6, padding:'8px 14px', margin:'14px 0', fontSize:13 }}>
              <i className="fas fa-check-circle" style={{ marginRight:6 }} />{success}
            </div>
          )}
        </div>

        {/* Document verification table */}
        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:V.navy }}>
                {['Sr.','Document Name','View','Verification Status','Comments'].map((h,i) => (
                  <th key={i} style={{ padding:'9px 14px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===0||i===2?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={i} style={{ background:i%2===0?V.white:V.bg, borderBottom:`1px solid ${V.border}` }}>
                  {/* Sr */}
                  <td style={{ padding:'10px 14px', textAlign:'center', color:V.muted }}>{i+1}.</td>

                  {/* Document Name */}
                  <td style={{ padding:'10px 14px', fontWeight:500 }}>
                    {doc.isCompulsory?.toUpperCase() === 'YES' && (
                      <span style={{ color:'#dc2626', fontWeight:700, marginRight:4 }}>*</span>
                    )}
                    {doc.documentName}
                    {!doc.isUploaded && (
                      <span style={{ marginLeft:8, fontSize:11, color:'#dc2626', fontWeight:600 }}>(Not Uploaded)</span>
                    )}
                  </td>

                  {/* View button */}
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>
                    {doc.isUploaded && doc.uploadedURL ? (
                      <a href={`/api/file/preview?url=${encodeURIComponent(resolveUrl(doc.uploadedURL))}`} target="_blank" rel="noreferrer"
                        style={{ background:'#2563eb', color:'#fff', border:'none', padding:'4px 12px', borderRadius:5, fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'none', display:'inline-block' }}>
                        <i className="fas fa-eye" style={{ marginRight:4 }} />View
                      </a>
                    ) : (
                      <span style={{ color:V.muted, fontSize:12 }}>—</span>
                    )}
                  </td>

                  {/* Verification Status dropdown */}
                  <td style={{ padding:'10px 14px' }}>
                    <select value={doc.verificationStatus}
                      onChange={e => updateDoc(i, 'verificationStatus', e.target.value)}
                      disabled={!doc.isUploaded}
                      style={{ padding:'5px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13, fontFamily:'inherit', outline:'none', background: doc.verificationStatus==='Y'?'#f0fdf4':doc.isUploaded?'#fef2f2':'#f8fafc', color: doc.verificationStatus==='Y'?'#166534':'#dc2626', cursor: doc.isUploaded?'pointer':'not-allowed' }}>
                      <option value="Y">Verified</option>
                      <option value="N">Not Verified</option>
                    </select>
                  </td>

                  {/* Comments */}
                  <td style={{ padding:'10px 14px' }}>
                    <input type="text" value={doc.comments}
                      onChange={e => updateDoc(i, 'comments', e.target.value)}
                      placeholder={doc.verificationStatus==='N' ? 'Required for rejection' : 'Optional comments'}
                      style={{ width:'100%', padding:'5px 10px', border:`1px solid ${doc.verificationStatus==='N' && !doc.comments.trim() ? '#fecaca' : V.border}`, borderRadius:5, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor=V.border} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer buttons */}
          <div style={{ padding:'14px 18px', borderTop:`1px solid ${V.border}`, background:V.white, display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => navigate(-1)}
              style={{ background:'#f1f5f9', border:'none', color:'#374151', padding:'9px 22px', borderRadius:7, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ background: saving?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'9px 28px', borderRadius:7, fontSize:13.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}
              onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#047857' }}
              onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background='#059669' }}>
              {saving ? 'Saving...' : <><i className="fas fa-save" />Save Verification</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
