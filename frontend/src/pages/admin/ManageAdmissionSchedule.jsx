import { useState, useEffect } from 'react'
import { activityApi } from '../../services/api'

/**
 * ManageAdmissionSchedule — mirrors ManageAdmissionActivityStatus.aspx.
 *
 * Shows all phases (rounds) with their date windows.
 * Click a phase card to edit its dates inline.
 * IsCurrentPhase toggle highlights which round is active.
 *
 * SP: Administration_GetAdmissionActivityStatusList
 *     Administration_SaveAdmissionActivityStatusDetails
 */

const DATE_FIELDS = [
  { key:'allotmentDisplayStartDate',  label:'Allotment Display Start', icon:'fa-eye',        color:'#0ea5e9' },
  { key:'admissionStartDate',         label:'Admission Start',          icon:'fa-play',       color:'#059669' },
  { key:'candidateAdmissionLastDate', label:'Candidate Last Date',      icon:'fa-user-clock', color:'#f59e0b' },
  { key:'collegeAdmissionLastDate',   label:'College Last Date',        icon:'fa-university', color:'#8b5cf6' },
  { key:'systemAdmissionLastDate',    label:'System Last Date',         icon:'fa-server',     color:'#64748b' },
]

export default function ManageAdmissionSchedule() {
  const [phases,  setPhases]  = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState({ text:'', ok:true })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await activityApi.getAdmissionList()
      if (res.data.success) setPhases(res.data.items ?? [])
      else setMsg({ text:res.data.message, ok:false })
    } catch { setMsg({ text:'Failed to load.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleEdit = (phase) => {
    setEditing(phase.phaseID)
    setForm({
      phaseID:                   phase.phaseID,
      allotmentDisplayStartDate: phase.allotmentDisplayStartDate,
      admissionStartDate:        phase.admissionStartDate,
      candidateAdmissionLastDate:phase.candidateAdmissionLastDate,
      collegeAdmissionLastDate:  phase.collegeAdmissionLastDate,
      systemAdmissionLastDate:   phase.systemAdmissionLastDate,
      isCurrentPhase:            phase.isCurrentPhase,
      isActive:                  phase.isActive,
    })
    setMsg({ text:'', ok:true })
  }

  const handleSave = async () => {
    setSaving(true); setMsg({ text:'', ok:true })
    try {
      const res = await activityApi.saveAdmission(form)
      if (res.data.success) { setMsg({ text:'Admission schedule saved successfully.', ok:true }); setEditing(null); load() }
      else setMsg({ text:res.data.message, ok:false })
    } catch { setMsg({ text:'Save failed.', ok:false }) }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f1f5f9', white:'#fff', muted:'#64748b' }
  const inputStyle = { width:'100%', padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:12.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        <div style={{ background:V.navy, borderRadius:'12px 12px 0 0', padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-calendar-check" style={{ color:'#fff', fontSize:17 }}/>
          </div>
          <div>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', margin:0 }}>Administration</p>
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>Manage Admission Schedule</h2>
          </div>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginLeft:'auto' }}>Per-round admission date windows</p>
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
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {phases.map(phase => {
                const isEd = editing === phase.phaseID
                const isCurrent = phase.isCurrentPhase
                return (
                  <div key={phase.phaseID}
                    style={{ border:`1.5px solid ${isCurrent?'#059669':isEd?'#0ea5e9':V.border}`, borderRadius:12, overflow:'hidden',
                      boxShadow:isCurrent?'0 4px 16px rgba(5,150,105,.15)':isEd?'0 4px 16px rgba(14,165,233,.1)':'0 1px 4px rgba(0,0,0,.05)' }}>

                    {/* Phase header */}
                    <div style={{ padding:'12px 18px', display:'flex', alignItems:'center', gap:14, background:isCurrent?'#f0fdf4':V.bg, borderBottom:`1px solid ${V.border}` }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:isCurrent?'#059669':'#475569', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{phase.phaseID}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{phase.phase}</span>
                        {isCurrent && <span style={{ marginLeft:10, background:'#059669', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:10 }}>CURRENT ROUND</span>}
                        {!phase.isActive && <span style={{ marginLeft:8, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>INACTIVE</span>}
                      </div>
                      {!isEd && (
                        <button onClick={() => handleEdit(phase)}
                          style={{ background:V.white, color:'#0ea5e9', border:'1.5px solid #93c5fd', borderRadius:7, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          <i className="fas fa-edit" style={{ marginRight:5 }}/>Edit
                        </button>
                      )}
                    </div>

                    {/* Date overview (read mode) */}
                    {!isEd && (
                      <div style={{ padding:'12px 18px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                        {DATE_FIELDS.map(f => (
                          <div key={f.key} style={{ background:'#fafbfc', borderRadius:7, padding:'8px 10px', border:`1px solid ${V.border}` }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                              <i className={`fas ${f.icon}`} style={{ color:f.color, fontSize:11 }}/>
                              <span style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</span>
                            </div>
                            <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{phase[f.key] || '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline edit form */}
                    {isEd && (
                      <div style={{ padding:'16px 18px', background:'#f0f9ff' }}>
                        <p style={{ fontSize:11, color:V.muted, marginBottom:12, fontWeight:600 }}>
                          Format: <code style={{ background:'#e0f2fe', padding:'1px 5px', borderRadius:3 }}>dd-MM-yyyy HH:mm</code>
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:14 }}>
                          {DATE_FIELDS.map(f => (
                            <div key={f.key}>
                              <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:V.muted, marginBottom:4 }}>
                                <i className={`fas ${f.icon}`} style={{ color:f.color }}/>
                                {f.label}
                              </label>
                              <input value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                                placeholder="dd-MM-yyyy HH:mm" style={inputStyle}/>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
                          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                            <input type="checkbox" checked={form.isCurrentPhase||false}
                              onChange={e=>setForm(p=>({...p,isCurrentPhase:e.target.checked}))}
                              style={{ width:15, height:15, accentColor:'#059669' }}/>
                            Set as Current Round
                          </label>
                          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                            <input type="checkbox" checked={form.isActive||false}
                              onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))}
                              style={{ width:15, height:15, accentColor:'#059669' }}/>
                            Is Active
                          </label>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => setEditing(null)}
                            style={{ background:'#6c757d', color:'#fff', border:'none', padding:'8px 20px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            Cancel
                          </button>
                          <button onClick={handleSave} disabled={saving}
                            style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'8px 24px', borderRadius:7, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                            {saving?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<><i className="fas fa-save"/>Save Schedule</>}
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
