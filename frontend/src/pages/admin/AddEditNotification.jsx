import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { notificationApi } from '../../services/api'

/**
 * AddEditNotification — user-friendly form for superadmin.
 *
 * User-friendly improvements:
 *  - Category shown as coloured cards, not dropdown
 *  - Content Type toggle (File / Text) with clear visual switcher
 *  - Date fields with helper text showing format
 *  - Live preview of "NEW" badge when DisplayNewImage=1
 *  - Existing file link shown when editing (File type)
 *  - All validations shown inline with helpful messages
 *
 * Same functionality as old project:
 *  - Administration_SaveNotification SP (18 params)
 *  - File upload → Azure Blob (notifications container)
 *  - Text content supports English + Marathi
 *  - OpenInNewPage, DisplayNewImage, IsActive controls
 */

const CATEGORIES = [
  { id:1,  label:'Announcement', icon:'fa-bullhorn',    bg:'#fef3c7', text:'#92400e', border:'#fcd34d' },
  { id:2,  label:'News',         icon:'fa-newspaper',  bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  { id:3,  label:'Notification', icon:'fa-bell',       bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
  { id:4,  label:'Download',     icon:'fa-download',   bg:'#ede9fe', text:'#5b21b6', border:'#c4b5fd' },
  { id:11, label:'Popup',        icon:'fa-window-restore',bg:'#fce7f3',text:'#9d174d',border:'#f9a8d4'},
]

const defaultStartDate = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
const defaultEndDate = () => {
  const d = new Date(); d.setMonth(d.getMonth()+6)
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()} 23:59`
}

export default function AddEditNotification() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isEdit     = !!id
  const fileRef    = useRef()

  const [form, setForm] = useState({
    notificationID:          isEdit ? parseInt(id) : 0,
    notificationCategoryID:  1,
    notificationTitle:       '',
    notificationTitleMarathi:'',
    displayStartDateTime:    defaultStartDate(),
    displayEndDateTime:      defaultEndDate(),
    publishDateTime:         defaultStartDate(),
    contentType:             'F',
    textContent:             '',
    textContentMarathi:      '',
    fileContentName:         '',
    fileContentURL:          '',
    openInNewPage:           1,
    displayNewImage:         1,
    isActive:                true,
  })

  const [loading,    setLoading]    = useState(isEdit)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState('')
  const [fieldErrors,setFieldErrors]= useState({})

  // Load existing for edit
  useEffect(() => {
    if (!isEdit) return
    notificationApi.getDetails(id)
      .then(res => {
        if (res.data.success && res.data.item) {
          const d = res.data.item
          setForm({
            notificationID:          d.notificationID,
            notificationCategoryID:  d.notificationCategoryID,
            notificationTitle:       d.notificationTitle       || '',
            notificationTitleMarathi:d.notificationTitleMarathi|| '',
            displayStartDateTime:    d.displayStartDateTime    || defaultStartDate(),
            displayEndDateTime:      d.displayEndDateTime      || defaultEndDate(),
            publishDateTime:         d.publishDateTime         || defaultStartDate(),
            contentType:             d.contentType             || 'F',
            textContent:             d.textContent             || '',
            textContentMarathi:      d.textContentMarathi      || '',
            fileContentName:         d.fileContentName         || '',
            fileContentURL:          d.fileContentURL          || '',
            openInNewPage:           d.openInNewPage,
            displayNewImage:         d.displayNewImage,
            isActive:                d.isActive !== false,
          })
        }
      })
      .catch(() => setError('Failed to load notification details.'))
      .finally(() => setLoading(false))
  }, [id])

  const validate = () => {
    const e = {}
    if (!form.notificationCategoryID || form.notificationCategoryID === 0) e.category = 'Please select a category.'
    if (!form.notificationTitle.trim()) e.title = 'Please enter the title (English).'
    if (!form.displayStartDateTime.trim()) e.startDate = 'Please enter Display Start Date/Time.'
    if (!form.displayEndDateTime.trim()) e.endDate = 'Please enter Display End Date/Time.'
    if (!form.publishDateTime.trim()) e.publishDate = 'Please enter Publish Date/Time.'
    if (form.contentType === 'F' && !form.fileContentURL && !isEdit) e.file = 'Please upload a file.'
    if (form.contentType === 'T' && !form.textContent.trim()) e.text = 'Please enter the text content.'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true); setFieldErrors(p => ({ ...p, file:'' }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('categoryId', form.notificationCategoryID)
      const res = await notificationApi.uploadFile(fd)
      if (res.data.success) {
        setForm(p => ({ ...p, fileContentName:file.name, fileContentURL:res.data.url }))
      } else setError(res.data.message || 'Upload failed.')
    } catch { setError('File upload failed.') }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true); setError('')
    try {
      const res = await notificationApi.save(form)
      if (res.data.success) navigate('/admin/notifications')
      else setError(res.data.message || 'Failed to save.')
    } catch { setError('An error occurred.') }
    finally { setSaving(false) }
  }

  const F = ({ label, required, error: err, hint, children }) => (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#dc2626' }}> *</span>}
      </label>
      {children}
      {err && <p style={{ fontSize:11, color:'#dc2626', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><i className="fas fa-exclamation-circle"/>{err}</p>}
      {hint && !err && <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{hint}</p>}
    </div>
  )

  const inputStyle = (hasErr) => ({
    width:'100%', padding:'9px 12px', boxSizing:'border-box',
    border:`1.5px solid ${hasErr?'#fca5a5':'#e2e8f0'}`, borderRadius:8,
    fontSize:13, fontFamily:'inherit', outline:'none',
    background: hasErr?'#fef2f2':'#fff',
  })

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f1f5f9', white:'#fff' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:V.navy, borderRadius:'12px 12px 0 0', padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className={`fas ${isEdit?'fa-edit':'fa-plus'}`} style={{ color:'#fff', fontSize:17 }}/>
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Manage Notifications</p>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>{isEdit?'Edit Notification':'Add Notification'}</h2>
          </div>
        </div>

        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', padding:28 }}>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:20, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <i className="fas fa-exclamation-circle"/>{error}
            </div>
          )}

          {/* ── Category — card picker ── */}
          <F label="Category" required error={fieldErrors.category}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => { setForm(p=>({...p,notificationCategoryID:cat.id})); setFieldErrors(p=>({...p,category:''})) }}
                  style={{
                    display:'flex', alignItems:'center', gap:7, padding:'8px 14px',
                    borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600,
                    border: form.notificationCategoryID===cat.id ? `2px solid ${cat.border}` : '2px solid #e2e8f0',
                    background: form.notificationCategoryID===cat.id ? cat.bg : '#f8fafc',
                    color: form.notificationCategoryID===cat.id ? cat.text : '#64748b',
                    boxShadow: form.notificationCategoryID===cat.id ? `0 2px 8px ${cat.border}60` : 'none',
                    transition:'all .15s',
                  }}>
                  <i className={`fas ${cat.icon}`}/>
                  {cat.label}
                </button>
              ))}
            </div>
          </F>

          {/* ── Titles ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <F label="Title (English)" required error={fieldErrors.title}>
              <input value={form.notificationTitle}
                onChange={e=>{ setForm(p=>({...p,notificationTitle:e.target.value})); setFieldErrors(p=>({...p,title:''})) }}
                placeholder="Enter notification title..." style={inputStyle(!!fieldErrors.title)}/>
            </F>
            <F label="Title (Marathi)" hint="Optional — shown when language=Marathi">
              <input value={form.notificationTitleMarathi}
                onChange={e=>setForm(p=>({...p,notificationTitleMarathi:e.target.value}))}
                placeholder="मराठी शीर्षक..." style={inputStyle(false)}/>
            </F>
          </div>

          {/* ── Dates ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <F label="Display Start" required error={fieldErrors.startDate} hint="Format: dd-MM-yyyy HH:mm">
              <input value={form.displayStartDateTime}
                onChange={e=>{ setForm(p=>({...p,displayStartDateTime:e.target.value})); setFieldErrors(p=>({...p,startDate:''})) }}
                placeholder="25-12-2026 09:00" style={inputStyle(!!fieldErrors.startDate)}/>
            </F>
            <F label="Display End" required error={fieldErrors.endDate} hint="Format: dd-MM-yyyy HH:mm">
              <input value={form.displayEndDateTime}
                onChange={e=>{ setForm(p=>({...p,displayEndDateTime:e.target.value})); setFieldErrors(p=>({...p,endDate:''})) }}
                placeholder="31-12-2030 23:59" style={inputStyle(!!fieldErrors.endDate)}/>
            </F>
            <F label="Publish Date/Time" required error={fieldErrors.publishDate} hint="When it goes live">
              <input value={form.publishDateTime}
                onChange={e=>{ setForm(p=>({...p,publishDateTime:e.target.value})); setFieldErrors(p=>({...p,publishDate:''})) }}
                placeholder="25-12-2026 09:00" style={inputStyle(!!fieldErrors.publishDate)}/>
            </F>
          </div>

          {/* ── Content Type toggle ── */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:8 }}>
              Content Type <span style={{ color:'#dc2626' }}>*</span>
            </label>
            <div style={{ display:'inline-flex', background:'#f1f5f9', borderRadius:10, padding:3 }}>
              {[['F','fa-file-pdf','File (PDF/Doc)'],['T','fa-align-left','Text Content']].map(([val,icon,lbl]) => (
                <button key={val} type="button"
                  onClick={() => setForm(p=>({...p,contentType:val}))}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, transition:'all .15s',
                    background: form.contentType===val?V.white:'transparent',
                    color:      form.contentType===val?'#0f172a':'#64748b',
                    boxShadow:  form.contentType===val?'0 1px 6px rgba(0,0,0,.1)':'none',
                  }}>
                  <i className={`fas ${icon}`} style={{ color: form.contentType===val?V.primary:'#94a3b8' }}/>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* ── File upload ── */}
          {form.contentType === 'F' && (
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>
                File <span style={{ color:'#dc2626' }}>*</span>
              </label>
              {/* Existing file */}
              {form.fileContentURL && (
                <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', marginBottom:10 }}>
                  <i className="fas fa-check-circle" style={{ color:V.primary, fontSize:16 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#065f46' }}>Current file: {form.fileContentName}</div>
                    <a href={form.fileContentURL} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:'#059669', textDecoration:'none' }}>
                      <i className="fas fa-external-link-alt" style={{ marginRight:4 }}/>View file
                    </a>
                  </div>
                  <button onClick={()=>setForm(p=>({...p,fileContentURL:'',fileContentName:''}))}
                    style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:'#dc2626', fontSize:18 }}>×</button>
                </div>
              )}
              {/* Upload area */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${fieldErrors.file?'#fca5a5':'#cbd5e1'}`, borderRadius:10, padding:'24px', textAlign:'center', cursor:'pointer', background:fieldErrors.file?'#fef2f2':'#f8fafc', transition:'all .15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=V.primary}
                onMouseLeave={e=>e.currentTarget.style.borderColor=fieldErrors.file?'#fca5a5':'#cbd5e1'}>
                <input type="file" ref={fileRef} style={{ display:'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFileUpload(f) }}/>
                {uploading ? (
                  <><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
                  <span style={{ color:V.primary, fontSize:13, fontWeight:600 }}>Uploading...</span></>
                ) : (
                  <><i className="fas fa-cloud-upload-alt" style={{ fontSize:28, color:'#cbd5e1', display:'block', marginBottom:8 }}/>
                  <span style={{ color:'#64748b', fontSize:13, fontWeight:600 }}>Click to upload file</span>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>PDF, DOC, XLS, JPG, PNG supported</div></>
                )}
              </div>
              {fieldErrors.file && <p style={{ fontSize:11, color:'#dc2626', marginTop:4 }}><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}/>{fieldErrors.file}</p>}
            </div>
          )}

          {/* ── Text content ── */}
          {form.contentType === 'T' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
              <F label="Text Content (English)" required error={fieldErrors.text}>
                <textarea value={form.textContent}
                  onChange={e=>{ setForm(p=>({...p,textContent:e.target.value})); setFieldErrors(p=>({...p,text:''})) }}
                  rows={5} placeholder="Enter content in English..."
                  style={{ ...inputStyle(!!fieldErrors.text), resize:'vertical' }}/>
              </F>
              <F label="Text Content (Marathi)">
                <textarea value={form.textContentMarathi}
                  onChange={e=>setForm(p=>({...p,textContentMarathi:e.target.value}))}
                  rows={5} placeholder="मराठी मजकूर..."
                  style={{ ...inputStyle(false), resize:'vertical' }}/>
              </F>
            </div>
          )}

          {/* ── Settings row ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, padding:'16px', background:'#f8fafc', borderRadius:10, marginBottom:24, border:`1px solid ${V.border}` }}>
            {/* Open In New Window */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', marginBottom:6 }}>Open in New Window</label>
              <select value={form.openInNewPage} onChange={e=>setForm(p=>({...p,openInNewPage:parseInt(e.target.value)}))}
                style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
            {/* Display NEW badge */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', marginBottom:6 }}>
                Show "NEW" Badge
                {form.displayNewImage===1 && <span style={{ marginLeft:6, background:'#ef4444', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:3 }}>NEW</span>}
              </label>
              <select value={form.displayNewImage} onChange={e=>setForm(p=>({...p,displayNewImage:parseInt(e.target.value)}))}
                style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
                <option value={1}>Yes — show badge</option>
                <option value={0}>No</option>
              </select>
            </div>
            {/* Is Active */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', marginBottom:6 }}>Status</label>
              <select value={form.isActive?'1':'0'} onChange={e=>setForm(p=>({...p,isActive:e.target.value==='1'}))}
                style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            {/* Content type reminder */}
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div style={{ background:form.isActive?'#f0fdf4':'#fef2f2', border:`1px solid ${form.isActive?'#86efac':'#fecaca'}`, borderRadius:7, padding:'8px 12px', fontSize:12, fontWeight:700, color:form.isActive?'#065f46':'#dc2626', textAlign:'center' }}>
                <i className={`fas ${form.isActive?'fa-check-circle':'fa-times-circle'}`} style={{ marginRight:5 }}/>
                {form.isActive?'Will be visible':'Hidden from users'}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
            <button onClick={() => navigate('/admin/notifications')}
              style={{ background:'#6c757d', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ← Cancel
            </button>
            <button onClick={handleSave} disabled={saving||uploading}
              style={{ background:(saving||uploading)?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'10px 28px', borderRadius:8, fontSize:14, fontWeight:700, cursor:(saving||uploading)?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(5,150,105,.3)' }}>
              {saving?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<><i className="fas fa-save"/>Save Notification</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
