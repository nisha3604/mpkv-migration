import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuApi } from '../../services/api'
import { MenuTopNav, PageHeader } from './MenuHome'

/**
 * AddEditLink — mirrors AddEditLinks.aspx exactly.
 * Back → ManageLinks?Directory=X
 * Save → Menu_SaveLinkDetails SP, then redirects back
 */
const DIRECTORIES = [
  'Groups','ExternalLinks','Admission','Candidate','College',
  'Administration','Reports','Fee','Menu','Counselling',
]

export default function AddEditLink() {
  const navigate   = useNavigate()
  const [sp]       = useSearchParams()

  const linkId     = sp.get('LinkID')    || '0'
  const directory  = sp.get('Directory') || ''
  const isEdit     = parseInt(linkId) > 0

  const [form, setForm] = useState({
    linkID:                parseInt(linkId),
    linkName:              '',
    linkNameMarathi:       '',
    linkDescription:       '',
    linkDescriptionMarathi:'',
    linkURL:               '#',
    linkType:              'P',
    directory:             directory,
    pageName:              '',
    queryString:           '',
    isActive:              true,
  })
  const [loading,  setLoading] = useState(isEdit)
  const [saving,   setSaving]  = useState(false)
  const [error,    setError]   = useState('')

  useEffect(() => {
    if (!isEdit) return
    menuApi.getLinkDetails(linkId)
      .then(res => {
        if (res.data.success && res.data.item) {
          const d = res.data.item
          setForm({
            linkID:                d.linkID,
            linkName:              d.linkName              || '',
            linkNameMarathi:       d.linkNameMarathi       || '',
            linkDescription:       d.linkDescription       || '',
            linkDescriptionMarathi:d.linkDescriptionMarathi|| '',
            linkURL:               d.linkURL               || '#',
            linkType:              d.linkType              || 'P',
            directory:             d.directory             || directory,
            pageName:              '',
            queryString:           '',
            isActive:              d.isActive !== false,
          })
        }
      })
      .catch(() => setError('Failed to load link details.'))
      .finally(() => setLoading(false))
  }, [linkId])

  const handleSave = async () => {
    if (!form.linkName.trim())  { setError('Link Name (English) is required.'); return }
    if (!form.linkURL.trim())   { setError('Link URL is required.'); return }
    if (!form.directory.trim()) { setError('Please select a Directory.'); return }
    setSaving(true); setError('')
    try {
      const res = await menuApi.saveLink(form)
      if (res.data.success) {
        navigate(`/admin/menu/links?Directory=${form.directory}`)
      } else setError(res.data.message || 'Failed to save.')
    } catch { setError('An error occurred.') }
    finally { setSaving(false) }
  }

  const F = ({ label, required, hint, children }) => (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{hint}</p>}
    </div>
  )
  const inputStyle = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:'#f1f5f9', minHeight:'100vh', padding:24 }}>
      <PageHeader title={isEdit ? 'Edit Link' : 'Add New Link'} />
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

        <MenuTopNav active="Manage Links" />

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:7, padding:'9px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/>{error}
          </div>
        )}

        <div style={{ maxWidth:640, margin:'0 auto' }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <F label="Link Name (English)" required>
              <input value={form.linkName} onChange={e => setForm(p=>({...p,linkName:e.target.value}))}
                placeholder="e.g. Personal Details" style={inputStyle}/>
            </F>
            <F label="Link Name (Marathi)">
              <input value={form.linkNameMarathi} onChange={e => setForm(p=>({...p,linkNameMarathi:e.target.value}))}
                placeholder="मराठी नाव" style={inputStyle}/>
            </F>
          </div>

          <F label="Link URL" required hint="Use '#' for group headers. For React routes: /candidate/personal">
            <input value={form.linkURL} onChange={e => setForm(p=>({...p,linkURL:e.target.value}))}
              placeholder="/candidate/personal" style={inputStyle}/>
          </F>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <F label="Link Type" required>
              <select value={form.linkType} onChange={e => setForm(p=>({...p,linkType:e.target.value}))}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="P">P — Page</option>
                <option value="G">G — Group Header</option>
              </select>
            </F>
            <F label="Directory" required>
              <select value={form.directory} onChange={e => setForm(p=>({...p,directory:e.target.value}))}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">Select</option>
                {DIRECTORIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </F>
            <F label="Is Active">
              <select value={form.isActive?'1':'0'} onChange={e => setForm(p=>({...p,isActive:e.target.value==='1'}))}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </F>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <F label="Description (English)">
              <input value={form.linkDescription} onChange={e => setForm(p=>({...p,linkDescription:e.target.value}))}
                placeholder="Short description" style={inputStyle}/>
            </F>
            <F label="Description (Marathi)">
              <input value={form.linkDescriptionMarathi} onChange={e => setForm(p=>({...p,linkDescriptionMarathi:e.target.value}))}
                placeholder="मराठी वर्णन" style={inputStyle}/>
            </F>
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:24 }}>
            <button onClick={() => navigate(`/admin/menu/links?Directory=${form.directory}`)}
              style={{ background:'#6c757d', color:'#fff', border:'none', padding:'9px 22px', borderRadius:7, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ← Back
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ background:saving?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'9px 28px', borderRadius:7, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
              {saving?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<><i className="fas fa-save"/>Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
