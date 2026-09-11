import { useState, useEffect } from 'react'
import { phaseApi } from '../../services/api'

/**
 * ManagePhases — mirrors Administration/ManagePhase.aspx from old project.
 *
 * Features:
 *  - List all phases with IsCurrentPhase / IsCounsellingPhase / IsActive badges
 *  - Add New Phase → modal form
 *  - Edit Phase    → modal form pre-filled
 *  - Delete Phase  → confirm modal
 *
 * SPs: Administration_GetPhaseList
 *      Administration_GetPhaseDetails
 *      Administration_SavePhase   (PhaseID=0 insert, >0 update)
 *      Administration_DeletePhase
 *
 * Date format: dd-MM-yyyy HH:mm  (same as old project)
 */

const DATE_FIELDS = [
  { key: 'allotmentDisplayStartDate',  label: 'Allotment Display Start Date', icon: 'fa-eye',        color: '#0ea5e9' },
  { key: 'admissionStartDate',         label: 'Admission Start Date',          icon: 'fa-play',       color: '#059669' },
  { key: 'candidateAdmissionLastDate', label: 'Candidate Admission Last Date', icon: 'fa-user-clock', color: '#f59e0b' },
  { key: 'collegeAdmissionLastDate',   label: 'College Admission Last Date',   icon: 'fa-university', color: '#8b5cf6' },
  { key: 'systemAdmissionLastDate',    label: 'System Admission Last Date',    icon: 'fa-server',     color: '#64748b' },
]

const EMPTY_FORM = {
  phaseID: 0, phase: '',
  allotmentDisplayStartDate: '', admissionStartDate: '',
  candidateAdmissionLastDate: '', collegeAdmissionLastDate: '', systemAdmissionLastDate: '',
  isCurrentPhase: false, isCounsellingPhase: false, isActive: true,
}

export default function ManagePhases() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState({ text: '', ok: true })
  const [showModal,   setShowModal]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formErr,     setFormErr]     = useState({})
  const [deleteId,    setDeleteId]    = useState(null)   // phaseID pending delete
  const [deleting,    setDeleting]    = useState(false)

  const V = {
    navy: '#14212e', primary: '#059669', primaryDark: '#047857',
    border: '#e2e8f0', bg: '#f1f5f9', white: '#fff',
    muted: '#64748b', danger: '#dc2626',
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true)
    phaseApi.getList()
      .then(r => {
        if (r.data.success) setItems(r.data.items ?? [])
        else showToast(r.data.message || 'Failed to load.', false)
      })
      .catch(() => showToast('Server error. Please refresh.', false))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (text, ok = true) => {
    setToast({ text, ok })
    setTimeout(() => setToast({ text: '', ok: true }), 3500)
  }

  // ── Default date: now formatted ───────────────────────────────────────────
  const nowFormatted = () => {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // ── Open Add modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    const now = nowFormatted()
    setForm({ ...EMPTY_FORM, allotmentDisplayStartDate: now, admissionStartDate: now, candidateAdmissionLastDate: now, collegeAdmissionLastDate: now, systemAdmissionLastDate: now })
    setFormErr({})
    setShowModal(true)
  }

  // ── Open Edit modal ───────────────────────────────────────────────────────
  const openEdit = async (item) => {
    setFormErr({})
    try {
      const r = await phaseApi.getDetails(item.phaseID)
      if (r.data.success && r.data.item) {
        const d = r.data.item
        setForm({
          phaseID:                   d.phaseID,
          phase:                     d.phase,
          allotmentDisplayStartDate: d.allotmentDisplayStartDate,
          admissionStartDate:        d.admissionStartDate,
          candidateAdmissionLastDate:d.candidateAdmissionLastDate,
          collegeAdmissionLastDate:  d.collegeAdmissionLastDate,
          systemAdmissionLastDate:   d.systemAdmissionLastDate,
          isCurrentPhase:            d.isCurrentPhase,
          isCounsellingPhase:        d.isCounsellingPhase,
          isActive:                  d.isActive,
        })
        setShowModal(true)
      } else {
        showToast(r.data.message || 'Failed to load phase details.', false)
      }
    } catch {
      showToast('Server error.', false)
    }
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.phase.trim()) e.phase = 'Phase name is required.'
    const dtRe = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/
    DATE_FIELDS.forEach(f => {
      if (!form[f.key] || !dtRe.test(form[f.key].trim()))
        e[f.key] = 'Enter date as dd-MM-yyyy HH:mm'
    })
    if (form.isCurrentPhase === undefined || form.isCurrentPhase === null) e.isCurrentPhase = 'Required.'
    if (form.isCounsellingPhase === undefined || form.isCounsellingPhase === null) e.isCounsellingPhase = 'Required.'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const r = await phaseApi.save(form)
      if (r.data.success) {
        showToast(r.data.message || 'Saved successfully.')
        setShowModal(false)
        load()
      } else {
        showToast(r.data.message || 'Save failed.', false)
      }
    } catch {
      showToast('Server error.', false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const r = await phaseApi.delete(deleteId)
      if (r.data.success) {
        showToast(r.data.message || 'Phase deleted.')
        setDeleteId(null)
        load()
      } else {
        showToast(r.data.message || 'Delete failed.', false)
        setDeleteId(null)
      }
    } catch {
      showToast('Server error.', false)
      setDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '7px 10px',
    border: '1.5px solid #e2e8f0', borderRadius: 7,
    fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const errStyle  = { fontSize: 11, color: V.danger, marginTop: 3 }
  const thS = {
    padding: '10px 12px', color: '#fff', fontWeight: 700,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
    textAlign: 'left', whiteSpace: 'nowrap',
  }
  const tdS = {
    padding: '10px 12px', fontSize: 13,
    borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
  }

  const Badge = ({ val, yes, color }) => (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700,
      padding: '2px 9px', borderRadius: 20,
      background: yes ? '#dcfce7' : '#f1f5f9',
      color:      yes ? '#166534' : '#64748b',
      border:     `1px solid ${yes ? '#bbf7d0' : '#e2e8f0'}`,
    }}>{val}</span>
  )

  const CurrentBadge = ({ val }) => val ? (
    <span style={{ display:'inline-block', fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'#059669', color:'#fff', border:'1px solid #047857' }}>
      CURRENT
    </span>
  ) : <Badge val="No" yes={false}/>

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ background: V.navy, borderRadius: '12px 12px 0 0', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-layer-group" style={{ color: '#fff', fontSize: 17 }}/>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', margin: 0 }}>Administration</p>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 17, margin: 0 }}>Manage Admission Phases</h2>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={openAdd}
              style={{ background: V.primary, color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 3px 10px rgba(5,150,105,.35)' }}>
              <i className="fas fa-plus"/> Add New Phase
            </button>
          </div>
        </div>

        {/* ── Card body ───────────────────────────────────────────────────── */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 24 }}>

          {/* Toast */}
          {toast.text && (
            <div style={{ background: toast.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${toast.ok ? '#86efac' : '#fecaca'}`, color: toast.ok ? '#166534' : V.danger, borderRadius: 7, padding: '9px 16px', marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={`fas ${toast.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`}/>
              {toast.text}
              <button onClick={() => setToast({ text: '', ok: true })} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p style={{ color: V.muted, fontSize: 13 }}>Loading phases...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: V.muted }}>
              <i className="fas fa-layer-group" style={{ fontSize: 32, marginBottom: 12, display: 'block', opacity: .4 }}/>
              <p style={{ fontSize: 14 }}>No phases found. Click <strong>Add New Phase</strong> to create the first one.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: V.navy }}>
                    <th style={{ ...thS, width: 80, textAlign: 'center' }}>Action</th>
                    <th style={thS}>Phase Name</th>
                    <th style={thS}>Allotment Start</th>
                    <th style={thS}>Admission Start</th>
                    <th style={thS}>Candidate Last</th>
                    <th style={thS}>College Last</th>
                    <th style={thS}>System Last</th>
                    <th style={{ ...thS, textAlign: 'center' }}>Current?</th>
                    <th style={{ ...thS, textAlign: 'center' }}>Counselling?</th>
                    <th style={{ ...thS, textAlign: 'center' }}>Active?</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.phaseID}
                      style={{ background: item.isCurrentPhase ? '#f0fdf4' : idx % 2 === 0 ? V.white : '#f9fafb', transition: 'background .15s' }}
                      onMouseEnter={e => { if (!item.isCurrentPhase) e.currentTarget.style.background = '#f0f9ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = item.isCurrentPhase ? '#f0fdf4' : idx % 2 === 0 ? V.white : '#f9fafb' }}>
                      {/* Actions */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <button onClick={() => openEdit(item)} title="Edit"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0ea5e9', fontSize: 16, padding: '0 5px' }}>
                          <i className="fas fa-edit"/>
                        </button>
                        <button onClick={() => setDeleteId(item.phaseID)} title="Delete"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: V.danger, fontSize: 16, padding: '0 5px' }}>
                          <i className="fas fa-trash"/>
                        </button>
                      </td>
                      <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>
                        {item.isCurrentPhase && (
                          <span style={{ marginRight: 6, background: '#059669', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8, verticalAlign: 'middle' }}>●</span>
                        )}
                        {item.phase}
                      </td>
                      <td style={tdS}>{item.allotmentDisplayStartDate  || '—'}</td>
                      <td style={tdS}>{item.admissionStartDate         || '—'}</td>
                      <td style={tdS}>{item.candidateAdmissionLastDate || '—'}</td>
                      <td style={tdS}>{item.collegeAdmissionLastDate   || '—'}</td>
                      <td style={tdS}>{item.systemAdmissionLastDate    || '—'}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}><CurrentBadge val={item.isCurrentPhase}/></td>
                      <td style={{ ...tdS, textAlign: 'center' }}><Badge val={item.isCounsellingPhase ? 'Yes' : 'No'} yes={item.isCounsellingPhase}/></td>
                      <td style={{ ...tdS, textAlign: 'center' }}><Badge val={item.isActive ? 'Yes' : 'No'} yes={item.isActive}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══ ADD / EDIT MODAL ════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: V.white, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

            {/* Modal header */}
            <div style={{ background: V.navy, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-layer-group" style={{ color: '#fff', fontSize: 14 }}/>
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  {form.phaseID === 0 ? 'Add New Phase' : 'Edit Phase'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

              <p style={{ fontSize: 11, color: V.muted, marginBottom: 16, fontWeight: 600 }}>
                Date format: <code style={{ background: '#e0f2fe', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>dd-MM-yyyy HH:mm</code>
              </p>

              {/* Phase Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                  Phase Name <span style={{ color: V.danger }}>*</span>
                </label>
                <input
                  value={form.phase}
                  onChange={e => setForm(p => ({ ...p, phase: e.target.value }))}
                  placeholder="e.g., Round-I, Spot Round"
                  maxLength={100}
                  style={{ ...inputStyle, borderColor: formErr.phase ? V.danger : '#e2e8f0' }}/>
                {formErr.phase && <p style={errStyle}>{formErr.phase}</p>}
              </div>

              {/* Date fields — 2 per row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                {DATE_FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                      <i className={`fas ${f.icon}`} style={{ color: f.color, fontSize: 11 }}/>
                      {f.label} <span style={{ color: V.danger }}>*</span>
                    </label>
                    <input
                      key={`${f.key}-${form.phaseID}`}
                      defaultValue={form[f.key]}
                      onBlur={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="dd-MM-yyyy HH:mm"
                      style={{ ...inputStyle, borderColor: formErr[f.key] ? V.danger : '#e2e8f0' }}/>
                    {formErr[f.key] && <p style={errStyle}>{formErr[f.key]}</p>}
                  </div>
                ))}
              </div>

              {/* Toggle flags — 3 in a row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  { key: 'isCurrentPhase',    label: 'Is Current Phase',    color: '#059669' },
                  { key: 'isCounsellingPhase', label: 'Is Counselling Phase', color: '#7c3aed' },
                  { key: 'isActive',           label: 'Is Active',           color: '#0ea5e9' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                      {f.label} <span style={{ color: V.danger }}>*</span>
                    </label>
                    <select
                      value={form[f.key] ? '1' : '0'}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value === '1' }))}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                    {formErr[f.key] && <p style={errStyle}>{formErr[f.key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${V.border}`, display: 'flex', justifyContent: 'center', gap: 12, flexShrink: 0, background: '#f8fafc' }}>
              <button onClick={() => setShowModal(false)}
                style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '9px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ background: saving ? '#d1fae5' : V.primary, color: '#fff', border: 'none', padding: '9px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                  : <><i className="fas fa-save"/>Save Phase</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ════════════════════════════════════════════ */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: V.white, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 420, overflow: 'hidden', fontFamily: 'inherit' }}>
            <div style={{ background: V.navy, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-trash" style={{ color: '#fca5a5', fontSize: 14 }}/>
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Delete Phase</span>
              </div>
              <button onClick={() => setDeleteId(null)}
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ padding: '24px 24px 8px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: V.danger, fontSize: 22 }}/>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>Are you sure?</p>
              <p style={{ fontSize: 13, color: V.muted, margin: 0, lineHeight: 1.7 }}>
                This will permanently delete the phase.<br/>
                This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: '10px 0', background: V.white, border: `1.5px solid ${V.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = V.white}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '10px 0', background: deleting ? '#fca5a5' : V.danger, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#b91c1c' }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = V.danger }}>
                {deleting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Deleting...</>
                  : <><i className="fas fa-trash" style={{ fontSize: 13 }}/>Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
