import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const API_BASE = 'http://localhost:7001'
const toUrl = u => !u ? '' : (u.startsWith('http') ? u : `${API_BASE}${u}`)

/**
 * Upload Required Documents — exact UI match to UploadRequiredDocuments.aspx
 *
 * Layout:
 *   step-bar (Documents Upload = active)
 *   doc-card
 *     doc-card-header : "Upload Required Documents"
 *     note-bar        : amber note about mandatory docs
 *     doc-table       : Sr.No | Document Name | Status | Upload | View | Delete
 *     hint-note       : "View and Delete become active once uploaded"
 *     doc-footer      : uploaded count | ← Back  Save & Next → | spacer
 *
 *   Upload Modal: Document info → DocumentNo + IssueDate (optional) → file picker → Upload
 *   View Modal  : iframe to view uploaded document
 *   Delete confirm modal
 *
 * Logic:
 *   - Upload button shown only when NOT uploaded (mirrors btnUpload.Visible)
 *   - View/Delete shown only when uploaded (mirrors btnView/btnDelete.Visible)
 *   - Status badge: Pending / Uploaded (same as lblStatus)
 *   - RequiresDocumentDetails = false for DocIDs 1,2,4,14,15,19,21,24 (same as old JS)
 *   - btnProceed disabled until AllCompulsoryUploaded = true
 */
export default function Documents() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [docs,        setDocs]        = useState([])
  const [totalMand,   setTotalMand]   = useState(0)
  const [uploadedMand,setUploadedMand]= useState(0)
  const [allUploaded, setAllUploaded] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [appId,       setAppId]       = useState('')
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)

  // ── Upload modal state ───────────────────────────────────────────────────
  const [modal,       setModal]       = useState(null)  // selected doc
  const [docNo,       setDocNo]       = useState('')
  const [issueDate,   setIssueDate]   = useState('')
  const [uploadFile,  setUploadFile]  = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [modalError,  setModalError]  = useState('')
  const fileInputRef = useRef(null)

  // ── View modal state ─────────────────────────────────────────────────────
  const [viewDoc, setViewDoc] = useState(null)  // { name, url }

  // ── Delete confirm modal ──────────────────────────────────────────────────
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadDocs = () =>
    applicationFormApi.getDocuments()
      .then(res => {
        setDocs(res.data.documents ?? [])
        setTotalMand(res.data.totalMandatory ?? 0)
        setUploadedMand(res.data.uploadedMandatory ?? 0)
        setAllUploaded(res.data.allCompulsoryUploaded ?? false)
      })

  useEffect(() => {
    setAppId(user?.userLoginID ?? '')
    loadDocs()
      .catch(err => {
        // Show actual server error so we can diagnose it
        const msg = err.response?.data?.message
          ?? err.response?.data
          ?? err.message
          ?? 'Failed to load documents. Please refresh.'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      })
      .finally(() => setPageLoading(false))
  }, [])

  // ── Open upload modal ─────────────────────────────────────────────────────
  const openUpload = doc => {
    setModal(doc)
    setDocNo(''); setIssueDate(''); setUploadFile(null); setModalError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Handle upload ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) { setModalError('Please select a file to upload.'); return }
    if (modal.requiresDocumentDetails && (!docNo.trim() || !issueDate.trim())) {
      setModalError('Please enter Certificate No. and Issue Date.'); return
    }
    setUploading(true); setModalError('')
    try {
      const res = await applicationFormApi.uploadDocument(
        modal.documentID, docNo.trim(), issueDate.trim(), uploadFile)
      if (res.data.success) {
        setModal(null)
        await loadDocs()
      } else {
        setModalError(res.data.message || 'Upload failed.')
      }
    } catch (err) {
      setModalError(err.response?.data?.message ?? 'Upload failed. Please try again.')
    } finally { setUploading(false) }
  }

  // ── Handle delete ─────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteDoc) return
    setDeleting(true)
    try {
      await applicationFormApi.deleteDocument(deleteDoc.documentID)
      setDeleteDoc(null)
      await loadDocs()
    } catch {
      setDeleteDoc(null)
    } finally { setDeleting(false) }
  }

  // ── Proceed ───────────────────────────────────────────────────────────────
  const handleProceed = async () => {
    setSaving(true); setError('')
    try {
      const res = await applicationFormApi.saveDocuments()
      if (res.data.success) navigate('/candidate/fee')
      else setError(res.data.message || 'Failed to save.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to proceed.')
    } finally { setSaving(false) }
  }

  if (pageLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b', fontSize:14 }}>Loading Documents...</p>
      </div>
    </div>
  )

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  const steps = [
    { label:'Application Form',               done:true,  active:false },
    { label:'College Selection & Preference', done:true,  active:false },
    { label:'Documents Upload',               done:false, active:true  },
    { label:'Fee Payment',                    done:false, active:false },
    { label:'Lock Form',                      done:false, active:false },
  ]

  const thStyle = { padding:'11px 16px', fontSize:11, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.05em', textAlign:'center', whiteSpace:'nowrap', background:V.navy }
  const tdStyle = { padding:'13px 16px', color:V.textPrimary, verticalAlign:'middle', textAlign:'center', fontSize:13 }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{appId||'—'}</span>
      </div>

      {/* step-bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600, background:s.active?V.primary:s.done?V.tealLight:V.borderLight, color:s.active?'#fff':s.done?V.teal:V.textSecond, border:`1px solid ${s.active?V.primary:s.done?V.tealBorder:V.border}` }}>
              {s.done && <i className="fas fa-check" style={{ fontSize:9 }}/>}
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i < arr.length-1 && <span style={{ color:V.textLight, fontSize:12 }}>›</span>}
          </div>
        ))}
      </div>

      {/* page-wrap */}
      <div style={{ padding:'20px 24px 24px' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* ── doc-card ─────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* doc-card-header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Upload Required Documents</h3>
          </div>

          {/* note-bar — amber */}
          <div style={{ background:'#fffbeb', borderBottom:'1px solid #fde68a', padding:'12px 24px', display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#92400e' }}>
            <i className="fas fa-info-circle" style={{ color:'#f59e0b' }}/>
            Note: All documents marked with <span style={{ color:V.danger, fontWeight:700, margin:'0 2px' }}>*</span> are mandatory to upload.
          </div>

          {/* doc-table */}
          {docs.length === 0 ? (
            <div style={{ padding:32, textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#f0fdf9', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-folder-open" style={{ fontSize:24, color:'#0d9488' }}/>
              </div>
              <p style={{ color:'#64748b', fontSize:13, margin:0 }}>
                No required documents found.
              </p>
              <p style={{ color:'#94a3b8', fontSize:12, margin:'6px 0 0' }}>
                Documents are assigned based on your category and course. Please ensure you have completed Personal Info and Category steps.
              </p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width:'5%' }}>Sr. No.</th>
                    <th style={{ ...thStyle, width:'52%', textAlign:'left' }}>Document Name</th>
                    <th style={{ ...thStyle, width:'13%' }}>Status</th>
                    <th style={{ ...thStyle, width:'10%' }}>Upload</th>
                    <th style={{ ...thStyle, width:'10%' }}>View</th>
                    <th style={{ ...thStyle, width:'10%' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, idx) => {
                    const isUploaded = doc.documentUploadedURL?.length > 0
                    return (
                      <tr key={doc.documentID} style={{ borderBottom:`1px solid ${V.borderLight}`, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        {/* Sr No */}
                        <td style={tdStyle}>{idx + 1}</td>
                        {/* Document Name — HtmlEncode="false" in old GridView — render as HTML */}
                        <td style={{ ...tdStyle, textAlign:'left', fontWeight:500 }}>
                          <span dangerouslySetInnerHTML={{ __html: doc.documentName }}/>
                        </td>
                        {/* Status badge */}
                        <td style={tdStyle}>
                          {isUploaded ? (
                            <span style={{ background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid #bbf7d0', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:4 }}>
                              ■ Uploaded
                            </span>
                          ) : (
                            <span style={{ background:'#fef9c3', color:'#854d0e', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid #fde68a', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:4 }}>
                              ■ Pending
                            </span>
                          )}
                        </td>
                        {/* Upload — visible only when NOT uploaded */}
                        <td style={tdStyle}>
                          {!isUploaded && (
                            <button
                              title="Upload"
                              onClick={() => openUpload(doc)}
                              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${V.tealBorder}`, background:V.tealLight, color:V.teal, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background=V.primary; e.currentTarget.style.color='#fff' }}
                              onMouseLeave={e => { e.currentTarget.style.background=V.tealLight; e.currentTarget.style.color=V.teal }}
                            >
                              <i className="fas fa-upload" style={{ fontSize:12 }}/>
                            </button>
                          )}
                        </td>
                        {/* View — visible only when uploaded */}
                        <td style={tdStyle}>
                          {isUploaded && (
                            <button
                              title="View"
                              onClick={() => setViewDoc({ name: doc.documentName, url: toUrl(doc.documentUploadedURL) })}
                              style={{ width:30, height:30, borderRadius:8, border:'1px solid #bae6fd', background:'#f0f9ff', color:'#0369a1', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background='#0369a1'; e.currentTarget.style.color='#fff' }}
                              onMouseLeave={e => { e.currentTarget.style.background='#f0f9ff'; e.currentTarget.style.color='#0369a1' }}
                            >
                              <i className="fas fa-eye" style={{ fontSize:12 }}/>
                            </button>
                          )}
                        </td>
                        {/* Delete — visible only when uploaded */}
                        <td style={tdStyle}>
                          {isUploaded && (
                            <button
                              title="Delete"
                              onClick={() => setDeleteDoc(doc)}
                              style={{ width:30, height:30, borderRadius:8, border:'1px solid #fecaca', background:'#fff0f0', color:'#dc2626', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background='#dc2626'; e.currentTarget.style.color='#fff' }}
                              onMouseLeave={e => { e.currentTarget.style.background='#fff0f0'; e.currentTarget.style.color='#dc2626' }}
                            >
                              <i className="fas fa-trash" style={{ fontSize:12 }}/>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* hint-note */}
          <div style={{ fontSize:12, color:V.textLight, padding:'8px 24px 10px', display:'flex', alignItems:'center', gap:6 }}>
            <i className="fas fa-info-circle"/> View and Delete become active once a document is uploaded.
          </div>

          {/* doc-footer */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', flexWrap:'wrap', gap:12 }}>
            {/* left — mandatory counter */}
            <div style={{ fontSize:12.5, color:V.textSecond, display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <i className="fas fa-check-square" style={{ color:V.primary }}/>
              <strong style={{ color: uploadedMand >= totalMand ? V.primary : '#f59e0b' }}>
                {uploadedMand} of {totalMand}
              </strong>&nbsp;mandatory documents uploaded
            </div>

            {/* center — Back + Save & Next */}
            <div style={{ display:'flex', gap:10, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
              <button
                type="button"
                onClick={() => navigate('/candidate/photo-sign')}
                style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'9px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
              >
                <i className="fas fa-arrow-left"/> Back
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!allUploaded || saving}
                title={!allUploaded ? 'Upload all mandatory documents first' : ''}
                style={{ background:(!allUploaded||saving)?'#d1fae5':V.primary, color:(!allUploaded||saving)?'#6b7280':'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:(!allUploaded||saving)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e => { if(allUploaded&&!saving) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(allUploaded&&!saving) e.currentTarget.style.background=V.primary }}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                  : <>Save &amp; Next &#8594;</>}
              </button>
            </div>
            <div style={{ flex:1 }}/>
          </div>
        </div>
      </div>

      {/* scroll-to-top */}
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
        style={{ position:'fixed', bottom:28, right:28, width:44, height:44, borderRadius:'50%', background:'#f97316', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.4)', zIndex:50 }}>
        <i className="fas fa-chevron-up"/>
      </button>

      {/* ══ UPLOAD MODAL ════════════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:560, overflow:'hidden', fontFamily:'inherit' }}>

            {/* modal header */}
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                <i className="fas fa-upload"/> Upload <span dangerouslySetInnerHTML={{ __html: modal.documentName }}/>
              </span>
              <button onClick={() => setModal(null)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
            </div>

            {/* modal body */}
            <div style={{ padding:'20px 24px' }}>
              {/* file info box */}
              <div style={{ background:V.tealLight, border:`1px solid ${V.tealBorder}`, borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', gap:8, marginBottom:4, fontSize:13 }}>
                  <span style={{ fontWeight:600, color:V.textSecond, minWidth:180 }}>
                    <i className="fas fa-file" style={{ color:V.primary, marginRight:4 }}/> File Types Allowed
                  </span>
                  <span style={{ color:V.textPrimary, fontWeight:600 }}>: {modal.fileTypesAllowed?.toUpperCase()}</span>
                </div>
                <div style={{ display:'flex', gap:8, fontSize:13 }}>
                  <span style={{ fontWeight:600, color:V.textSecond, minWidth:180 }}>
                    <i className="fas fa-weight" style={{ color:V.primary, marginRight:4 }}/> Maximum File Size
                  </span>
                  <span style={{ color:V.textPrimary, fontWeight:600 }}>: {(modal.maxFileSizeAllowed / 1024).toFixed(1)} MB ({modal.maxFileSizeAllowed} KB)</span>
                </div>
              </div>

              {/* DocumentNo + IssueDate — only for docs that require it */}
              {modal.requiresDocumentDetails && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:5 }}>
                      Certificate No. <span style={{ color:V.danger }}>*</span>
                    </label>
                    <input type="text" maxLength={50} value={docNo}
                      onChange={e => setDocNo(e.target.value.toUpperCase())}
                      placeholder="Enter certificate number"
                      style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, color:V.textPrimary, background:'#fff', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:5 }}>
                      Issue Date (DD/MM/YYYY) <span style={{ color:V.danger }}>*</span>
                    </label>
                    <input type="date" value={issueDate ? issueDate.split('/').reverse().join('-') : ''}
                      onChange={e => {
                        const [y,m,d] = e.target.value.split('-')
                        setIssueDate(e.target.value ? `${d}/${m}/${y}` : '')
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, color:V.textPrimary, background:'#fff', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                </div>
              )}

              {/* File picker */}
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textSecond, marginBottom:5 }}>
                  Select File to Upload <span style={{ color:V.danger }}>*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={modal.fileTypesAllowed?.split(',').map(e => `.${e.trim()}`).join(',')}
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  style={{ width:'100%', maxWidth:320, fontSize:13, border:`1px solid ${V.border}`, borderRadius:6, padding:'6px 8px', background:'#fff', fontFamily:'inherit' }}
                />
              </div>

              {modalError && (
                <p style={{ fontSize:12.5, color:V.danger, margin:'8px 0 0', display:'flex', alignItems:'center', gap:4 }}>
                  <i className="fas fa-exclamation-circle"/> {modalError}
                </p>
              )}
            </div>

            {/* modal footer */}
            <div style={{ borderTop:`1px solid ${V.border}`, padding:'12px 24px', display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)}
                style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'9px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Close
              </button>
              <button onClick={handleUpload} disabled={!uploadFile || uploading}
                style={{ background:(!uploadFile||uploading)?'#e2e8f0':V.primary, color:(!uploadFile||uploading)?'#6b7280':'#fff', border:'none', padding:'9px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:(!uploadFile||uploading)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e => { if(uploadFile&&!uploading) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e => { if(uploadFile&&!uploading) e.currentTarget.style.background=V.primary }}>
                {uploading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Uploading...</>
                  : <><i className="fas fa-upload"/> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VIEW MODAL ══════════════════════════════════════════════════════ */}
      {viewDoc && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:8 }}>
          <div style={{ background:'#fff', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', width:'98%', height:'94vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ background:V.navy, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{viewDoc.name}</span>
              <button onClick={() => setViewDoc(null)} style={{ background:'#dc3545', border:'none', color:'#fff', borderRadius:6, padding:'4px 12px', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>✕ Close</button>
            </div>
            <div style={{ flex:1, overflow:'auto' }}>
              <iframe src={viewDoc.url} title="Document" style={{ width:'100%', height:'100%', border:'none' }}/>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ═════════════════════════════════════════════ */}
      {deleteDoc && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:420, overflow:'hidden', fontFamily:'inherit' }}>
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                <i className="fas fa-exclamation-triangle" style={{ color:'#fbbf24' }}/> Alert !!!
              </span>
              <button onClick={() => setDeleteDoc(null)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>
            </div>
            <div style={{ padding:'20px 24px 8px', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#fef2f2', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-trash" style={{ color:'#dc2626', fontSize:22 }}/>
              </div>
              <p style={{ fontSize:14, color:V.textPrimary, margin:0 }}>
                Your uploaded document will be deleted.<br/>Do you want to continue?
              </p>
            </div>
            <div style={{ padding:'12px 24px 20px', display:'flex', gap:12 }}>
              <button onClick={() => setDeleteDoc(null)} style={{ flex:1, padding:'9px 0', background:'#fff', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ flex:1, padding:'9px 0', background:deleting?'#fca5a5':'#dc3545', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#fff', cursor:deleting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {deleting ? 'Deleting...' : <><i className="fas fa-trash"/> Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
