import { useState, useEffect } from 'react'
import { activityApi } from '../../services/api'

/**
 * ManageActivityStatus — mirrors ManageActivityStatus.aspx.
 *
 * User-friendly improvements:
 *  - All activities shown as cards in a grid (not a flat table)
 *  - Click any card to expand inline edit form (not a separate page)
 *  - Live status indicator: OPEN (green) / CLOSED (red) based on current datetime vs window
 *  - Date helpers show "X days remaining" or "Closed X days ago"
 *
 * Same functionality:
 *  - Administration_GetActivityStatusList SP
 *  - Administration_SaveActivityStatusDetails SP
 *  - Date format: dd-MM-yyyy HH:mm (same as old project)
 */

// Activity display config — icon + colour per activity type
const ACTIVITY_CONFIG = {
  NewCandidateRegistration      : { icon:'fa-user-plus',      color:'#059669', label:'Candidate Registration'       },
  ApplicationFormFilling        : { icon:'fa-file-alt',       color:'#0ea5e9', label:'Application Form Filling'      },
  ApplicationFormUnlock         : { icon:'fa-lock-open',      color:'#f59e0b', label:'Application Form Unlock'       },
  CheckPaymentHistory           : { icon:'fa-history',        color:'#6366f1', label:'Check Payment History'         },
  ResetCandidatePassword        : { icon:'fa-key',            color:'#8b5cf6', label:'Reset Candidate Password'      },
  ChangeMobileEMail             : { icon:'fa-mobile-alt',     color:'#ec4899', label:'Change Mobile / E-Mail'        },
  ChangeSecurityQuestion        : { icon:'fa-shield-alt',     color:'#14b8a6', label:'Change Security Question'      },
  PrintApplicationForm          : { icon:'fa-print',          color:'#64748b', label:'Print Application Form'        },
  CheckDocumentVerificationStatus:{ icon:'fa-check-double',   color:'#d97706', label:'Document Verification Status'  },
  CancelAdmission               : { icon:'fa-ban',            color:'#dc2626', label:'Cancel Admission'              },
}

function isOpen(startStr, endStr) {
  try {
    const parse = s => { const [d,m,y,hm] = [...s.split(' ')[0].split('-'), s.split(' ')[1]||'00:00']; return new Date(`${y}-${m}-${d}T${hm}`) }
    const now = new Date(), start = parse(startStr), end = parse(endStr)
    return now >= start && now <= end
  } catch { return false }
}

function daysInfo(startStr, endStr) {
  try {
    const parse = s => { const [d,m,y,hm] = [...s.split(' ')[0].split('-'), s.split(' ')[1]||'00:00']; return new Date(`${y}-${m}-${d}T${hm}`) }
    const now = new Date(), end = parse(endStr)
    const diff = Math.round((end - now) / 86400000)
    if (diff > 0) return { text:`${diff} day${diff!==1?'s':''} remaining`, color:'#059669' }
    if (diff === 0) return { text:'Closes today', color:'#f59e0b' }
    return { text:`Closed ${Math.abs(diff)} day${Math.abs(diff)!==1?'s':''} ago`, color:'#dc2626' }
  } catch { return { text:'', color:'#64748b' } }
}

export default function ManageActivityStatus() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)  // activityName being edited
  const [form,    setForm]    = useState({ activityName:'', activityStartDateTime:'', activityEndDateTime:'' })
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState({ text:'', ok:true })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await activityApi.getList()
      if (res.data.success) setItems(res.data.items ?? [])
      else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Failed to load.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleEdit = (item) => {
    setEditing(item.activityName)
    setForm({ activityName:item.activityName, activityStartDateTime:item.activityStartDateTime, activityEndDateTime:item.activityEndDateTime })
    setMsg({ text:'', ok:true })
  }

  const handleSave = async () => {
    if (!form.activityStartDateTime.trim() || !form.activityEndDateTime.trim()) {
      setMsg({ text:'Please enter both Start and End date/time.', ok:false }); return
    }
    setSaving(true); setMsg({ text:'', ok:true })
    try {
      const res = await activityApi.save(form)
      if (res.data.success) {
        setMsg({ text:'Activity status saved successfully.', ok:true })
        setEditing(null)
        load()
      } else setMsg({ text: res.data.message, ok:false })
    } catch { setMsg({ text:'Save failed.', ok:false }) }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f1f5f9', white:'#fff', muted:'#64748b' }
  const inputStyle = { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:V.navy, borderRadius:'12px 12px 0 0', padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-calendar-alt" style={{ color:'#fff', fontSize:17 }}/>
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Administration</p>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>Manage Activity Status</h2>
          </div>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginLeft:'auto' }}>
            Controls when each feature is open/closed for candidates
          </p>
        </div>

        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

          {msg.text && (
            <div style={{ background:msg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.ok?'#86efac':'#fecaca'}`, color:msg.ok?'#166534':'#dc2626', borderRadius:7, padding:'9px 16px', marginBottom:20, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>{msg.text}
              <button onClick={()=>setMsg({text:'',ok:true})} style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'inherit' }}>×</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p style={{ color:V.muted, fontSize:13 }}>Loading activities...</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
              {items.map(item => {
                const cfg   = ACTIVITY_CONFIG[item.activityName] || { icon:'fa-cog', color:'#64748b', label:item.activityDetails }
                const open  = isOpen(item.activityStartDateTime, item.activityEndDateTime)
                const days  = daysInfo(item.activityStartDateTime, item.activityEndDateTime)
                const isEd  = editing === item.activityName

                return (
                  <div key={item.activityName}
                    style={{ border:`1.5px solid ${isEd?cfg.color:V.border}`, borderRadius:12, overflow:'hidden', boxShadow:isEd?`0 4px 16px ${cfg.color}20`:'0 1px 6px rgba(0,0,0,.05)', transition:'all .2s' }}>

                    {/* Card header */}
                    <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${V.border}` }}>
                      <div style={{ width:38, height:38, borderRadius:9, background:`${cfg.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className={`fas ${cfg.icon}`} style={{ color:cfg.color, fontSize:16 }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', lineHeight:1.3 }}>{cfg.label}</div>
                        <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{item.activityName}</div>
                      </div>
                      {/* Open/Closed badge */}
                      <span style={{ background:open?'#f0fdf4':'#fef2f2', color:open?'#059669':'#dc2626', border:`1px solid ${open?'#86efac':'#fecaca'}`, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {open?'OPEN':'CLOSED'}
                      </span>
                    </div>

                    {/* Date info */}
                    {!isEd && (
                      <div style={{ padding:'12px 16px', background:'#fafbfc' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Start</div>
                            <div style={{ fontSize:12.5, fontWeight:600, color:'#0f172a' }}>{item.activityStartDateTime}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>End</div>
                            <div style={{ fontSize:12.5, fontWeight:600, color:'#0f172a' }}>{item.activityEndDateTime}</div>
                          </div>
                        </div>
                        {days.text && (
                          <div style={{ fontSize:11.5, fontWeight:600, color:days.color }}>
                            <i className="fas fa-clock" style={{ marginRight:5 }}/>{days.text}
                          </div>
                        )}
                        <button onClick={() => handleEdit(item)}
                          style={{ marginTop:10, width:'100%', background:V.white, color:cfg.color, border:`1.5px solid ${cfg.color}`, borderRadius:7, padding:'7px 0', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background=`${cfg.color}10` }}
                          onMouseLeave={e=>{ e.currentTarget.style.background=V.white }}>
                          <i className="fas fa-edit" style={{ marginRight:6 }}/>Edit Window
                        </button>
                      </div>
                    )}

                    {/* Inline edit form */}
                    {isEd && (
                      <div style={{ padding:'14px 16px', background:`${cfg.color}08` }}>
                        <p style={{ fontSize:11, color:V.muted, marginBottom:10, fontWeight:600 }}>
                          Format: <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:3 }}>dd-MM-yyyy HH:mm</code>
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                          <div>
                            <label style={{ display:'block', fontSize:11, fontWeight:600, color:V.muted, marginBottom:4 }}>Start Date/Time</label>
                            <input value={form.activityStartDateTime}
                              onChange={e=>setForm(p=>({...p,activityStartDateTime:e.target.value}))}
                              placeholder="25-12-2026 09:00" style={inputStyle}/>
                          </div>
                          <div>
                            <label style={{ display:'block', fontSize:11, fontWeight:600, color:V.muted, marginBottom:4 }}>End Date/Time</label>
                            <input value={form.activityEndDateTime}
                              onChange={e=>setForm(p=>({...p,activityEndDateTime:e.target.value}))}
                              placeholder="31-12-2030 23:59" style={inputStyle}/>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => setEditing(null)}
                            style={{ flex:1, background:'#6c757d', color:'#fff', border:'none', padding:'8px 0', borderRadius:7, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            Cancel
                          </button>
                          <button onClick={handleSave} disabled={saving}
                            style={{ flex:2, background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'8px 0', borderRadius:7, fontSize:12.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            {saving?<><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<><i className="fas fa-save"/>Save</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
