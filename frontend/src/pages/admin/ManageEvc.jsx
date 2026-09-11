import { useState, useEffect } from 'react'
import { evcApi } from '../../services/api'

/**
 * ManageEvc — mirrors Administration/ManageEVC.aspx + EVCDetails.aspx
 * Lists all EVC coordinators with Add / Edit / Activate / Deactivate actions.
 * SP: Administration_GetEVCList(@Flag='All')
 *     Administration_SaveEVCDetails(...)
 *     Administration_ActivateEVC / Administration_DeactivateEVC
 */
export default function ManageEvc() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [toast,       setToast]       = useState('')
  const [showModal,   setShowModal]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [toggling,    setToggling]    = useState(null) // evcId being toggled
  const [form,        setForm]        = useState({ evcID: 0, coordinatorName: '', coordinatorMobileNo: '', coordinatorEMailID: '' })
  const [formErr,     setFormErr]     = useState({})

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626', success:'#059669' }

  const load = () => {
    setLoading(true); setError('')
    evcApi.getList()
      .then(r => { if (r.data.success) setItems(r.data.items ?? []); else setError(r.data.message || 'Failed to load.') })
      .catch(() => setError('Server error. Please refresh.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ evcID: 0, coordinatorName: '', coordinatorMobileNo: '', coordinatorEMailID: '' })
    setFormErr({}); setShowModal(true)
  }

  const openEdit = async (item) => {
    setFormErr({})
    const r = await evcApi.getDetails(item.evcid)
    if (r.data.success) {
      const d = r.data.detail
      setForm({ evcID: d.evcid, coordinatorName: d.coordinatorName, coordinatorMobileNo: d.coordinatorMobileNo, coordinatorEMailID: d.coordinatorEMailID })
      setShowModal(true)
    }
  }

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.coordinatorName.trim()) e.coordinatorName = 'Name is required.'
    if (form.coordinatorMobileNo && !/^[1-9]\d{9}$/.test(form.coordinatorMobileNo.trim()))
      e.coordinatorMobileNo = 'Enter valid 10-digit mobile number.'
    if (form.coordinatorEMailID && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.coordinatorEMailID.trim()))
      e.coordinatorEMailID = 'Enter valid e-mail address.'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const r = await evcApi.save({ evcID: form.evcID, coordinatorName: form.coordinatorName, coordinatorMobileNo: form.coordinatorMobileNo, coordinatorEMailID: form.coordinatorEMailID })
      if (r.data.success) { setShowModal(false); showToast(r.data.message); load() }
      else setFormErr({ general: r.data.message || 'Save failed.' })
    } catch { setFormErr({ general: 'Server error. Please try again.' }) }
    finally { setSaving(false) }
  }

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggle = async (item) => {
    setToggling(item.evcid)
    try {
      const r = item.isActive === 'Y'
        ? await evcApi.deactivate(item.evcid)
        : await evcApi.activate(item.evcid)
      if (r.data.success) { showToast(r.data.message); load() }
      else showToast('⚠️ ' + (r.data.message || 'Operation failed.'))
    } catch { showToast('Server error.') }
    finally { setToggling(null) }
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = items.map((it, i) =>
      `<tr><td>${i+1}</td><td>${it.evcCode}</td><td>${it.coordinatorName}</td><td>${it.coordinatorMobileNo}</td><td>${it.coordinatorEMailID}</td><td>${it.isActive === 'Y' ? 'Yes' : 'No'}</td></tr>`
    ).join('')
    const html = `<table border="1"><thead><tr><th>Sr.</th><th>EVC Code</th><th>Co-Ordinator Name</th><th>Mobile No.</th><th>E-Mail ID</th><th>Is Active</th></tr></thead><tbody>${rows}</tbody></table>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'EVCList.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const inp = (field, label, placeholder, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:4, color:'#374151' }}>{label}</label>
      <input type={type} value={form[field]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width:'100%', padding:'7px 10px', border:`1px solid ${formErr[field] ? V.danger : V.border}`, borderRadius:5, fontSize:13.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor='#059669'} onBlur={e => e.target.style.borderColor=formErr[field]?V.danger:V.border} />
      {formErr[field] && <p style={{ color:V.danger, fontSize:11.5, margin:'3px 0 0' }}>{formErr[field]}</p>}
    </div>
  )

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:16, right:16, zIndex:9999, background: toast.startsWith('⚠️') ? '#fef3c7' : '#f0fdf4', border:`1px solid ${toast.startsWith('⚠️') ? '#fde68a' : '#bbf7d0'}`, color: toast.startsWith('⚠️') ? '#92400e' : '#166534', borderRadius:8, padding:'10px 18px', fontSize:13.5, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,.12)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:1280, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
            <i className="fas fa-id-badge" style={{ marginRight:8 }} />e-Verification Centers List
          </h5>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleExport} disabled={items.length === 0}
              style={{ background:'#dc2626', color:'#fff', border:'none', padding:'6px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
              <i className="fas fa-file-excel" />Export
            </button>
            <button onClick={openAdd}
              style={{ background:'#059669', color:'#fff', border:'none', padding:'6px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
              <i className="fas fa-plus" />Add EVC
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:`1px solid #fecaca`, borderTop:'none', color:V.danger, padding:'10px 18px', fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
          </div>
        )}

        {/* Table */}
        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:48, background:V.white }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:V.muted, fontSize:13 }}>Loading...</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    {['Action','EVC Code','Co-Ordinator Name','Mobile No.','E-Mail ID','Is Active'].map((h, i) => (
                      <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign: i===0?'center':'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:36, color:V.muted, fontSize:13 }}>No records found.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.evcid} style={{ background:i%2===0?V.white:V.bg, borderBottom:`1px solid ${V.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?V.white:V.bg}>
                      {/* Action */}
                      <td style={{ padding:'7px 10px', textAlign:'center', whiteSpace:'nowrap' }}>
                        {item.isActive === 'Y' && (
                          <button onClick={() => openEdit(item)}
                            style={{ background:'#2563eb', color:'#fff', border:'none', padding:'4px 10px', borderRadius:4, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', marginRight:4 }}>
                            Edit
                          </button>
                        )}
                        <button onClick={() => handleToggle(item)} disabled={toggling === item.evcid}
                          style={{ background: item.isActive === 'Y' ? '#dc2626' : '#059669', color:'#fff', border:'none', padding:'4px 10px', borderRadius:4, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          {toggling === item.evcid ? '...' : item.isActive === 'Y' ? 'De-Activate' : 'Activate'}
                        </button>
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.evcCode}</td>
                      <td style={{ padding:'8px 12px' }}>{item.coordinatorName}</td>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{item.coordinatorMobileNo || '—'}</td>
                      <td style={{ padding:'8px 12px', color:V.muted, fontSize:12 }}>{item.coordinatorEMailID || '—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ fontSize:11.5, fontWeight:700, padding:'2px 10px', borderRadius:20,
                          background: item.isActive==='Y'?'#dcfce7':'#fef2f2',
                          color:      item.isActive==='Y'?'#166534':'#dc2626',
                          border:    `1px solid ${item.isActive==='Y'?'#bbf7d0':'#fecaca'}` }}>
                          {item.isActive === 'Y' ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(2px)' }}>
          <div style={{ background:V.white, borderRadius:14, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,.28)', overflow:'hidden' }}>
            <div style={{ background:V.navy, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
                {form.evcID === 0 ? 'Add e-Verification Center' : 'Edit e-Verification Center'}
              </h5>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {formErr.general && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.danger, borderRadius:6, padding:'8px 12px', marginBottom:14, fontSize:13 }}>
                  {formErr.general}
                </div>
              )}
              {inp('coordinatorName',     'Co-Ordinator Name *',    'Enter coordinator name')}
              {inp('coordinatorMobileNo', 'Mobile Number',           'Enter 10-digit mobile number', 'tel')}
              {inp('coordinatorEMailID',  'E-Mail ID',               'Enter e-mail address', 'email')}
              {form.evcID === 0 && (
                <p style={{ fontSize:12, color:V.muted, marginBottom:14 }}>
                  <i className="fas fa-info-circle" style={{ marginRight:5 }} />
                  Login password will be auto-generated by the system.
                </p>
              )}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ background:'#f1f5f9', border:'none', color:'#374151', padding:'8px 20px', borderRadius:7, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ background: saving ? '#d1fae5' : '#059669', color:'#fff', border:'none', padding:'8px 24px', borderRadius:7, fontSize:13.5, fontWeight:700, cursor: saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
