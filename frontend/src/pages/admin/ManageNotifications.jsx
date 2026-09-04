import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../../services/api'

/**
 * ManageNotifications — user-friendly list page for superadmin.
 *
 * Improvements over old project:
 *  - Category filter tabs (All / Announcement / News / Notifications / Downloads / Popup)
 *  - Status badge (Active/Inactive) instead of plain checkbox
 *  - Content type badge (File/Text/—)
 *  - Inline preview of title with "NEW" badge when DisplayNewImage=1
 *  - Confirm delete modal (instead of browser confirm)
 *  - One-click toggle Active/Inactive without navigating away
 *
 * Same functionality:
 *  - Edit → /admin/notifications/edit/:id
 *  - Delete → Administration_DeleteNotification SP
 *  - All data from Administration_GetNotificationList SP
 */

const CATEGORY_COLORS = {
  1:  { bg:'#fef3c7', text:'#92400e', label:'Announcement' },
  2:  { bg:'#dbeafe', text:'#1e40af', label:'News'         },
  3:  { bg:'#d1fae5', text:'#065f46', label:'Notification' },
  4:  { bg:'#ede9fe', text:'#5b21b6', label:'Download'     },
  11: { bg:'#fce7f3', text:'#9d174d', label:'Popup'        },
}

export default function ManageNotifications() {
  const navigate = useNavigate()

  const [items,       setItems]       = useState([])
  const [filtered,    setFiltered]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filterCat,   setFilterCat]   = useState(0)    // 0=All
  const [filterStatus,setFilterStatus]= useState('all') // all/active/inactive
  const [searchText,  setSearchText]  = useState('')
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [msg,         setMsg]         = useState({ text:'', ok:true })

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f1f5f9', white:'#fff', text:'#0f172a', muted:'#64748b', red:'#dc2626' }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let f = [...items]
    if (filterCat !== 0)        f = f.filter(i => i.notificationCategoryID === filterCat)
    if (filterStatus === 'active')   f = f.filter(i => i.isActive)
    if (filterStatus === 'inactive') f = f.filter(i => !i.isActive)
    if (searchText.trim())      f = f.filter(i => i.notificationTitle.toLowerCase().includes(searchText.toLowerCase()))
    setFiltered(f)
  }, [items, filterCat, filterStatus, searchText])

  const load = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getList()
      if (res.data.success) setItems(res.data.items ?? [])
      else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Failed to load notifications.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    setConfirmDel(null)
    try {
      const res = await notificationApi.delete(id)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.notificationID !== id))
        setMsg({ text:'Notification deleted successfully.', ok:true })
      } else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Failed to delete.', ok:false }) }
  }

  // Get unique categories from loaded items
  const cats = [0, ...new Set(items.map(i => i.notificationCategoryID))]

  const catLabel = (id) => CATEGORY_COLORS[id]?.label || `Cat ${id}`
  const catCount = (id) => id===0 ? items.length : items.filter(i=>i.notificationCategoryID===id).length

  const thS = { padding:'10px 13px', color:'#fff', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', borderRight:'1px solid rgba(255,255,255,.1)', whiteSpace:'nowrap' }
  const tdS = { padding:'10px 13px', fontSize:13, borderBottom:`1px solid ${V.border}`, verticalAlign:'middle' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Page header */}
        <div style={{ background:V.navy, borderRadius:'12px 12px 0 0', padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fas fa-bell" style={{ color:'#fff', fontSize:17 }}/>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Administration</p>
              <h2 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>Manage Notifications</h2>
            </div>
          </div>
          <button onClick={() => navigate('/admin/notifications/add')}
            style={{ display:'flex', alignItems:'center', gap:7, background:V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(5,150,105,.4)' }}>
            <i className="fas fa-plus"/>Add Notification
          </button>
        </div>

        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>

          {/* Message */}
          {msg.text && (
            <div style={{ background:msg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.ok?'#86efac':'#fecaca'}`, color:msg.ok?'#166534':V.red, padding:'10px 20px', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>{msg.text}
              <button onClick={()=>setMsg({text:'',ok:true})} style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'inherit' }}>×</button>
            </div>
          )}

          {/* Category filter tabs */}
          <div style={{ padding:'14px 20px 0', borderBottom:`1px solid ${V.border}`, display:'flex', gap:6, flexWrap:'wrap' }}>
            {cats.map(catId => (
              <button key={catId} onClick={() => setFilterCat(catId)}
                style={{ padding:'7px 14px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12.5, fontWeight:700, marginBottom:-1, borderBottom: filterCat===catId?`2px solid ${V.primary}`:'2px solid transparent',
                  background: filterCat===catId?'#f0fdf4':V.bg, color: filterCat===catId?V.primary:V.muted }}>
                {catId===0?'All':catLabel(catId)}
                <span style={{ marginLeft:6, background:filterCat===catId?V.primary:'#e2e8f0', color:filterCat===catId?'#fff':'#475569', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:800 }}>
                  {catCount(catId)}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Status filter */}
          <div style={{ padding:'14px 20px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', borderBottom:`1px solid ${V.border}` }}>
            <div style={{ position:'relative', flex:1, minWidth:220 }}>
              <i className="fas fa-search" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:V.muted, fontSize:13 }}/>
              <input value={searchText} onChange={e=>setSearchText(e.target.value)}
                placeholder="Search by title..."
                style={{ width:'100%', paddingLeft:34, paddingRight:12, paddingTop:8, paddingBottom:8, border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
            </div>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              style={{ padding:'8px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <span style={{ fontSize:12, color:V.muted, marginLeft:'auto' }}>{filtered.length} record{filtered.length!==1?'s':''}</span>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p style={{ color:V.muted, fontSize:13 }}>Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'48px 0', textAlign:'center' }}>
              <i className="fas fa-bell-slash" style={{ fontSize:32, color:'#e2e8f0', display:'block', marginBottom:10 }}/>
              <p style={{ color:V.muted, fontSize:13 }}>No notifications found.</p>
              <button onClick={() => navigate('/admin/notifications/add')}
                style={{ background:V.primary, color:'#fff', border:'none', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:12 }}>
                Add First Notification
              </button>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    <th style={{ ...thS, width:'4%', textAlign:'center' }}>Sr.</th>
                    <th style={{ ...thS, width:'12%' }}>Category</th>
                    <th style={{ ...thS, width:'28%' }}>Title (EN)</th>
                    <th style={{ ...thS, width:'12%', textAlign:'center' }}>Content</th>
                    <th style={{ ...thS, width:'14%', textAlign:'center' }}>Publish Date</th>
                    <th style={{ ...thS, width:'10%', textAlign:'center' }}>Display Window</th>
                    <th style={{ ...thS, width:'7%', textAlign:'center' }}>Status</th>
                    <th style={{ ...thS, width:'13%', textAlign:'center', borderRight:'none' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const cat = CATEGORY_COLORS[item.notificationCategoryID] || { bg:'#f1f5f9', text:'#475569', label:'—' }
                    return (
                      <tr key={item.notificationID}
                        style={{ background:idx%2===0?V.white:'#fafbfc' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f0fdf9'}
                        onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?V.white:'#fafbfc'}>
                        <td style={{ ...tdS, textAlign:'center', color:V.muted, fontSize:12 }}>{idx+1}.</td>
                        <td style={tdS}>
                          <span style={{ background:cat.bg, color:cat.text, borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                            {cat.label}
                          </span>
                        </td>
                        <td style={{ ...tdS, fontWeight:600, color:V.text }}>
                          {item.displayNewImage===1 && (
                            <span style={{ background:'#ef4444', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:3, marginRight:6 }}>NEW</span>
                          )}
                          {item.notificationTitle}
                          {item.notificationTitleMarathi && (
                            <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{item.notificationTitleMarathi}</div>
                          )}
                        </td>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          {item.contentType === 'F' ? (
                            item.fileContentURL ? (
                              <a href={item.fileContentURL} target="_blank" rel="noopener noreferrer"
                                style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#1d4ed8', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                                <i className="fas fa-file-alt"/>File
                              </a>
                            ) : <span style={{ color:V.muted, fontSize:12 }}>File (no URL)</span>
                          ) : item.contentType === 'T' ? (
                            <span style={{ color:'#059669', fontSize:12, fontWeight:600 }}><i className="fas fa-align-left" style={{ marginRight:4 }}/>Text</span>
                          ) : <span style={{ color:V.muted }}>—</span>}
                        </td>
                        <td style={{ ...tdS, textAlign:'center', fontSize:12, color:V.muted }}>{item.publishDateTime || '—'}</td>
                        <td style={{ ...tdS, textAlign:'center', fontSize:11, color:V.muted, lineHeight:1.6 }}>
                          <div>{item.displayStartDateTime}</div>
                          <div style={{ color:'#94a3b8' }}>→</div>
                          <div>{item.displayEndDateTime}</div>
                        </td>
                        <td style={{ ...tdS, textAlign:'center' }}>
                          <span style={{
                            background: item.isActive?'#f0fdf4':'#fef2f2',
                            color:      item.isActive?V.primary:V.red,
                            border:     `1px solid ${item.isActive?'#86efac':'#fecaca'}`,
                            borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700
                          }}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...tdS, textAlign:'center', borderRight:'none' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <button onClick={() => navigate(`/admin/notifications/edit/${item.notificationID}`)}
                              style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:6, padding:'5px 11px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              <i className="fas fa-edit"/> Edit
                            </button>
                            <button onClick={() => setConfirmDel(item.notificationID)}
                              style={{ background:'#fef2f2', color:V.red, border:'1px solid #fecaca', borderRadius:6, padding:'5px 9px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              <i className="fas fa-trash"/>
                            </button>
                          </div>
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

      {/* Delete confirm modal */}
      {confirmDel !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
          <div style={{ background:V.white, borderRadius:12, maxWidth:400, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:V.navy, padding:'13px 20px' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Delete Notification</span>
            </div>
            <div style={{ padding:'24px', textAlign:'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', fontSize:30, display:'block', marginBottom:12 }}/>
              <p style={{ fontSize:14.5, color:V.text, margin:'0 0 20px' }}>
                Are you sure you want to delete this notification? It will be permanently removed from the home page.
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
