import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuApi } from '../../services/api'

/**
 * ManageMenu — mirrors Menu/MenuHome.aspx in old project.
 *
 * Two-level view:
 *  1. Select UserType (dropdown) — loads top-level parent menus
 *  2. Click a parent → loads its children (sub-menus)
 *
 * Operations per row:
 *  - Toggle IsActive (activate/deactivate inline)
 *  - Edit (opens AddEditMenu page)
 *  - Delete (set IsActive=false permanently)
 *  - Drag-to-reorder SeqNo (saved via Menu_SaveMenusActiveStatus)
 *
 * Two tabs: Menus | Links
 *  - Links tab: manage Menu_MasterLinks (LinkName EN+MR, LinkURL, Directory)
 */

const USER_TYPES = [
  { value: 0,  label: 'Public (Home Page Nav)'        },
  { value: 91, label: 'Candidate (UserTypeID=91)'      },
  { value: 61, label: 'College (UserTypeID=61)'        },
  { value: 11, label: 'Super Admin (UserTypeID=11)'    },
  { value: 12, label: 'Admin (UserTypeID=12)'          },
]

export default function ManageMenu() {
  const navigate = useNavigate()

  const [tab,          setTab]          = useState('menus')   // 'menus' | 'links'
  const [userTypeId,   setUserTypeId]   = useState(61)
  const [parentMenuId, setParentMenuId] = useState(0)
  const [parents,      setParents]      = useState([])        // top-level groups
  const [items,        setItems]        = useState([])        // current list
  const [links,        setLinks]        = useState([])        // Menu_MasterLinks
  const [loading,      setLoading]      = useState(false)
  const [msg,          setMsg]          = useState({ text:'', ok:true })
  const [confirmDel,   setConfirmDel]   = useState(null)      // menuId to delete

  const V = {
    navy:'#14212e', primary:'#059669', red:'#dc2626',
    border:'#e2e8f0', bg:'#f1f5f9', white:'#fff',
    text:'#0f172a', muted:'#64748b',
  }

  // ── Load groups (parents) when userType changes ──────────────────────────
  useEffect(() => {
    setParentMenuId(0)
    setItems([])
    loadParents(userTypeId)
  }, [userTypeId])

  // ── Load items when parent changes ────────────────────────────────────────
  useEffect(() => {
    loadItems(userTypeId, parentMenuId)
  }, [userTypeId, parentMenuId])

  // ── Load links when tab = links ───────────────────────────────────────────
  useEffect(() => {
    if (tab === 'links') loadLinks()
  }, [tab])

  const loadParents = async (utId) => {
    try {
      const res = await menuApi.getGroups(utId)
      if (res.data.success) setParents(res.data.items ?? [])
    } catch { /* non-critical */ }
  }

  const loadItems = async (utId, pId) => {
    setLoading(true)
    try {
      const res = await menuApi.getMenusList(utId, pId)
      if (res.data.success) setItems(res.data.items ?? [])
    } catch { setMsg({ text:'Failed to load menus.', ok:false }) }
    finally { setLoading(false) }
  }

  const loadLinks = async () => {
    setLoading(true)
    try {
      const res = await menuApi.getLinks()
      if (res.data.success) setLinks(res.data.items ?? [])
    } catch { setMsg({ text:'Failed to load links.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleToggleActive = async (item) => {
    try {
      const res = await menuApi.reorderMenus({
        items: [{ menuID: item.menuID, seqNo: item.seqNo, isActive: !item.isActive }]
      })
      if (res.data.success) {
        setItems(prev => prev.map(m => m.menuID === item.menuID ? { ...m, isActive: !m.isActive } : m))
        setMsg({ text: `Menu item ${item.isActive ? 'deactivated' : 'activated'}.`, ok:true })
      } else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Failed.', ok:false }) }
  }

  const handleDelete = async (menuId) => {
    setConfirmDel(null)
    try {
      const res = await menuApi.deleteMenu(menuId)
      if (res.data.success) {
        setItems(prev => prev.filter(m => m.menuID !== menuId))
        setMsg({ text:'Menu item deleted.', ok:true })
      } else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Failed to delete.', ok:false }) }
  }

  const handleMoveUp = async (idx) => {
    if (idx === 0) return
    const arr = [...items]
    ;[arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]
    const updated = arr.map((m, i) => ({ ...m, seqNo: i + 1 }))
    setItems(updated)
    await menuApi.reorderMenus({ items: updated.map(m => ({ menuID: m.menuID, seqNo: m.seqNo, isActive: m.isActive })) })
  }

  const handleMoveDown = async (idx) => {
    if (idx === items.length - 1) return
    const arr = [...items]
    ;[arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]
    const updated = arr.map((m, i) => ({ ...m, seqNo: i + 1 }))
    setItems(updated)
    await menuApi.reorderMenus({ items: updated.map(m => ({ menuID: m.menuID, seqNo: m.seqNo, isActive: m.isActive })) })
  }

  const thS = { padding:'10px 13px', color:V.white, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,.1)' }
  const tdS = { padding:'9px 13px', fontSize:13, borderBottom:`1px solid ${V.border}`, verticalAlign:'middle' }

  return (
    <div style={{ background:V.bg, minHeight:'100vh', padding:'20px 20px 40px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Page header */}
        <div style={{ background:V.navy, borderRadius:14, padding:'16px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fas fa-bars" style={{ color:'#fff', fontSize:18 }}/>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Administration</p>
              <h2 style={{ color:'#fff', fontWeight:800, fontSize:18, margin:0 }}>Manage Menu</h2>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/menu/add?userTypeId=${userTypeId}&parentMenuId=${parentMenuId}`)}
            style={{ display:'flex', alignItems:'center', gap:7, background:V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <i className="fas fa-plus"/>Add Menu Item
          </button>
        </div>

        {/* Message */}
        {msg.text && (
          <div style={{ background:msg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.ok?'#86efac':'#fecaca'}`, color:msg.ok?'#166534':'#dc2626', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>
            {msg.text}
            <button onClick={()=>setMsg({text:'',ok:true})} style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:'inherit', fontSize:16, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:16 }}>
          {[['menus','fa-bars','Menus'],['links','fa-link','Links (Master)']].map(([key,icon,label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                background:tab===key?V.navy:'#fff', color:tab===key?'#fff':V.muted, boxShadow:tab===key?'none':'0 1px 4px rgba(0,0,0,.06)' }}>
              <i className={`fas ${icon}`}/>{label}
            </button>
          ))}
        </div>

        {/* ── MENUS TAB ────────────────────────────────────────────────────── */}
        {tab === 'menus' && (
          <div style={{ background:V.white, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>

            {/* Filters row */}
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              {/* UserType selector */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:V.muted, display:'block', marginBottom:4 }}>User Type</label>
                <select value={userTypeId} onChange={e => setUserTypeId(parseInt(e.target.value))}
                  style={{ padding:'8px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', cursor:'pointer', minWidth:220 }}>
                  {USER_TYPES.map(ut => <option key={ut.value} value={ut.value}>{ut.label}</option>)}
                </select>
              </div>

              {/* Parent group selector */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:V.muted, display:'block', marginBottom:4 }}>Parent Group</label>
                <select value={parentMenuId} onChange={e => setParentMenuId(parseInt(e.target.value))}
                  style={{ padding:'8px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', cursor:'pointer', minWidth:220 }}>
                  <option value={0}>— Top Level (Groups) —</option>
                  {parents.map(p => <option key={p.menuID} value={p.menuID}>{p.linkName}</option>)}
                </select>
              </div>

              <div style={{ marginLeft:'auto', fontSize:12, color:V.muted }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding:'40px 0', textAlign:'center' }}>
                <i className="fas fa-bars" style={{ fontSize:28, color:'#e2e8f0', display:'block', marginBottom:10 }}/>
                <p style={{ color:V.muted, fontSize:13 }}>No menu items found. Click "Add Menu Item" to create one.</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      <th style={{ ...thS, width:'4%', textAlign:'center' }}>Seq</th>
                      <th style={{ ...thS, width:'28%' }}>Link Name</th>
                      <th style={{ ...thS, width:'28%' }}>Link URL</th>
                      <th style={{ ...thS, width:'12%' }}>Group</th>
                      <th style={{ ...thS, width:'8%', textAlign:'center' }}>Target</th>
                      <th style={{ ...thS, width:'7%', textAlign:'center' }}>Active</th>
                      <th style={{ ...thS, width:'13%', textAlign:'center', borderRight:'none' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.menuID}
                        style={{ background:idx%2===0?V.white:'#fafbfc', borderBottom:`1px solid ${V.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f0fdf9'}
                        onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?V.white:'#fafbfc'}>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                            <button onClick={() => handleMoveUp(idx)} disabled={idx===0}
                              style={{ background:'transparent', border:'none', cursor:idx===0?'not-allowed':'pointer', color:idx===0?'#cbd5e1':'#64748b', padding:2, fontSize:11 }}>
                              <i className="fas fa-chevron-up"/>
                            </button>
                            <span style={{ fontSize:12, fontWeight:700, color:V.muted }}>{item.seqNo}</span>
                            <button onClick={() => handleMoveDown(idx)} disabled={idx===items.length-1}
                              style={{ background:'transparent', border:'none', cursor:idx===items.length-1?'not-allowed':'pointer', color:idx===items.length-1?'#cbd5e1':'#64748b', padding:2, fontSize:11 }}>
                              <i className="fas fa-chevron-down"/>
                            </button>
                          </div>
                        </td>
                        <td style={{ ...tdS, fontWeight:600, color:V.text }}>
                          {item.isNew && <span style={{ background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, marginRight:6 }}>NEW</span>}
                          {item.linkName}
                        </td>
                        <td style={{ ...tdS, color:V.muted, fontSize:12, fontFamily:'monospace', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={item.linkURL}>
                          {item.linkURL || '—'}
                        </td>
                        <td style={{ ...tdS }}>
                          <span style={{ background:'#f1f5f9', color:V.muted, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4 }}>
                            {item.groupName || '—'}
                          </span>
                        </td>
                        <td style={{ ...tdS, textAlign:'center', fontSize:12, color:V.muted }}>
                          {item.target || '—'}
                        </td>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          <button onClick={() => handleToggleActive(item)}
                            style={{ background:item.isActive?'#f0fdf4':'#fef2f2', color:item.isActive?'#059669':'#dc2626', border:`1px solid ${item.isActive?'#86efac':'#fecaca'}`, borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ ...tdS, textAlign:'center', borderRight:'none' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <button
                              onClick={() => navigate(`/admin/menu/edit/${item.menuID}?userTypeId=${userTypeId}&parentMenuId=${parentMenuId}`)}
                              style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              <i className="fas fa-edit"/> Edit
                            </button>
                            <button onClick={() => setConfirmDel(item.menuID)}
                              style={{ background:'#fef2f2', color:V.red, border:'1px solid #fecaca', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              <i className="fas fa-trash"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── LINKS TAB ─────────────────────────────────────────────────────── */}
        {tab === 'links' && (
          <div style={{ background:V.white, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, fontSize:15, color:V.text }}>Master Links</span>
              <button onClick={() => navigate('/admin/menu/link/add')}
                style={{ display:'flex', alignItems:'center', gap:6, background:V.primary, color:'#fff', border:'none', borderRadius:7, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                <i className="fas fa-plus"/>Add Link
              </button>
            </div>

            {loading ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Link ID','Link Name (EN)','Link Name (MR)','Link URL','Type','Directory','Active','Actions'].map((h,i) => (
                        <th key={i} style={{ ...thS, borderRight: i===7?'none':thS.borderRight }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link, idx) => (
                      <tr key={link.linkID} style={{ background:idx%2===0?V.white:'#fafbfc', borderBottom:`1px solid ${V.border}` }}>
                        <td style={{ ...tdS, fontWeight:700, color:V.muted }}>{link.linkID}</td>
                        <td style={{ ...tdS, fontWeight:600, color:V.text }}>{link.linkName}</td>
                        <td style={{ ...tdS, color:V.muted }}>{link.linkNameMarathi || '—'}</td>
                        <td style={{ ...tdS, color:V.muted, fontSize:11, fontFamily:'monospace', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={link.linkURL}>{link.linkURL}</td>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          <span style={{ background:'#f1f5f9', padding:'2px 7px', borderRadius:4, fontSize:11, fontWeight:700, color:V.muted }}>{link.linkType}</span>
                        </td>
                        <td style={{ ...tdS, fontSize:12, color:V.muted }}>{link.directory || '—'}</td>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          <span style={{ color: link.isActive ? V.primary : V.red, fontWeight:700, fontSize:11 }}>
                            {link.isActive ? '✓' : '✗'}
                          </span>
                        </td>
                        <td style={{ ...tdS, borderRight:'none' }}>
                          <button onClick={() => navigate(`/admin/menu/link/edit/${link.linkID}`)}
                            style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            <i className="fas fa-edit"/> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {links.length === 0 && (
                      <tr><td colSpan={8} style={{ padding:'28px 0', textAlign:'center', color:V.muted }}>No links found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ────────────────────────────────────────────── */}
      {confirmDel !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
          <div style={{ background:V.white, borderRadius:12, maxWidth:380, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:V.navy, padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Delete Menu Item</span>
            </div>
            <div style={{ padding:'24px', textAlign:'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', fontSize:30, display:'block', marginBottom:12 }}/>
              <p style={{ fontSize:14.5, color:V.text, margin:'0 0 20px' }}>
                Are you sure you want to delete this menu item? It will be deactivated and hidden from all users.
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={() => setConfirmDel(null)}
                  style={{ background:'#f1f5f9', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDel)}
                  style={{ background:V.red, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
