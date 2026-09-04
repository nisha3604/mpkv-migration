import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuApi } from '../../services/api'
import { MenuTopNav, PageHeader } from './MenuHome'

/**
 * AddEditMenu — mirrors AddEditMenus.aspx exactly.
 *
 * Functionality (same as old):
 *  - Edit (MenuID > 0): loads existing menu details, Link dropdown is DISABLED
 *  - Add (MenuID = 0): Link dropdown shows only AVAILABLE links (not yet assigned)
 *  - Back → returns to ManageMenus (ParentMenuID>0) or ManageGroups (ParentMenuID=0)
 *  - Save → calls Menu_SaveMenuDetails SP, then redirects back
 *
 * Fields: Link, Display Start/End DateTime, Open In New Window, Display New Image, Is Active
 */
export default function AddEditMenu() {
  const navigate    = useNavigate()
  const [sp]        = useSearchParams()

  const menuId      = sp.get('MenuID')      || '0'
  const userTypeId  = sp.get('UserTypeID')  || '0'
  const parentMenuId= sp.get('ParentMenuID')|| '0'
  const isEdit      = parseInt(menuId) > 0
  const isGroup     = parseInt(parentMenuId) === 0  // Groups page flow

  const [links,    setLinks]   = useState([])
  const [form,     setForm]    = useState({
    menuID:               parseInt(menuId),
    userTypeID:           parseInt(userTypeId),
    parentMenuID:         parseInt(parentMenuId),
    linkID:               -1,
    displayStartDateTime: '',
    displayEndDateTime:   '',
    target:               '',
    isNew:                false,
    isActive:             true,
  })
  const [loading,  setLoading] = useState(isEdit)
  const [saving,   setSaving]  = useState(false)
  const [error,    setError]   = useState('')

  // Load available / existing links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        if (isEdit) {
          // Edit: show all links in the group (mirror: GetMenusList for link picker)
          const res = await menuApi.getMenusList(parseInt(userTypeId), parseInt(parentMenuId))
          setLinks(res.data.items?.map(i => ({ linkID: i.linkID, linkName: i.linkName })) ?? [])
        } else {
          // Add: show only available (not yet assigned)
          const res = await menuApi.getAvailable(parseInt(userTypeId), parseInt(parentMenuId))
          setLinks(res.data.items ?? [])
        }
      } catch { /* non-critical */ }
    }
    fetchLinks()
  }, [])

  // Load existing menu details for edit
  useEffect(() => {
    if (!isEdit) return
    menuApi.getMenuDetails(menuId)
      .then(res => {
        if (res.data.success && res.data.item) {
          const d = res.data.item
          setForm(p => ({
            ...p,
            linkID:               d.linkID,
            displayStartDateTime: d.displayStartDateTime || '',
            displayEndDateTime:   d.displayEndDateTime   || '',
            target:               d.target               || '',
            isNew:                d.isNew                || false,
            isActive:             d.isActive             !== false,
          }))
        }
      })
      .catch(() => setError('Failed to load menu details.'))
      .finally(() => setLoading(false))
  }, [menuId])

  const handleBack = () => {
    if (parseInt(parentMenuId) > 0) {
      navigate(`/admin/menu/menus?UserTypeID=${userTypeId}&ParentMenuID=${parentMenuId}`)
    } else {
      navigate(`/admin/menu/groups?UserTypeID=${userTypeId}`)
    }
  }

  const handleSave = async () => {
    if (form.linkID === -1 || form.linkID === '-1') { setError('Please select a Link.'); return }
    if (!form.displayStartDateTime) { setError('Please enter Display Start Date Time.'); return }
    if (!form.displayEndDateTime)   { setError('Please enter Display End Date Time.'); return }
    setSaving(true); setError('')
    try {
      const res = await menuApi.saveMenu({
        ...form,
        displayStartDateTime: form.displayStartDateTime,
        displayEndDateTime:   form.displayEndDateTime,
      })
      if (res.data.success) {
        if (parseInt(parentMenuId) > 0) {
          navigate(`/admin/menu/menus?UserTypeID=${userTypeId}&ParentMenuID=${parentMenuId}`)
        } else {
          navigate(`/admin/menu/groups?UserTypeID=${userTypeId}`)
        }
      } else setError(res.data.message || 'Failed to save.')
    } catch { setError('An error occurred.') }
    finally { setSaving(false) }
  }

  const F = ({ label, required, children }) => (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#dc2626' }}> *</span>}
      </label>
      {children}
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
      <PageHeader title={isEdit ? 'Edit Menu' : (isGroup ? 'Add New Group' : 'Add New Menu')} />
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

        {/* Top nav — highlight correct tab */}
        <MenuTopNav active={isGroup ? 'Manage Groups' : 'Manage Menus'} />

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:7, padding:'9px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle"/>{error}
          </div>
        )}

        <div style={{ maxWidth:560, margin:'0 auto' }}>

          <F label="Link" required>
            <select value={form.linkID}
              disabled={isEdit}
              onChange={e => setForm(p => ({ ...p, linkID: parseInt(e.target.value) }))}
              style={{ ...inputStyle, background: isEdit ? '#f8fafc' : '#fff', cursor: isEdit ? 'not-allowed' : 'pointer' }}>
              <option value="-1">Select</option>
              {links.map(l => <option key={l.linkID} value={l.linkID}>{l.linkName}</option>)}
            </select>
          </F>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <F label="Display Start Date Time" required>
              <input type="text" value={form.displayStartDateTime}
                placeholder="dd-MM-yyyy HH:mm"
                onChange={e => setForm(p => ({ ...p, displayStartDateTime: e.target.value }))}
                style={inputStyle}/>
            </F>
            <F label="Display End Date Time" required>
              <input type="text" value={form.displayEndDateTime}
                placeholder="dd-MM-yyyy HH:mm"
                onChange={e => setForm(p => ({ ...p, displayEndDateTime: e.target.value }))}
                style={inputStyle}/>
            </F>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <F label="Open In New Window">
              <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">No</option>
                <option value="_blank">Yes (_blank)</option>
              </select>
            </F>
            <F label="Display New Image">
              <select value={form.isNew ? '1' : '0'} onChange={e => setForm(p => ({ ...p, isNew: e.target.value==='1' }))} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </F>
            <F label="Is Active">
              <select value={form.isActive ? '1' : '0'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value==='1' }))} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </F>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:24 }}>
            <button onClick={handleBack}
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
