import { useState, useEffect, useRef } from 'react'
import { userMgmtApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * ManageUsers — mirrors ManageUsers.aspx + AddEditUsers.aspx.
 *
 * Layout (same as old project):
 *  - User Type dropdown → grid auto-refreshes
 *  - Grid: Send SMS | Edit | Activate/Deactivate | Login ID | Password | Name | Mobile | Email | Status
 *  - "+ Add New User" button → Add/Edit modal
 *  - Toast (top-right, auto-dismiss 3.5s)
 *
 * Business rules (from ManageUsers.aspx.cs):
 *  - UserTypeID 0, 61, 91 excluded from dropdown
 *  - Admin (12) cannot see/manage type 11 or 12
 *  - Password auto-generated on Add — not entered manually
 *  - Edit disabled when user is inactive
 *  - Send SMS sends decoded login+password to user's mobile
 */

const EMPTY_FORM = { userID: 0, userTypeID: -1, userName: '', userMobileNo: '', userEMailID: '' }

export default function ManageUsers() {
  const { user: me } = useAuth()
  const [userTypes,   setUserTypes]   = useState([])
  const [selTypeId,   setSelTypeId]   = useState(-1)
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [modal,       setModal]       = useState(false)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formErr,     setFormErr]     = useState({})
  const [saving,      setSaving]      = useState(false)
  const [modalErr,    setModalErr]    = useState('')
  const [toast,       setToast]       = useState(null)
  const [sendingId,   setSendingId]   = useState(null)
  const [togglingId,  setTogglingId]  = useState(null)

  useEffect(() => {
    userMgmtApi.getTypes()
      .then(res => {
        if (res.data.success) {
          setUserTypes(res.data.items ?? [])
          if (res.data.items?.length > 0) {
            setSelTypeId(parseInt(res.data.items[0].value))
          }
        }
      })
      .catch(() => showToast('Failed to load user types.', false))
  }, [])

  useEffect(() => {
    if (selTypeId > 0) loadUsers(selTypeId)
    else setItems([])
  }, [selTypeId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const loadUsers = async (typeId) => {
    setLoading(true)
    try {
      const res = await userMgmtApi.getList(typeId)
      if (res.data.success) setItems(res.data.items ?? [])
      else showToast(res.data.message || 'No records found.', false)
    } catch { showToast('Failed to load users.', false) }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, userTypeID: selTypeId })
    setFormErr({}); setModalErr('')
    setModal(true)
  }

  const openEdit = async (item) => {
    try {
      const res = await userMgmtApi.getDetails(item.userID)
      if (res.data.success && res.data.user) {
        const u = res.data.user
        setForm({ userID: u.userID, userTypeID: u.userTypeID, userName: u.userName, userMobileNo: u.userMobileNo, userEMailID: u.userEMailID })
      } else {
        setForm({ userID: item.userID, userTypeID: item.userTypeID, userName: item.userName, userMobileNo: item.userMobileNo, userEMailID: item.userEMailID })
      }
    } catch {
      setForm({ userID: item.userID, userTypeID: item.userTypeID, userName: item.userName, userMobileNo: item.userMobileNo, userEMailID: item.userEMailID })
    }
    setFormErr({}); setModalErr('')
    setModal(true)
  }

  const closeModal = () => { setModal(false); setModalErr('') }

  const validate = () => {
    const e = {}
    if (!form.userName.trim())                       e.userName    = 'Please Enter User Name.'
    if (!form.userMobileNo.trim())                   e.userMobileNo = 'Please Enter Mobile Number.'
    else if (!/^[6-9]\d{9}$/.test(form.userMobileNo.trim())) e.userMobileNo = 'Enter valid 10-digit mobile number.'
    if (form.userEMailID.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEMailID.trim()))
      e.userEMailID = 'Enter valid email address.'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErr(errs); return }
    setSaving(true); setModalErr('')
    try {
      const res = form.userID === 0
        ? await userMgmtApi.add(form)
        : await userMgmtApi.edit(form.userID, form)
      if (res.data.success) {
        showToast(res.data.message)
        closeModal()
        loadUsers(selTypeId)
      } else setModalErr(res.data.message || 'Save failed.')
    } catch (err) { setModalErr(err.response?.data?.message ?? 'Save failed.') }
    finally { setSaving(false) }
  }

  const handleToggle = async (item) => {
    setTogglingId(item.userID)
    try {
      const res = await userMgmtApi.toggle(item.userID)
      if (res.data.success) { showToast(res.data.message); loadUsers(selTypeId) }
      else showToast(res.data.message || 'Toggle failed.', false)
    } catch { showToast('Toggle failed.', false) }
    finally { setTogglingId(null) }
  }

  const handleSendSms = async (item) => {
    setSendingId(item.userID)
    try {
      const res = await userMgmtApi.sendSms(item.userID, item.userLoginID)
      showToast(res.data.message, res.data.success)
    } catch { showToast('Failed to send SMS.', false) }
    finally { setSendingId(null) }
  }

  const exportToExcel = () => {
    if (!items.length) return
    const header = ['Login ID','Name','Mobile No.','Email ID','Status']
    const rows = items.map(u => [u.userLoginID, u.userName, u.userMobileNo, u.userEMailID, u.isActive === '1' || u.isActive === 'True' ? 'Active' : 'Inactive'])
    const html = `<table><thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='UsersList.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const V = { navy:'#14212e', primary:'#059669', danger:'#dc2626', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d' }

  const cardHeader = (text, action) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
      {action}
    </div>
  )

  const inp = (key) => ({
    width:'100%', padding:'7px 10px', border:`1px solid ${formErr[key]?V.danger:V.border}`,
    borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box',
  })

  const lbl = (text, required = false) => (
    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#212529', marginBottom:5 }}>
      {text}{required && <span style={{ color:V.danger, marginLeft:2 }}>*</span>}
    </label>
  )

  const isActive = (item) => item.isActive === '1' || item.isActive === 'True' || item.isActive === 'Y'

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Filter + Add */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Manage Users',
            items.length > 0 && (
              <button onClick={exportToExcel}
                style={{ background:'#198754', color:'#fff', border:'none', padding:'7px 18px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-file-excel"/> Export to Excel
              </button>
            )
          )}
          <div style={{ padding:'16px 20px', background:V.white, display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ minWidth:220 }}>
              {lbl('User Type')}
              <select value={selTypeId} onChange={e => setSelTypeId(parseInt(e.target.value))}
                style={{ ...inp(null), cursor:'pointer', border:`1px solid ${V.border}` }}>
                <option value={-1}>— Select User Type —</option>
                {userTypes.map(t => <option key={t.value} value={t.value}>{t.text}</option>)}
              </select>
            </div>
            {selTypeId > 0 && (
              <button onClick={openAdd}
                style={{ background:V.primary, color:'#fff', border:'none', padding:'8px 18px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}
                onMouseEnter={e=>e.currentTarget.style.background='#047857'}
                onMouseLeave={e=>e.currentTarget.style.background=V.primary}>
                <i className="fas fa-plus"/> Add New User
              </button>
            )}
          </div>
        </div>

        {/* Users grid */}
        {selTypeId > 0 && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader(`Users List (${items.length} record${items.length !== 1 ? 's' : ''})`, null)}
            <div style={{ background:V.white, padding:0 }}>
              {loading ? (
                <div style={{ textAlign:'center', padding:48 }}>
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p style={{ color:V.muted, fontSize:13 }}>Loading users...</p>
                </div>
              ) : items.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:V.muted, fontSize:13 }}>No records found.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:V.navy }}>
                        {['Send SMS','Edit','Activate / Deactivate','Login ID','Password','User Name','Mobile No.','Email ID','Status'].map((h,i) => (
                          <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => {
                        const active   = isActive(item)
                        const isToggling = togglingId === item.userID
                        const isSending  = sendingId  === item.userID
                        return (
                          <tr key={item.userID} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}
                            onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                            onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#f8f9fa'}>

                            {/* Send SMS */}
                            <td style={{ padding:'8px 10px', textAlign:'center' }}>
                              <button onClick={() => handleSendSms(item)} disabled={isSending || !active}
                                title="Send Login ID & Password via SMS"
                                style={{ background:isSending?'#d1fae5':'#0dcaf0', color:isSending?'#047857':'#000', border:'none', padding:'5px 10px', borderRadius:5, fontSize:12, cursor:!active||isSending?'not-allowed':'pointer', fontFamily:'inherit', opacity:!active?0.5:1 }}>
                                {isSending ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"/> : <i className="fas fa-sms"/>}
                              </button>
                            </td>

                            {/* Edit */}
                            <td style={{ padding:'8px 10px', textAlign:'center' }}>
                              <button onClick={() => openEdit(item)} disabled={!active}
                                title="Edit User"
                                style={{ background:'#0d6efd', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:12, cursor:!active?'not-allowed':'pointer', fontFamily:'inherit', opacity:!active?0.5:1 }}>
                                <i className="fas fa-edit"/>
                              </button>
                            </td>

                            {/* Activate / Deactivate */}
                            <td style={{ padding:'8px 10px', textAlign:'center' }}>
                              <button onClick={() => handleToggle(item)} disabled={isToggling}
                                style={{ background:active?'#dc3545':'#198754', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:12, cursor:isToggling?'not-allowed':'pointer', fontFamily:'inherit', minWidth:90 }}>
                                {isToggling
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>
                                  : active ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>

                            <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:600, color:'#0d6efd' }}>{item.userLoginID}</td>
                            <td style={{ padding:'8px 12px', textAlign:'center', fontFamily:'monospace', fontSize:12.5, color:V.muted }}>{item.password || '—'}</td>
                            <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.userName}</td>
                            <td style={{ padding:'8px 12px', textAlign:'center' }}>{item.userMobileNo}</td>
                            <td style={{ padding:'8px 12px', color:V.muted, fontSize:12 }}>{item.userEMailID}</td>
                            <td style={{ padding:'8px 12px', textAlign:'center' }}>
                              <span style={{ background:active?'#d1fae5':'#fee2e2', color:active?'#065f46':'#991b1b', border:`1px solid ${active?'#86efac':'#fca5a5'}`, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
                                {active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:99999, background:toast.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.ok?'#86efac':'#fecaca'}`, color:toast.ok?'#166534':V.danger, borderRadius:12, padding:'13px 20px', fontSize:13.5, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,.14)', display:'flex', alignItems:'center', gap:10, maxWidth:400, animation:'slideInRight .25s ease' }}>
          <i className={`fas ${toast.ok?'fa-check-circle':'fa-exclamation-circle'}`} style={{ fontSize:16, flexShrink:0 }}/>
          <span style={{ flex:1 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:17, color:'inherit', lineHeight:1, padding:0, marginLeft:4, opacity:.7 }}>×</button>
        </div>
      )}
      <style>{`@keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => { if (e.target===e.currentTarget) closeModal() }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:560, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>

            <div style={{ background:V.navy, padding:'13px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <i className="fas fa-user-plus" style={{ color:'rgba(255,255,255,.7)' }}/>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{form.userID===0?'Add New User':'Edit User'}</span>
              <button onClick={closeModal} style={{ marginLeft:'auto', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:24 }}>
              {modalErr && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 14px', marginBottom:16, fontSize:13 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{modalErr}
                </div>
              )}

              {form.userID === 0 && (
                <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:'8px 14px', marginBottom:16, fontSize:12.5, color:'#713f12' }}>
                  <i className="fas fa-info-circle" style={{ marginRight:6 }}/>Password will be auto-generated and can be sent via SMS after saving.
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  {lbl('User Name', true)}
                  <input value={form.userName} onChange={e=>setForm(p=>({...p,userName:e.target.value.toUpperCase()}))}
                    placeholder="USER NAME" style={inp('userName')}
                    onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=formErr.userName?V.danger:V.border}/>
                  {formErr.userName && <div style={{ color:V.danger, fontSize:11.5, marginTop:3 }}>{formErr.userName}</div>}
                </div>
                <div>
                  {lbl('Mobile Number', true)}
                  <input value={form.userMobileNo} onChange={e=>setForm(p=>({...p,userMobileNo:e.target.value}))}
                    placeholder="10-digit mobile" maxLength={10} style={inp('userMobileNo')}
                    onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=formErr.userMobileNo?V.danger:V.border}/>
                  {formErr.userMobileNo && <div style={{ color:V.danger, fontSize:11.5, marginTop:3 }}>{formErr.userMobileNo}</div>}
                </div>
                <div>
                  {lbl('E-Mail ID')}
                  <input value={form.userEMailID} onChange={e=>setForm(p=>({...p,userEMailID:e.target.value.toLowerCase()}))}
                    placeholder="email@example.com" style={inp('userEMailID')}
                    onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=formErr.userEMailID?V.danger:V.border}/>
                  {formErr.userEMailID && <div style={{ color:V.danger, fontSize:11.5, marginTop:3 }}>{formErr.userEMailID}</div>}
                </div>
              </div>
            </div>

            <div style={{ padding:'12px 24px 20px', display:'flex', gap:10, justifyContent:'center', borderTop:`1px solid ${V.border}`, background:V.bg }}>
              <button onClick={closeModal}
                style={{ background:'#fff', color:V.muted, border:`1.5px solid ${V.border}`, padding:'9px 24px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Back
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'9px 32px', borderRadius:7, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#047857' }}
                onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=V.primary }}>
                {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : <><i className="fas fa-save"/>Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
