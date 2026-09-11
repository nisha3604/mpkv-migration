import { useState, useEffect } from 'react'
import { configApi } from '../../services/api'

/**
 * ManageProjectConfig — mirrors ManageProjectConfiguration.aspx.
 *
 * Layout:
 *  Card 1 (inline edit, hidden by default):
 *    Label: AppKeyDetails (read-only)
 *    Input: TextBox OR Dropdown (controlled by ControlRequired from SP)
 *    [Update] [Cancel]
 *
 *  Card 2 (grid):
 *    Sr. | Key | Current Value | Edit (pencil)
 *
 * SPs: Administration_GetProjectConfigurationList, Details, SaveProjectConfigurationDetails
 */
export default function ManageProjectConfig() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)  // ConfigDetailsResponse when editing
  const [value,    setValue]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [loadingKey, setLoadingKey] = useState(null)
  const [toast,    setToast]    = useState(null)

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const load = async () => {
    setLoading(true)
    try {
      const res = await configApi.getList()
      if (res.data.success) setItems(res.data.items ?? [])
      else showToast(res.data.message || 'Failed to load.', false)
    } catch { showToast('Failed to load configuration.', false) }
    finally { setLoading(false) }
  }

  const handleEdit = async (appKey) => {
    setLoadingKey(appKey)
    try {
      const res = await configApi.getDetails(appKey)
      if (res.data.success) {
        setEditing(res.data)
        setValue(res.data.appValue ?? '')
      } else showToast(res.data.message || 'Failed to load details.', false)
    } catch { showToast('Failed to load details.', false) }
    finally { setLoadingKey(null) }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await configApi.save({ appKey: editing.appKey, appValue: value })
      if (res.data.success) {
        showToast(res.data.message)
        setEditing(null)
        load()
      } else showToast(res.data.message || 'Save failed.', false)
    } catch { showToast('Save failed.', false) }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', danger:'#dc2626', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d' }

  const cardHeader = (text) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
    </div>
  )

  // Build options for DropDownList: 0..ControlMaxValue (same as old project)
  const dropOptions = editing?.controlRequired === 'DropDownList'
    ? Array.from({ length: (editing.controlMaxValue ?? 0) + 1 }, (_, i) => String(i))
    : []

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Edit panel — shown only when a key is selected */}
        {editing && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader('Edit Configuration')}
            <div style={{ padding:'20px', background:V.white }}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#212529', marginBottom:4 }}>Key</label>
                <div style={{ fontSize:14, fontWeight:600, color:V.navy, padding:'8px 12px', background:V.bg, border:`1px solid ${V.border}`, borderRadius:5 }}>
                  {editing.appKeyDetails || editing.appKey}
                </div>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#212529', marginBottom:5 }}>
                  Value <span style={{ color:V.danger }}>*</span>
                </label>
                {editing.controlRequired === 'DropDownList' ? (
                  <select value={value} onChange={e => setValue(e.target.value)}
                    style={{ width:'100%', maxWidth:300, padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
                    <option value="-1">Select</option>
                    {dropOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={value} onChange={e => setValue(e.target.value)}
                    style={{ width:'100%', maxWidth:400, padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=V.primary}
                    onBlur={e=>e.target.style.borderColor=V.border}/>
                )}
              </div>
            </div>
            <div style={{ padding:'12px 20px', background:V.bg, borderTop:`1px solid ${V.border}`, display:'flex', gap:12, justifyContent:'center' }}>
              <button onClick={handleUpdate} disabled={saving}
                style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'9px 30px', borderRadius:6, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#047857' }}
                onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=saving?'#d1fae5':V.primary }}>
                {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Update'}
              </button>
              <button onClick={() => setEditing(null)}
                style={{ background:'#fff', color:V.muted, border:`1.5px solid ${V.border}`, padding:'9px 24px', borderRadius:6, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Configuration list */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Project Configuration List')}
          <div style={{ background:V.white }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:48 }}>
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                <p style={{ color:V.muted, fontSize:13 }}>Loading configuration...</p>
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:V.muted, fontSize:13 }}>No configuration found.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Key','Current Value','Edit'].map((h,i) => (
                        <th key={i} style={{ padding:'9px 14px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===2?'left':i===0||i===3?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.appKey} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#f8f9fa'}>
                        <td style={{ padding:'9px 14px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                        <td style={{ padding:'9px 14px', fontWeight:600, color:'#212529' }}>{item.appKeyDetails || item.appKey}</td>
                        <td style={{ padding:'9px 14px', color:V.muted }}>{item.appValue ?? '—'}</td>
                        <td style={{ padding:'9px 14px', textAlign:'center' }}>
                          <button onClick={() => handleEdit(item.appKey)} disabled={loadingKey === item.appKey}
                            title="Edit"
                            style={{ background:'#0d6efd', color:'#fff', border:'none', padding:'5px 12px', borderRadius:5, fontSize:13, cursor:loadingKey===item.appKey?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}>
                            {loadingKey === item.appKey
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>
                              : <i className="fas fa-pencil-alt"/>}
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

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:99999, background:toast.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.ok?'#86efac':'#fecaca'}`, color:toast.ok?'#166534':V.danger, borderRadius:12, padding:'13px 20px', fontSize:13.5, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,.14)', display:'flex', alignItems:'center', gap:10, maxWidth:380, animation:'slideInRight .25s ease' }}>
          <i className={`fas ${toast.ok?'fa-check-circle':'fa-exclamation-circle'}`} style={{ fontSize:16, flexShrink:0 }}/>
          <span style={{ flex:1 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:17, color:'inherit', lineHeight:1, padding:0, marginLeft:4, opacity:.7 }}>×</button>
        </div>
      )}
      <style>{`@keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  )
}
