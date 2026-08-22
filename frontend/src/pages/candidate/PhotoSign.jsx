import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const API_BASE = 'http://localhost:7001'

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

  // Build full display URL — relative paths get API_BASE prefix
  const displayUrl = url =>
    !url ? '' : (url.startsWith('http') ? url : `${API_BASE}${url}`)

  // ── Load from DB on every mount ───────────────────────────────────────────
  useEffect(() => {
    setApplicationId(user?.userLoginID ?? '')
    applicationFormApi.getPhotoSign()
      .then(res => {
        const pUrl = res.data?.photoUploadedURL ?? ''
        const sUrl = res.data?.signUploadedURL  ?? ''
        setPhotoURL(pUrl)
        setSignURL(sUrl)
        // Sync navbar profile icon if photo exists in DB
        if (pUrl && updateUser) updateUser({ photoPath: pUrl })
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── File select ───────────────────────────────────────────────────────────
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

  // ── Upload photo ──────────────────────────────────────────────────────────
  const handleUploadPhoto = async () => {
    if (!photoFile) { setPhotoError('Please select a photograph to upload.'); return }
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
        // Update navbar profile icon immediately
        if (updateUser) updateUser({ photoPath: url })
      } else {
        setPhotoError(res.data.message || 'Upload failed.')
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message ?? 'Photograph upload failed. Please try again.')
    } finally { setUploadingPhoto(false) }
  }

  // ── Upload sign ───────────────────────────────────────────────────────────
  const handleUploadSign = async () => {
    if (!signFile) { setSignError('Please select a signature to upload.'); return }
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

  // ── Proceed ───────────────────────────────────────────────────────────────
  const handleProceed = async () => {
    if (!bothUploaded) {
      setError('Please upload both Photograph and Signature before proceeding.')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await applicationFormApi.savePhotoSign()
      if (res.data.success) navigate('/candidate/documents')
      else setError(res.data.message || 'Failed to save.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to proceed.')
    } finally { setSaving(false) }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color:'#728aac', fontSize:16 }}>Loading...</p>
      </div>
    </div>
  )

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdfb', tealBorder:'#ccfbf1',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', textLight:'#94a3b8',
    danger:'#ef4444', bg:'#f5f6fa',
    amber:'#fffbeb', amberBorder:'#fde68a',
    amberText:'#92400e', amberTitle:'#b45309', amberWarn:'#1d4ed8',
  }

  // ── Step bar ──────────────────────────────────────────────────────────────
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

      {/* page wrap */}
      <div style={{ padding:'20px 24px 24px' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/> {error}
          </div>
        )}

        {/* ── main card ──────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* card header */}
          <div style={{ background:V.navy, padding:'16px 24px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Upload Photograph and Signature</h3>
          </div>

          {/* compact instructions */}
          <div style={{ background:V.tealLight, borderBottom:`1px solid ${V.tealBorder}`, padding:'12px 24px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:V.teal, marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em' }}>
              <i className="fas fa-info-circle"/> Instructions
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 40px' }} className="instr-grid">
              <div style={{ color:V.textPrimary, fontSize:12.5, lineHeight:1.8 }}>
                <strong>Photograph:</strong> Format: <strong>JPG/JPEG</strong> &nbsp;|&nbsp; Size: <strong>10 KB – 100 KB</strong>
              </div>
              <div style={{ color:V.textPrimary, fontSize:12.5, lineHeight:1.8 }}>
                <strong>Signature:</strong> Format: <strong>JPG/JPEG</strong> &nbsp;|&nbsp; Size: <strong>5 KB – 50 KB</strong>
              </div>
            </div>
          </div>

          {/* ── PHOTOGRAPH SECTION ─────────────────────────────────────── */}
          <SubSection title="Upload Photograph" icon="fas fa-user-circle" V={V}/>
          <UploadBody
            fileURL={photoURL}
            displayURL={displayUrl(photoURL)}
            file={photoFile}
            inputRef={photoInputRef}
            uploading={uploadingPhoto}
            error={photoError}
            success={photoSuccess}
            acceptLabel="JPG/JPEG • 10 KB – 100 KB"
            onSelect={handlePhotoSelect}
            onUpload={handleUploadPhoto}
            photoWidth={80} photoHeight={100}
            placeholderIcon="fas fa-user"
            V={V}
          />

          {/* ── SIGNATURE SECTION ──────────────────────────────────────── */}
          <SubSection title="Upload Signature" icon="fas fa-signature" V={V} topBorder/>
          <UploadBody
            fileURL={signURL}
            displayURL={displayUrl(signURL)}
            file={signFile}
            inputRef={signInputRef}
            uploading={uploadingSign}
            error={signError}
            success={signSuccess}
            acceptLabel="JPG/JPEG • 5 KB – 50 KB"
            onSelect={handleSignSelect}
            onUpload={handleUploadSign}
            photoWidth={140} photoHeight={56}
            placeholderIcon="fas fa-pen-nib"
            V={V}
          />

          {/* ── footer ─────────────────────────────────────────────────── */}
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
                style={{ background:(!bothUploaded||saving)?'#d1fae5':V.primary, color:(!bothUploaded||saving)?'#6b7280':'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13.5, fontWeight:600, cursor:(!bothUploaded||saving)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e=>{ if(bothUploaded&&!saving) e.currentTarget.style.background=V.primaryDark }}
                onMouseLeave={e=>{ if(bothUploaded&&!saving) e.currentTarget.style.background=V.primary }}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                  : <>Proceed <i className="fas fa-arrow-right" style={{ fontSize:12 }}/></>}
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

      <style>{`
        @media(max-width:768px){.instr-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}

// ── Sub-section header ────────────────────────────────────────────────────────
function SubSection({ title, icon, V, topBorder }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:V.tealLight, borderTop:topBorder?`1px solid ${V.border}`:'none', borderBottom:`1px solid ${V.border}` }}>
      <i className={icon} style={{ color:V.teal, fontSize:13 }}/>
      <span style={{ fontSize:12, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
    </div>
  )
}

// ── Upload body ───────────────────────────────────────────────────────────────
function UploadBody({ fileURL, displayURL, file, inputRef, uploading, error, success, acceptLabel, onSelect, onUpload, photoWidth, photoHeight, placeholderIcon, V }) {
  return (
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:20, background:V.tealLight, border:`1.5px dashed ${V.tealBorder}`, borderRadius:12, padding:'16px 20px', flexWrap:'wrap' }}>

        {/* preview */}
        <div style={{ width:photoWidth, height:photoHeight, border:`1.5px solid ${fileURL?V.primary:V.border}`, borderRadius:8, background:'#f8fafc', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {displayURL
            ? <img src={displayURL} alt="preview"
                style={{ width:'100%', height:'100%', objectFit:'contain' }}
                onError={e => { e.currentTarget.style.display='none'; e.currentTarget.parentNode.querySelector('.ph-icon').style.display='flex' }}/>
            : null}
          <div className="ph-icon" style={{ display: displayURL?'none':'flex', width:'100%', height:'100%', alignItems:'center', justifyContent:'center' }}>
            <i className={placeholderIcon} style={{ fontSize: photoHeight > 80 ? 36 : 22, color:V.textLight }}/>
          </div>
        </div>

        <div style={{ flex:1 }}>
          {/* status */}
          <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>
            {fileURL
              ? <span style={{ color:V.primary }}><i className="fas fa-check-circle"/> Uploaded</span>
              : <span style={{ color:V.textLight }}><i className="fas fa-times-circle"/> Not Uploaded</span>}
          </div>

          {/* file input + button */}
          <div style={{ display:'flex', gap:8, marginBottom:6 }}>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg" onChange={onSelect}
              style={{ flex:1, fontSize:12, border:`1px solid ${V.border}`, borderRadius:6, padding:'6px 8px', background:'#fff', fontFamily:'inherit' }}/>
            <button type="button" onClick={onUpload} disabled={!file||uploading}
              style={{ background:(!file||uploading)?'#e2e8f0':V.primary, color:(!file||uploading)?'#6b7280':'#fff', border:'none', padding:'8px 16px', borderRadius:6, fontSize:13, fontWeight:600, cursor:(!file||uploading)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', fontFamily:'inherit' }}
              onMouseEnter={e=>{ if(file&&!uploading) e.currentTarget.style.background=V.primaryDark }}
              onMouseLeave={e=>{ if(file&&!uploading) e.currentTarget.style.background=V.primary }}>
              {uploading
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Uploading...</>
                : <><i className="fas fa-upload" style={{ fontSize:11 }}/>Upload</>}
            </button>
          </div>

          {/* constraints */}
          <p style={{ fontSize:11, color:V.textLight, margin:0 }}>
            <i className="fas fa-info-circle"/> {acceptLabel}
          </p>

          {/* error / success */}
          {error && <p style={{ fontSize:11.5, color:V.danger, margin:'4px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-exclamation-circle"/> {error}</p>}
          {success && <p style={{ fontSize:11.5, color:V.primary, margin:'4px 0 0', display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-check-circle"/> {success}</p>}
        </div>
      </div>
    </div>
  )
}
