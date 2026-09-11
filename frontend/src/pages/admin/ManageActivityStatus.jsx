import { useState, useEffect, useRef } from 'react'
import { activityApi } from '../../services/api'
/**
 * ManageActivityStatus — mirrors ManageActivityStatus.aspx.
 *
 * UX:
 *  - Cards grid showing each activity with OPEN/CLOSED badge + date info
 *  - Click "Edit Window" → opens a modal popup
 *  - Modal behaviour depends on current status:
 *
 *    OPEN activity:
 *      - Shows current start/end dates (editable)
 *      - "Save" button  → saves edited dates as-is
 *      - "Close Activity" button (red) → sets EndDateTime = now-1min → saves → status flips to CLOSED
 *
 *    CLOSED activity:
 *      - Shows current start/end dates (editable)
 *      - "Save" button  → saves edited dates as-is
 *      - "Open Activity" button (green) → sets StartDateTime = now, EndDateTime = far future → saves → status flips to OPEN
 *
 *  - ✕ button dismisses modal without saving
 *
 * SPs: Administration_GetActivityStatusList, Administration_SaveActivityStatusDetails
 * Date format: dd-MM-yyyy HH:mm  (same as old project)
 */

const ACTIVITY_CONFIG = {
  NewCandidateRegistration       : { icon:'fa-user-plus',    color:'#059669', label:'Candidate Registration'        },
  ApplicationFormFilling         : { icon:'fa-file-alt',     color:'#0ea5e9', label:'Application Form Filling'      },
  ApplicationFormUnlock          : { icon:'fa-lock-open',    color:'#f59e0b', label:'Application Form Unlock'       },
  CheckPaymentHistory            : { icon:'fa-history',      color:'#6366f1', label:'Check Payment History'         },
  ResetCandidatePassword         : { icon:'fa-key',          color:'#8b5cf6', label:'Reset Candidate Password'      },
  ChangeMobileEMail              : { icon:'fa-mobile-alt',   color:'#ec4899', label:'Change Mobile / E-Mail'        },
  ChangeSecurityQuestion         : { icon:'fa-shield-alt',   color:'#14b8a6', label:'Change Security Question'      },
  PrintApplicationForm           : { icon:'fa-print',        color:'#64748b', label:'Print Application Form'        },
  CheckDocumentVerificationStatus: { icon:'fa-check-double', color:'#d97706', label:'Document Verification Status'  },
  CancelAdmission                : { icon:'fa-ban',          color:'#dc2626', label:'Cancel Admission'              },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDt(s) {
  if (!s) return null
  try {
    const [date, time = '00:00'] = s.split(' ')
    const [d, m, y] = date.split('-')
    return new Date(`${y}-${m}-${d}T${time}`)
  } catch { return null }
}

function formatDt(dt) {
  const pad = n => String(n).padStart(2, '0')
  return `${pad(dt.getDate())}-${pad(dt.getMonth()+1)}-${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function isOpen(startStr, endStr) {
  const now = new Date(), start = parseDt(startStr), end = parseDt(endStr)
  if (!start || !end) return false
  return now >= start && now <= end
}

function daysInfo(endStr) {
  const now = new Date(), end = parseDt(endStr)
  if (!end) return { text: '', color: '#64748b' }
  const diff = Math.round((end - now) / 86400000)
  if (diff > 0)  return { text: `${diff} day${diff !== 1 ? 's' : ''} remaining`, color: '#059669' }
  if (diff === 0) return { text: 'Closes today', color: '#f59e0b' }
  return { text: `Closed ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`, color: '#dc2626' }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ManageActivityStatus() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // { item, cfg, open } — null = closed
  const [form,    setForm]    = useState({ activityName:'', activityStartDateTime:'', activityEndDateTime:'' })
  const [saving,  setSaving]  = useState(false)
  const [saveMsg, setSaveMsg] = useState({ text:'', ok:true })
  const [toast,   setToast]   = useState(null)   // { msg, ok } — auto-dismisses after 3.5s
  const startRef = useRef(null)
  const endRef   = useRef(null)

  useEffect(() => { load() }, [])

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const load = async () => {
    setLoading(true)
    try {
      const res = await activityApi.getList()
      if (res.data.success) setItems(res.data.items ?? [])
      else showToast(res.data.message || 'Failed to load.', false)
    } catch { showToast('Failed to load.', false) }
    finally { setLoading(false) }
  }

  // Open the modal
  const openModal = (item) => {
    const cfg  = ACTIVITY_CONFIG[item.activityName] || { icon:'fa-cog', color:'#64748b', label: item.activityDetails }
    const open = isOpen(item.activityStartDateTime, item.activityEndDateTime)
    setForm({
      activityName          : item.activityName,
      activityStartDateTime : item.activityStartDateTime,
      activityEndDateTime   : item.activityEndDateTime,
    })
    setSaveMsg({ text:'', ok:true })
    setModal({ item, cfg, open })
  }

  const closeModal = () => { setModal(null); setSaveMsg({ text:'', ok:true }) }

  // Read current input values from refs (avoids stale state from onBlur)
  const getCurrentForm = () => ({
    activityName          : form.activityName,
    activityStartDateTime : startRef.current?.value ?? form.activityStartDateTime,
    activityEndDateTime   : endRef.current?.value   ?? form.activityEndDateTime,
  })

  // Save whatever is in the inputs
  const handleSave = async () => {
    const payload = getCurrentForm()
    if (!payload.activityStartDateTime.trim() || !payload.activityEndDateTime.trim()) {
      setSaveMsg({ text: 'Please enter both Start and End date/time.', ok: false }); return
    }
    await doSave(payload)
  }

  // Quick-close: set EndDateTime = now minus 1 minute
  const handleQuickClose = async () => {
    const past    = new Date(Date.now() - 60000)  // 1 min ago
    const payload = {
      activityName          : form.activityName,
      activityStartDateTime : startRef.current?.value ?? form.activityStartDateTime,
      activityEndDateTime   : formatDt(past),
    }
    await doSave(payload)
  }

  // Quick-open: set StartDateTime = now, EndDateTime = 31-12-2099 23:59
  const handleQuickOpen = async () => {
    const payload = {
      activityName          : form.activityName,
      activityStartDateTime : formatDt(new Date()),
      activityEndDateTime   : '31-12-2099 23:59',
    }
    await doSave(payload)
  }

  const doSave = async (payload) => {
    setSaving(true); setSaveMsg({ text:'', ok:true })
    try {
      const res = await activityApi.save(payload)
      if (res.data.success) {
        showToast(`"${ACTIVITY_CONFIG[payload.activityName]?.label ?? payload.activityName}" updated successfully.`)
        closeModal()
        load()
      } else setSaveMsg({ text: res.data.message || 'Save failed.', ok: false })
    } catch { setSaveMsg({ text: 'Save failed. Please try again.', ok: false }) }
    finally { setSaving(false) }
  }

  const V = {
    navy: '#14212e', primary: '#059669', danger: '#dc2626',
    border: '#e2e8f0', bg: '#f1f5f9', white: '#fff', muted: '#64748b',
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'24px 32px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Page header */}
        <div style={{ background:V.navy, borderRadius:'12px 12px 0 0', padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-calendar-alt" style={{ color:'#fff', fontSize:17 }}/>
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Administration</p>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>Manage Activity Status</h2>
          </div>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginLeft:'auto' }}>
            Controls when each feature is open / closed for candidates
          </p>
        </div>

        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

          {loading ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p style={{ color:V.muted, fontSize:13 }}>Loading activities...</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
              {items.map(item => {
                const cfg  = ACTIVITY_CONFIG[item.activityName] || { icon:'fa-cog', color:'#64748b', label:item.activityDetails }
                const open = isOpen(item.activityStartDateTime, item.activityEndDateTime)
                const days = daysInfo(item.activityEndDateTime)

                return (
                  <div key={item.activityName}
                    style={{ border:`1.5px solid ${V.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.05)', transition:'box-shadow .2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow=`0 4px 16px ${cfg.color}22`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.05)'}>

                    {/* Card header */}
                    <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${V.border}`, background:'#fff' }}>
                      <div style={{ width:38, height:38, borderRadius:9, background:`${cfg.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className={`fas ${cfg.icon}`} style={{ color:cfg.color, fontSize:16 }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', lineHeight:1.3 }}>{cfg.label}</div>
                        <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{item.activityName}</div>
                      </div>
                      {/* OPEN / CLOSED badge */}
                      <span style={{ background:open?'#f0fdf4':'#fef2f2', color:open?'#059669':V.danger, border:`1px solid ${open?'#86efac':'#fecaca'}`, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {open ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>

                    {/* Date info */}
                    <div style={{ padding:'12px 16px', background:'#fafbfc' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Start</div>
                          <div style={{ fontSize:12.5, fontWeight:600, color:'#0f172a' }}>{item.activityStartDateTime || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>End</div>
                          <div style={{ fontSize:12.5, fontWeight:600, color:'#0f172a' }}>{item.activityEndDateTime || '—'}</div>
                        </div>
                      </div>
                      {days.text && (
                        <div style={{ fontSize:11.5, fontWeight:600, color:days.color, marginBottom:8 }}>
                          <i className="fas fa-clock" style={{ marginRight:5 }}/>{days.text}
                        </div>
                      )}
                      <button onClick={() => openModal(item)}
                        style={{ width:'100%', background:'#fff', color:cfg.color, border:`1.5px solid ${cfg.color}`, borderRadius:7, padding:'7px 0', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background=`${cfg.color}10`}
                        onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                        <i className="fas fa-edit" style={{ marginRight:6 }}/>Edit Window
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Toast — fixed top-right, auto-dismisses after 3.5s ── */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:99999,
          background: toast.ok ? '#f0fdf4' : '#fef2f2',
          border:`1px solid ${toast.ok ? '#86efac' : '#fecaca'}`,
          color: toast.ok ? '#166534' : '#dc2626',
          borderRadius:12, padding:'13px 20px', fontSize:13.5, fontWeight:600,
          boxShadow:'0 8px 24px rgba(0,0,0,.14)',
          display:'flex', alignItems:'center', gap:10, maxWidth:380,
          animation:'slideInRight .25s ease',
        }}>
          <i className={`fas ${toast.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`}
             style={{ fontSize:16, flexShrink:0 }}/>
          <span style={{ flex:1 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)}
            style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:17, color:'inherit', lineHeight:1, padding:0, marginLeft:4, opacity:.7 }}>
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════
          EDIT MODAL
          ════════════════════════════════════════════════════════════════════ */}
        
      {modal && (() => {
        const { item, cfg, open: wasOpen } = modal
        // Re-compute live open status from current form dates for the modal header
        const liveOpen = isOpen(
          startRef.current?.value ?? form.activityStartDateTime,
          endRef.current?.value   ?? form.activityEndDateTime
        )

        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
            onClick={e => { if (e.target === e.currentTarget) closeModal() }}>

            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>

              {/* Modal header */}
              <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:`${cfg.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`fas ${cfg.icon}`} style={{ color:cfg.color, fontSize:15 }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'rgba(255,255,255,.55)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>Edit Activity Window</div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{cfg.label}</div>
                </div>
                {/* Live status badge */}
                <span style={{ background:wasOpen?'#f0fdf4':'#fef2f2', color:wasOpen?'#059669':V.danger, border:`1px solid ${wasOpen?'#86efac':'#fecaca'}`, borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700 }}>
                  {wasOpen ? 'OPEN' : 'CLOSED'}
                </span>
                {/* Close ✕ */}
                <button onClick={closeModal}
                  style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:8 }}>
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding:'20px 24px' }}>

                {/* Save message */}
                {saveMsg.text && (
                  <div style={{ background:saveMsg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${saveMsg.ok?'#86efac':'#fecaca'}`, color:saveMsg.ok?'#166534':V.danger, borderRadius:7, padding:'8px 14px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                    <i className={`fas ${saveMsg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>{saveMsg.text}
                  </div>
                )}

                <p style={{ fontSize:11.5, color:V.muted, marginBottom:14, fontWeight:500 }}>
                  <i className="fas fa-info-circle" style={{ marginRight:5, color:'#0ea5e9' }}/>
                  Format: <code style={{ background:'#f1f5f9', padding:'1px 6px', borderRadius:3, fontWeight:600 }}>dd-MM-yyyy HH:mm</code>
                </p>

                {/* Date inputs */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:V.muted, marginBottom:5 }}>
                      Start Date &amp; Time <span style={{ color:V.danger }}>*</span>
                    </label>
                    <input
                      key={`modal-start-${item.activityName}`}
                      ref={startRef}
                      defaultValue={form.activityStartDateTime}
                      placeholder="01-01-2026 09:00"
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
                      onFocus={e => e.target.style.borderColor=cfg.color}
                      onBlur={e => { e.target.style.borderColor='#e2e8f0'; setForm(p => ({...p, activityStartDateTime: e.target.value})) }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:V.muted, marginBottom:5 }}>
                      End Date &amp; Time <span style={{ color:V.danger }}>*</span>
                    </label>
                    <input
                      key={`modal-end-${item.activityName}`}
                      ref={endRef}
                      defaultValue={form.activityEndDateTime}
                      placeholder="31-12-2030 23:59"
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
                      onFocus={e => e.target.style.borderColor=cfg.color}
                      onBlur={e => { e.target.style.borderColor='#e2e8f0'; setForm(p => ({...p, activityEndDateTime: e.target.value})) }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop:'1px solid #f1f5f9', marginBottom:16 }}/>

                {/* Action buttons */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

                  {/* Primary: Save dates */}
                  <button onClick={handleSave} disabled={saving}
                    style={{ background:saving?'#d1fae5':cfg.color, color:'#fff', border:'none', padding:'11px 0', borderRadius:9, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background .15s' }}
                    onMouseEnter={e=>{ if(!saving) e.currentTarget.style.filter='brightness(0.9)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.filter='none' }}>
                    {saving
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                      : <><i className="fas fa-save"/>Save Changes</>}
                  </button>

                  {/* Secondary: Quick toggle */}
                  {wasOpen ? (
                    /* Activity is OPEN → show "Close Activity" button */
                    <button onClick={handleQuickClose} disabled={saving}
                      style={{ background:'#fff', color:V.danger, border:`2px solid ${V.danger}`, padding:'10px 0', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='#fef2f2' }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='#fff' }}>
                      <i className="fas fa-lock"/>Close Activity
                      <span style={{ fontSize:11, fontWeight:500, opacity:.7, marginLeft:2 }}>(sets end to now)</span>
                    </button>
                  ) : (
                    /* Activity is CLOSED → show "Open Activity" button */
                    <button onClick={handleQuickOpen} disabled={saving}
                      style={{ background:'#fff', color:'#059669', border:'2px solid #059669', padding:'10px 0', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='#f0fdf4' }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='#fff' }}>
                      <i className="fas fa-lock-open"/>Open Activity
                      <span style={{ fontSize:11, fontWeight:500, opacity:.7, marginLeft:2 }}>(start = now, end = far future)</span>
                    </button>
                  )}

                  {/* Cancel */}
                  <button onClick={closeModal}
                    style={{ background:'#f8fafc', color:'#64748b', border:'1.5px solid #e2e8f0', padding:'9px 0', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='#f1f5f9' }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='#f8fafc' }}>
                    Cancel
                  </button>

                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
