import { useState, useEffect, useRef } from 'react'
import { reportBuilderApi } from '../../services/api'

/**
 * ManageReports — mirrors ManageReports.aspx.
 * Form (top): Report Name + Table/View dropdown + Column listbox + SQL textarea
 * Grid (bottom): Report Name | Excel | Edit | Delete
 */
const BLOCKED = ['INSERT','DELETE','UPDATE','CREATE','ALTER','DROP','TRUNCATE']

export default function ManageReports() {
  const [reports,    setReports]    = useState([])
  const [tableViews, setTableViews] = useState([])
  const [columns,    setColumns]    = useState([])
  const [form,       setForm]       = useState({ reportID:0, reportName:'', reportQuery:'' })
  const [selTable,   setSelTable]   = useState('-1')
  const [saving,     setSaving]     = useState(false)
  const [formErr,    setFormErr]    = useState('')
  const [loading,    setLoading]    = useState(true)
  const [execResult, setExecResult] = useState(null)  // { columns, rows, fileName }
  const [execLoading,setExecLoading]= useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [toast,      setToast]      = useState(null)
  const queryRef = useRef(null)

  useEffect(() => { load(); loadTableViews() }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg, ok=true) => setToast({ msg, ok })

  const load = async () => {
    setLoading(true)
    try {
      const res = await reportBuilderApi.getList()
      if (res.data.success) setReports(res.data.items ?? [])
    } catch { showToast('Failed to load reports.', false) }
    finally { setLoading(false) }
  }

  const loadTableViews = async () => {
    try {
      const res = await reportBuilderApi.getTableViews()
      if (res.data.success) setTableViews(res.data.items ?? [])
    } catch {}
  }

  const handleTableChange = async (tv) => {
    setSelTable(tv); setColumns([])
    if (tv === '-1') return
    try {
      const res = await reportBuilderApi.getColumns(tv)
      if (res.data.success) setColumns(res.data.columns ?? [])
    } catch {}
  }

  const insertColumn = (col) => {
    const ta = queryRef.current
    if (!ta) { setForm(p => ({...p, reportQuery: p.reportQuery + col })); return }
    const s = ta.selectionStart, e = ta.selectionEnd
    const q = form.reportQuery
    const next = q.slice(0, s) + col + q.slice(e)
    setForm(p => ({...p, reportQuery: next}))
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + col.length; ta.focus() }, 0)
  }

  const resetForm = () => {
    setForm({ reportID:0, reportName:'', reportQuery:'' })
    setSelTable('-1'); setColumns([])
    setFormErr(''); setExecResult(null)
  }

  const validate = () => {
    if (!form.reportName.trim()) return 'Please enter Report Name.'
    if (!form.reportQuery.trim()) return 'Please enter Report Query.'
    const words = form.reportQuery.toUpperCase().split(/\s+/)
    const found = BLOCKED.filter(b => words.includes(b))
    if (found.length) return `Report query cannot contain: ${found.join(', ')}`
    return ''
  }

  const handleSave = async () => {
    const err = validate(); if (err) { setFormErr(err); return }
    setSaving(true); setFormErr('')
    try {
      const res = await reportBuilderApi.save({ reportID: form.reportID, reportName: form.reportName.trim(), reportQuery: form.reportQuery.trim() })
      if (res.data.success) { showToast(res.data.message); resetForm(); load() }
      else setFormErr(res.data.message || 'Save failed.')
    } catch { setFormErr('Save failed.') }
    finally { setSaving(false) }
  }

  const handleEdit = async (id) => {
    try {
      const res = await reportBuilderApi.getReport(id)
      if (res.data.success) {
        setForm({ reportID: res.data.reportID, reportName: res.data.reportName, reportQuery: res.data.reportQuery })
        setFormErr(''); setExecResult(null)
        window.scrollTo({ top:0, behavior:'smooth' })
      }
    } catch { showToast('Failed to load report.', false) }
  }

  const handleExecute = async (id, name) => {
    setExecLoading(id)
    try {
      const res = await reportBuilderApi.execute(id)
      if (res.data.success) setExecResult({ ...res.data, id, name })
      else showToast(res.data.message || 'Execution failed.', false)
    } catch { showToast('Execution failed.', false) }
    finally { setExecLoading(null) }
  }

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(true)
    try {
      const res = await reportBuilderApi.delete(confirmDel)
      if (res.data.success) { showToast(res.data.message); load() }
      else showToast(res.data.message || 'Delete failed.', false)
    } catch { showToast('Delete failed.', false) }
    finally { setDeleting(false); setConfirmDel(null) }
  }

  const exportToExcel = (result) => {
    if (!result?.rows?.length) return
    const html = `<table><thead><tr>${result.columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${result.rows.map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download=`${result.fileName||'Report'}.xls`; a.click()
    URL.revokeObjectURL(url)
  }

  const V = { navy:'#14212e', primary:'#059669', danger:'#dc2626', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d' }
  const cardHeader = (text, right) => (
    <div style={{ background:V.navy, padding:'10px 18px', borderRadius:'8px 8px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>{text}</h5>
      {right}
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* ── Form card ──────────────────────────────────────────────────────── */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader(form.reportID === 0 ? 'Add / Edit Report' : `Editing: ${form.reportName}`, null)}
          <div style={{ padding:'18px 20px', background:V.white }}>

            {formErr && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:13 }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{formErr}
              </div>
            )}

            {/* Row 1: Report Name */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Report Name <span style={{ color:V.danger }}>*</span></label>
              <input value={form.reportName} onChange={e=>setForm(p=>({...p,reportName:e.target.value}))} maxLength={500}
                placeholder="Report name..."
                style={{ width:'100%', padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=V.border}/>
            </div>

            {/* Row 2: Table/View + Columns */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Select Table / View</label>
                <select value={selTable} onChange={e=>handleTableChange(e.target.value)}
                  style={{ width:'100%', padding:'7px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
                  <option value="-1">— Select —</option>
                  {tableViews.map(tv => <option key={tv} value={tv}>{tv}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Columns <span style={{ fontSize:11, color:V.muted }}>(click to insert)</span></label>
                <select size={4} style={{ width:'100%', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13, fontFamily:'inherit', cursor:'pointer', background:'#f8fafc' }}
                  onChange={e=>{ if(e.target.value) insertColumn(e.target.value) }}>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Query */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Report Query <span style={{ color:V.danger }}>*</span></label>
              <textarea ref={queryRef} value={form.reportQuery} onChange={e=>setForm(p=>({...p,reportQuery:e.target.value}))}
                rows={6} maxLength={8000} placeholder="SELECT ... FROM ..."
                style={{ width:'100%', padding:'8px 10px', border:`1px solid ${V.border}`, borderRadius:5, fontSize:13, fontFamily:'monospace', resize:'vertical', outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=V.primary} onBlur={e=>e.target.style.borderColor=V.border}/>
              <p style={{ fontSize:11.5, color:V.muted, margin:'4px 0 0' }}>Blocked keywords: {BLOCKED.join(', ')}</p>
            </div>
          </div>
          <div style={{ padding:'12px 20px', background:V.bg, borderTop:`1px solid ${V.border}`, display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', padding:'9px 30px', borderRadius:6, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}
              onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#047857' }}
              onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=saving?'#d1fae5':V.primary }}>
              {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Save'}
            </button>
            {form.reportID > 0 && (
              <button onClick={resetForm}
                style={{ background:'#fff', color:V.muted, border:`1.5px solid ${V.border}`, padding:'9px 24px', borderRadius:6, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Reports list ───────────────────────────────────────────────────── */}
        <div style={{ border:`1px solid ${V.border}`, borderRadius:8, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
          {cardHeader('Reports List', null)}
          <div style={{ background:V.white }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:40 }}>
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign:'center', padding:36, color:V.muted, fontSize:13 }}>No reports found.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Report Name','Export','Edit','Delete'].map((h,i)=>(
                        <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i===1?'left':'center', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r,i) => (
                      <tr key={r.reportID} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#f8f9fa'}>
                        <td style={{ padding:'8px 12px', textAlign:'center', color:V.muted }}>{i+1}.</td>
                        <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.reportName}</td>
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <button onClick={() => handleExecute(r.reportID, r.reportName)} disabled={execLoading===r.reportID} title="Export to Excel"
                            style={{ background:'#198754', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:13, cursor:execLoading===r.reportID?'not-allowed':'pointer', fontFamily:'inherit' }}>
                            {execLoading===r.reportID ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/> : <i className="fas fa-file-excel"/>}
                          </button>
                        </td>
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <button onClick={() => handleEdit(r.reportID)} title="Edit"
                            style={{ background:'#0d6efd', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                            <i className="fas fa-edit"/>
                          </button>
                        </td>
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <button onClick={() => setConfirmDel(r.reportID)} title="Delete"
                            style={{ background:'#dc3545', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                            <i className="fas fa-trash"/>
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

        {/* ── Execute Result ─────────────────────────────────────────────────── */}
        {execResult && execResult.rows?.length > 0 && (
          <div style={{ border:`1px solid ${V.border}`, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,.06)', overflow:'hidden' }}>
            {cardHeader(`Result: ${execResult.name} (${execResult.rows.length} rows)`,
              <button onClick={() => exportToExcel(execResult)}
                style={{ background:'#198754', color:'#fff', border:'none', padding:'6px 16px', borderRadius:6, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-file-excel"/> Export
              </button>
            )}
            <div style={{ background:V.white, overflowX:'auto', maxHeight:400, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead style={{ position:'sticky', top:0 }}>
                  <tr style={{ background:'#475569' }}>
                    {execResult.columns.map((c,i) => (
                      <th key={i} style={{ padding:'8px 12px', color:'#fff', fontWeight:600, textAlign:'left', whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,.1)' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {execResult.rows.map((row,i) => (
                    <tr key={i} style={{ background:i%2===0?'#fff':'#f8f9fa', borderBottom:`1px solid ${V.border}` }}>
                      {row.map((cell,j) => (
                        <td key={j} style={{ padding:'7px 12px', color:V.muted, whiteSpace:'nowrap' }}>{cell ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:99999, background:toast.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.ok?'#86efac':'#fecaca'}`, color:toast.ok?'#166534':V.danger, borderRadius:12, padding:'13px 20px', fontSize:13.5, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,.14)', display:'flex', alignItems:'center', gap:10, maxWidth:380, animation:'slideInRight .25s ease' }}>
          <i className={`fas ${toast.ok?'fa-check-circle':'fa-exclamation-circle'}`} style={{ fontSize:16, flexShrink:0 }}/>
          <span style={{ flex:1 }}>{toast.msg}</span>
          <button onClick={()=>setToast(null)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:17, color:'inherit', lineHeight:1, padding:0, marginLeft:4, opacity:.7 }}>×</button>
        </div>
      )}
      <style>{`@keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Delete confirm */}
      {confirmDel !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, maxWidth:400, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:V.navy, padding:'13px 20px' }}><span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Delete Report</span></div>
            <div style={{ padding:'28px 24px', textAlign:'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ color:'#f59e0b', fontSize:32, display:'block', marginBottom:12 }}/>
              <p style={{ fontSize:14.5, color:'#0f172a', fontWeight:600, margin:'0 0 8px' }}>Are you sure you want to delete this report?</p>
              <p style={{ fontSize:13, color:V.muted, margin:'0 0 24px' }}>This action cannot be undone.</p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={()=>setConfirmDel(null)} style={{ background:'#f1f5f9', color:'#374151', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ background:deleting?'#fecaca':V.danger, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:700, cursor:deleting?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}>
                  {deleting?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Deleting...</>:<><i className="fas fa-trash"/>Yes, Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
