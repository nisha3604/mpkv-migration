import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// Resolve any URL format stored in DB to a displayable image URL.
// 1. Clean https:// Azure Blob URL           → use directly
// 2. Legacy ViewFile.aspx?...FileURL=https:// → unwrap all nesting
// 3. Local /uploads/...                       → use as-is (proxied by Vite)
function resolveUrl(url) {
  if (!url) return ''
  let current = url
  while (current.includes('ViewFile.aspx') && current.includes('FileURL=')) {
    const match = current.match(/FileURL=([^&\s]+)/)
    if (!match?.[1]) break
    const extracted = decodeURIComponent(match[1])
    if (extracted === current) break
    current = extracted
  }
  return current  // https:// or /uploads/... — both work (Vite proxies /uploads)
}

export default function PhotoSign() {
  const navigate             = useNavigate()
  const { user, updateUser } = useAuth()

  const [photoURL,       setPhotoURL]       = useState('')
  const [signURL,        setSignURL]        = useState('')
  const [pageLoading,    setPageLoading]    = useState(true)
  const [applicationId,  setApplicationId]  = useState('')
  const [photoFile,      setPhotoFile]      = useState(null)
  const [signFile,       setSignFile]       = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingSign,  setUploadingSign]  = useState(false)
  const [photoError,     setPhotoError]     = useState('')
  const [signError,      setSignError]      = useState('')
  const [photoSuccess,   setPhotoSuccess]   = useState('')
  const [signSuccess,    setSignSuccess]    = useState('')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  const photoInputRef = useRef(null)
  const signInputRef  = useRef(null)

  const bothUploaded = photoURL.length > 0 && signURL.length > 0

  // ── Load existing data from DB ────────────────────────────────────────────
  useEffect(() => {
    setApplicationId(user?.userLoginID ?? '')
    applicationFormApi.getPhotoSign()
      .then(res => {
        const pUrl = res.data?.photoUploadedURL ?? ''
        const sUrl = res.data?.signUploadedURL  ?? ''
        setPhotoURL(pUrl)
        setSignURL(sUrl)
        // Sync resolved URL to AuthContext so navbar shows photo on every visit
        if (pUrl && updateUser) updateUser({ photoPath: resolveUrl(pUrl) })
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Client-side validation (mirrors CheckPhoto / CheckSign JS) ────────────
  const validatePhoto = file => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'jpg' && ext !== 'jpeg') return 'Photograph Format should be jpg/jpeg.'
    if (file.size < 10240 || file.size > 102400)
      return 'Photograph Size must be greater than 10 KB and less than 100 KB.'
    return ''
  }
  const validateSign = file => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'jpg' && ext !== 'jpeg') return 'Signature Format should be jpg/jpeg.'
    if (file.size < 5120 || file.size > 51200)
      return 'Signature Size must be greater than 5 KB and less than 50 KB.'
    return ''
  }

  const handlePhotoSelect = e => {
    const file = e.target.files?.[0]; if (!file) return
    const err = validatePhoto(file)
    if (err) { setPhotoError(err); setPhotoFile(null); return }
    setPhotoFile(file); setPhotoError(''); setPhotoSuccess('')
  }
  const handleSignSelect = e => {
    const file = e.target.files?.[0]; if (!file) return
    const err = validateSign(file)
    if (err) { setSignError(err); setSignFile(null); return }
    setSignFile(file); setSignError(''); setSignSuccess('')
  }

  // ── Upload photo (mirrors btnUploadPhoto_Click) ───────────────────────────
  const handleUploadPhoto = async () => {
    if (!photoFile) { setPhotoError('Please Select Photograph to Upload.'); return }
    const err = validatePhoto(photoFile)
    if (err) { setPhotoError(err); return }
    setUploadingPhoto(true); setPhotoError(''); setPhotoSuccess('')
    try {
      const res = await applicationFormApi.uploadPhoto(photoFile)
      if (res.data.success) {
        const url = res.data.uploadedURL
        setPhotoURL(url)
        setPhotoSuccess(res.data.message)
        setPhotoFile(null)
        if (photoInputRef.current) photoInputRef.current.value = ''
        // Mirror: sessionUser.PhotoPath = entity.PhotoUploadedURL → navbar refresh
        if (updateUser) updateUser({ photoPath: resolveUrl(url) })
      } else {
        setPhotoError(res.data.message || 'Upload failed.')
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message ?? 'Photograph upload failed. Please try again.')
    } finally { setUploadingPhoto(false) }
  }

  // ── Upload sign (mirrors btnUploadSign_Click) ─────────────────────────────
  const handleUploadSign = async () => {
    if (!signFile) { setSignError('Please Select Signature to Upload.'); return }
    const err = validateSign(signFile)
    if (err) { setSignError(err); return }
    setUploadingSign(true); setSignError(''); setSignSuccess('')
    try {
      const res = await applicationFormApi.uploadSign(signFile)
      if (res.data.success) {
        const url = res.data.uploadedURL
        setSignURL(url)
        setSignSuccess(res.data.message)
        setSignFile(null)
        if (signInputRef.current) signInputRef.current.value = ''
      } else {
        setSignError(res.data.message || 'Upload failed.')
      }
    } catch (err) {
      setSignError(err.response?.data?.message ?? 'Signature upload failed. Please try again.')
    } finally { setUploadingSign(false) }
  }

  // ── Proceed (mirrors btnProceed_Click → SavePhotoAndSign) ─────────────────
  const handleProceed = async () => {
    if (!bothUploaded) { setError('Please upload both Photograph and Signature before proceeding.'); return }
    setSaving(true); setError('')
    try {
      const res = await applicationFormApi.savePhotoSign()
      if (res.data.success) navigate('/candidate/documents')
      else setError(res.data.message || 'Failed to save.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to proceed.')
    } finally { setSaving(false) }
  }

  if (pageLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#64748b', fontSize:14 }}>Loading...</p>
      </div>
    </div>
  )

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
    amber:'#fffbeb', amberBorder:'#fde68a',
    amberText:'#92400e', amberTitle:'#b45309', amberWarn:'#1d4ed8',
  }

  const steps = [
    { label:'Application Form',               done:true,  active:false },
    { label:'College Selection & Preference', done:true,  active:false },
    { label:'Documents Upload',               done:false, active:true  },
    { label:'Fee Payment',                    done:false, active:false },
    { label:'Lock Form',                      done:false, active:false },
  ]

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', paddingBottom:40 }}>

      {/* top info bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${V.border}`, padding:'10px 24px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px 32px' }}>
        <span style={{ fontSize:12, color:V.textSecond, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Application ID</span>
        <span style={{ fontSize:15, fontWeight:700, color:V.primary }}>{applicationId||'—'}</span>
      </div>

      {/* step bar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'20px 24px 0', flexWrap:'wrap' }}>
        {steps.map((s,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12.5, fontWeight:600, background:s.active?V.primary:s.done?V.tealLight:V.borderLight, color:s.active?'#fff':s.done?V.teal:V.textSecond, border:`1px solid ${s.active?V.primary:s.done?V.tealBorder:V.border}` }}>
              {s.done && !s.active && <i className="fas fa-check" style={{ fontSize:9 }}/>}
              {s.active && <i className="fas fa-circle" style={{ fontSize:8 }}/>}
              {s.label}
            </div>
            {i < arr.length-1 && <span style={{ color:V.textLight, fontSize:14 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ padding:'20px 24px 24px' }}>
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* main card */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* card header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>
              <i className="fas fa-image" style={{ marginRight:8 }}/>Upload Photograph and Signature
            </h3>
          </div>

          {/* ══ PHOTOGRAPH SECTION ══════════════════════════════════════════ */}
          {/* sub-header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}` }}>
            <span style={{ width:3, height:16, background:V.primary, borderRadius:2, flexShrink:0 }}/>
            <i className="fas fa-user-circle" style={{ color:V.teal, fontSize:14 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Upload Photograph</span>
          </div>

          <div style={{ padding:'20px 24px' }}>
            {/* instructions amber box — mirrors old inst-box exactly */}
            <div style={{ background:V.amber, border:`1px solid ${V.amberBorder}`, borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.amberTitle, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-exclamation-circle"/> Instructions
              </div>
              <ol style={{ margin:0, paddingLeft:20, color:V.amberText, fontSize:13, lineHeight:1.9 }}>
                <li>The photograph must be a recent passport size looking directly at the camera, in colour preferably, against a white or light background.</li>
                <li>If there is a red-eye effect, please edit to remove it.</li>
                <li>If you wear glasses, these should not be tinted. Check to make sure that the photograph has no reflections; your eyes and face should be clearly visible.</li>
                <li>Wearing caps, hats, or tinted / dark glasses is not acceptable. Religious head wear is allowed but must not cover the face.</li>
                <li>Photo should present the full head from top of hair to bottom of chin, centred within frame, with a natural expression.</li>
                <li>Preferred photograph size should be between <strong>10 KB and 100 KB</strong>. Dimensions should be Width: <strong>139px</strong>, Height: <strong>178px</strong>.</li>
                <li>Candidates should ensure the same passport size colour photograph is used throughout this admission process.</li>
              </ol>
              <div style={{ color:V.amberWarn, fontWeight:600, fontSize:13, marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-exclamation-triangle"/> Please upload the correct photograph, otherwise your application will be cancelled.
              </div>
            </div>

            <label style={{ fontSize:13, fontWeight:600, color:V.textSecond, marginBottom:8, display:'block' }}>
              Upload Photograph (JPG/JPEG Format Only) <span style={{ color:V.danger }}>*</span>
            </label>

            {/* upload row */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:20, background:V.tealLight, border:`1.5px dashed ${V.tealBorder}`, borderRadius:12, padding:'18px 20px', flexWrap:'wrap' }}>
              {/* preview 80×100 — mirrors old divPhoto style="width:80px;height:100px" */}
              <PhotoPreview url={resolveUrl(photoURL)} width={80} height={100} icon="fas fa-user" V={V}/>

              <div style={{ flex:1, minWidth:240 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>
                  {photoURL
                    ? <span style={{ color:V.primary }}><i className="fas fa-check-circle"/> Photograph Uploaded</span>
                    : <span style={{ color:V.textLight }}><i className="fas fa-times-circle"/> Not Uploaded Yet</span>}
                </div>
                <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <input ref={photoInputRef} type="file" accept=".jpg,.jpeg" onChange={handlePhotoSelect}
                    style={{ fontSize:12.5, border:`1px solid ${V.border}`, borderRadius:6, padding:'6px 8px', background:'#fff', fontFamily:'inherit', maxWidth:260 }}/>
                  <button type="button" onClick={handleUploadPhoto} disabled={!photoFile||uploadingPhoto}
                    style={{ background:(!photoFile||uploadingPhoto)?'#e2e8f0':V.primary, color:(!photoFile||uploadingPhoto)?'#6b7280':'#fff', border:'none', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:(!photoFile||uploadingPhoto)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', fontFamily:'inherit' }}
                    onMouseEnter={e=>{ if(photoFile&&!uploadingPhoto) e.currentTarget.style.background=V.primaryDark }}
                    onMouseLeave={e=>{ if(photoFile&&!uploadingPhoto) e.currentTarget.style.background=V.primary }}>
                    {uploadingPhoto
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Uploading...</>
                      : <><i className="fas fa-upload" style={{ fontSize:11 }}/>Upload</>}
                  </button>
                </div>
                <p style={{ fontSize:11, color:V.textLight, margin:0 }}>
                  <i className="fas fa-info-circle"/> JPG/JPEG only &nbsp;•&nbsp; 10 KB – 100 KB &nbsp;•&nbsp; 139 × 178 px recommended
                </p>
                {photoError && <p style={{ fontSize:12, color:V.danger, margin:'5px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-exclamation-circle"/> {photoError}</p>}
                {photoSuccess && <p style={{ fontSize:12, color:V.primary, margin:'5px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-check-circle"/> {photoSuccess}</p>}
              </div>
            </div>
          </div>

          {/* ══ SIGNATURE SECTION ═══════════════════════════════════════════ */}
          {/* sub-header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.tealBorder}` }}>
            <span style={{ width:3, height:16, background:V.primary, borderRadius:2, flexShrink:0 }}/>
            <i className="fas fa-signature" style={{ color:V.teal, fontSize:14 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>Upload Signature</span>
          </div>

          <div style={{ padding:'20px 24px' }}>
            {/* signature instructions amber box */}
            <div style={{ background:V.amber, border:`1px solid ${V.amberBorder}`, borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.amberTitle, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-exclamation-circle"/> Instructions
              </div>
              <ol style={{ margin:0, paddingLeft:20, color:V.amberText, fontSize:13, lineHeight:1.9 }}>
                <li>Please sign on white paper with a black ink pen and scan the image of your signature.</li>
                <li>Upload the scanned image of your signature. This signature will be used on the Admit Card and wherever necessary.</li>
                <li>Preferred signature size should be between <strong>5 KB and 50 KB</strong>. Dimensions should be Width: <strong>198px</strong>, Height: <strong>60px</strong>.</li>
              </ol>
              <div style={{ color:V.amberWarn, fontWeight:600, fontSize:13, marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-exclamation-triangle"/> Please upload the correct signature, otherwise your application will be cancelled.
              </div>
            </div>

            <label style={{ fontSize:13, fontWeight:600, color:V.textSecond, marginBottom:8, display:'block' }}>
              Upload Signature (JPG/JPEG Format Only) <span style={{ color:V.danger }}>*</span>
            </label>

            {/* upload row — sign preview 130×55 mirrors old divSign */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:20, background:V.tealLight, border:`1.5px dashed ${V.tealBorder}`, borderRadius:12, padding:'18px 20px', flexWrap:'wrap' }}>
              <PhotoPreview url={resolveUrl(signURL)} width={130} height={55} icon="fas fa-pen-nib" V={V}/>

              <div style={{ flex:1, minWidth:240 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>
                  {signURL
                    ? <span style={{ color:V.primary }}><i className="fas fa-check-circle"/> Signature Uploaded</span>
                    : <span style={{ color:V.textLight }}><i className="fas fa-times-circle"/> Not Uploaded Yet</span>}
                </div>
                <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <input ref={signInputRef} type="file" accept=".jpg,.jpeg" onChange={handleSignSelect}
                    style={{ fontSize:12.5, border:`1px solid ${V.border}`, borderRadius:6, padding:'6px 8px', background:'#fff', fontFamily:'inherit', maxWidth:260 }}/>
                  <button type="button" onClick={handleUploadSign} disabled={!signFile||uploadingSign}
                    style={{ background:(!signFile||uploadingSign)?'#e2e8f0':V.primary, color:(!signFile||uploadingSign)?'#6b7280':'#fff', border:'none', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:(!signFile||uploadingSign)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', fontFamily:'inherit' }}
                    onMouseEnter={e=>{ if(signFile&&!uploadingSign) e.currentTarget.style.background=V.primaryDark }}
                    onMouseLeave={e=>{ if(signFile&&!uploadingSign) e.currentTarget.style.background=V.primary }}>
                    {uploadingSign
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Uploading...</>
                      : <><i className="fas fa-upload" style={{ fontSize:11 }}/>Upload</>}
                  </button>
                </div>
                <p style={{ fontSize:11, color:V.textLight, margin:0 }}>
                  <i className="fas fa-info-circle"/> JPG/JPEG only &nbsp;•&nbsp; 5 KB – 50 KB &nbsp;•&nbsp; 198 × 60 px recommended
                </p>
                {signError && <p style={{ fontSize:12, color:V.danger, margin:'5px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-exclamation-circle"/> {signError}</p>}
                {signSuccess && <p style={{ fontSize:12, color:V.primary, margin:'5px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-check-circle"/> {signSuccess}</p>}
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc', borderRadius:'0 0 14px 14px', flexWrap:'wrap', gap:12 }}>
            <div style={{ fontSize:12, color:V.textSecond, display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <i className="fas fa-info-circle" style={{ color:V.primary }}/>
              Both photograph and signature must be uploaded to proceed
            </div>
            <div style={{ display:'flex', gap:10, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
              <button type="button" onClick={() => navigate('/candidate/preferences')}
                style={{ background:'transparent', color:V.textPrimary, border:`1.5px solid ${V.border}`, padding:'9px 20px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                <i className="fas fa-arrow-left"/> Back
              </button>
              <button type="button" onClick={handleProceed} disabled={!bothUploaded||saving}
                title={!bothUploaded ? 'Upload both Photograph and Signature first' : ''}
                style={{ background:(!bothUploaded||saving)?'#d1fae5':V.primary, color:(!bothUploaded||saving)?'#6b7280':'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:(!bothUploaded||saving)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e=>{ if(bothUploaded&&!saving) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e=>{ if(bothUploaded&&!saving) e.currentTarget.style.background=V.primary }}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                  : <>Save &amp; Next <i className="fas fa-arrow-right" style={{ fontSize:12 }}/></>}
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

      <style>{`@media(max-width:768px){.upload-row-inner{flex-direction:column!important;}}`}</style>
    </div>
  )
}

// ── Photo preview — React state driven, no querySelector ─────────────────────
function PhotoPreview({ url, width, height, icon, V }) {
  const [failed, setFailed] = useState(false)

  // Reset when URL changes (new upload or page reload)
  useEffect(() => { setFailed(false) }, [url])

  return (
    <div style={{
      width, height, border:`1.5px solid ${url&&!failed?V.primary:V.border}`,
      borderRadius:8, background:'#f8fafc', overflow:'hidden',
      flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      {url && !failed
        ? <img src={url} alt="preview"
            style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:4 }}
            onError={() => setFailed(true)}/>
        : <i className={icon} style={{ fontSize: height > 70 ? 32 : 20, color:V.textLight }}/>}
    </div>
  )
}
