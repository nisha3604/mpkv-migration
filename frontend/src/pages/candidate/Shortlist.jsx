import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Shortlist Options — exact UI match to ShortListOptions.aspx
 *
 * Layout (single card, two sections inside):
 *   step-bar (College Selection & Preference = active, Application Form = done)
 *   sl-card
 *     sl-card-header: "Shortlist Colleges"
 *     ── Available colleges sub-section ──
 *       sl-sub-header: "+ Add Colleges of Your Choice"
 *       scrollable table: Add+ | CollegeCode | CollegeName | District | Status
 *       sl-hint
 *     ── Shortlisted colleges sub-section ──
 *       sl-sub-header: "≡ Shortlisted Colleges by You"  | Total Shortlisted: N
 *       scrollable table: ✕ | PrefNo | CollegeCode | CollegeName | District | Status
 *       sl-hint
 *     sl-footer: note | ← Back  Save & Next → | spacer
 *
 * Behaviour:
 *   Add   → POST options/add   → refresh both lists → show success toast
 *   Remove → DELETE options/remove/{id} → refresh both lists
 *   Save & Next → POST options/save → navigate /candidate/summary
 *   Save & Next disabled / hidden when shortlist is empty (mirrors old btnProceed.Visible)
 */
export default function Shortlist() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [available,    setAvailable]    = useState([])
  const [shortlisted,  setShortlisted]  = useState([])
  const [pageLoading,  setPageLoading]  = useState(true)
  const [loadingId,    setLoadingId]    = useState(null)   // CollegeID currently being added/removed
  const [saving,       setSaving]       = useState(false)
  const [toast,        setToast]        = useState(null)   // { msg, type:'success'|'error' }
  const [error,        setError]        = useState('')
  const [applicationId,setApplicationId]= useState('')

  // ── Load both lists ───────────────────────────────────────────────────────
  const loadBoth = useCallback(async () => {
    try {
      const [avRes, shRes] = await Promise.all([
        applicationFormApi.getAvailableOptions(),
        applicationFormApi.getShortlistedOptions(),
      ])
      setAvailable(avRes.data.colleges   ?? [])
      setShortlisted(shRes.data.colleges ?? [])
    } catch {
      setError('Failed to load data. Please refresh.')
    }
  }, [])

  useEffect(() => {
    setApplicationId(user?.userLoginID ?? '')
    loadBoth().finally(() => setPageLoading(false))
  }, [])

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Add college ───────────────────────────────────────────────────────────
  const handleAdd = async (college) => {
    setLoadingId(college.collegeID)
    setError('')
    try {
      const res = await applicationFormApi.addOption({ collegeID: college.collegeID })
      if (res.data.success) {
        await loadBoth()
        showToast(`${college.collegeName} Added Successfully.`)
      } else {
        showToast(res.data.message || 'Failed to add.', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to add college.'
      showToast(typeof msg === 'string' ? msg : 'Failed to add college.', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  // ── Remove college ────────────────────────────────────────────────────────
  const handleRemove = async (college) => {
    setLoadingId(college.collegeID)
    setError('')
    try {
      const res = await applicationFormApi.removeOption(college.collegeID)
      if (res.data.success) {
        await loadBoth()
        showToast(`${college.collegeName} Removed Successfully.`)
      } else {
        showToast(res.data.message || 'Failed to remove.', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to remove college.'
      showToast(typeof msg === 'string' ? msg : 'Failed to remove college.', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  // ── Save & Proceed ────────────────────────────────────────────────────────
  const handleProceed = async () => {
    if (shortlisted.length === 0) {
      showToast('Please Shortlist Atleast One College.', 'error')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await applicationFormApi.saveShortlist()
      if (res.data.success) {
        navigate('/candidate/preferences')   // → SetPreferences page (same as old → SetPreferences.aspx)
      } else {
        showToast(res.data.message || 'Failed to save.', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to save shortlist.'
      showToast(typeof msg === 'string' ? msg : 'Failed to save shortlist.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Status badge — mirrors GetStatusBadge() ───────────────────────────────
  const StatusBadge = ({ status }) => {
    if (!status) return null
    const isUnaided = status.toUpperCase().includes('UN-AIDED') || status.toUpperCase().includes('UNAIDED')
    return isUnaided
      ? <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>■ UN-AIDED</span>
      : <span style={{ background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>■ AIDED</span>
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading Shortlist Options...</p>
      </div>
    </div>
  )

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    primaryDark: '#047857',
    tealLight:   '#f0fdfb',
    tealBorder:  '#ccfbf1',
    teal:        '#0d9488',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    textLight:   '#94a3b8',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
  }

  const thTd = { padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }
  const tdLeft = { ...thTd, textAlign: 'left' }

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', paddingBottom: 40, position: 'relative' }}>

      {/* ── Toast notification — mirrors ShowMessage('Information', ...) */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#f0fdf9' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#166534' : '#dc2626',
          borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340
        }}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── top info bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${V.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 32px' }}>
        <span style={{ fontSize: 12, color: V.textSecond, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application ID</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: V.primary }}>{applicationId || '—'}</span>
      </div>

      {/* ── step-bar — "College Selection & Preference" is active, "Application Form" is done */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 24px 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Application Form',               done: true,  active: false },
          { label: 'College Selection & Preference', done: false, active: true  },
          { label: 'Documents Upload',               done: false, active: false },
          { label: 'Fee Payment',                    done: false, active: false },
          { label: 'Lock Form',                      done: false, active: false },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
              fontSize: 12.5, fontWeight: 600,
              background: s.active ? V.primary : s.done ? V.tealLight : V.borderLight,
              color:      s.active ? '#fff'    : s.done ? V.teal      : V.textSecond,
              border: `1px solid ${s.active ? V.primary : s.done ? V.tealBorder : V.border}`
            }}>
              {s.done   && <i className="fas fa-check" style={{ fontSize: 9 }} />}
              {s.active && <i className="fas fa-circle" style={{ fontSize: 8 }} />}
              {s.label}
            </div>
            {i < arr.length - 1 && <span style={{ color: V.textLight, fontSize: 12 }}>›</span>}
          </div>
        ))}
      </div>

      {/* ── page-wrap */}
      <div style={{ padding: '20px 24px 24px' }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── sl-card */}
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* sl-card-header */}
          <div style={{ background: V.navy, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Shortlist Colleges</h3>
          </div>

          {/* ══ Available Colleges ══════════════════════════════════════════ */}
          {/* sl-sub-header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: V.tealLight, borderBottom: `1px solid ${V.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>+</span> Add Colleges of Your Choice
            </span>
          </div>

          {/* scrollable table */}
          <div style={{ maxHeight: 320, overflowY: 'auto', overflowX: 'auto' }}>
            {available.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: V.textSecond, fontSize: 13 }}>No More Colleges Available</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: V.navy, position: 'sticky', top: 0, zIndex: 1 }}>
                    {['Add', 'College Code', 'College Name', 'District', 'Status'].map((h, i) => (
                      <th key={i} style={{ ...thTd, fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: i === 2 ? 'left' : 'center' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {available.map((col, idx) => (
                    <tr key={col.collegeID} style={{ borderBottom: `1px solid ${V.borderLight}`, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={thTd}>
                        <button
                          onClick={() => handleAdd(col)}
                          disabled={loadingId === col.collegeID}
                          title="Add to shortlist"
                          style={{
                            width: 28, height: 28, background: loadingId === col.collegeID ? '#86efac' : V.primary,
                            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
                            fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          onMouseEnter={e => { if (loadingId !== col.collegeID) e.currentTarget.style.background = V.primaryDark }}
                          onMouseLeave={e => { if (loadingId !== col.collegeID) e.currentTarget.style.background = V.primary }}
                        >
                          {loadingId === col.collegeID ? '…' : '+'}
                        </button>
                      </td>
                      <td style={thTd}>{col.collegeCode}</td>
                      <td style={tdLeft}>{col.collegeName}</td>
                      <td style={thTd}>{col.district}</td>
                      <td style={thTd}><StatusBadge status={col.courseStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ fontSize: 12, color: V.textLight, padding: '8px 20px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-info-circle" /> Scroll within the table to view more colleges.
          </div>

          {/* ══ Shortlisted Colleges ════════════════════════════════════════ */}
          {/* sl-sub-header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: V.tealLight, borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>≡</span> Shortlisted Colleges by You
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: V.textSecond }}>
              Total Shortlisted: <strong>{shortlisted.length}</strong>
            </span>
          </div>

          {/* shortlisted table — shown only when count > 0, same as old tblShortlistedOptions.Visible */}
          {shortlisted.length > 0 && (
            <div style={{ maxHeight: 320, overflowY: 'auto', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: V.navy, position: 'sticky', top: 0, zIndex: 1 }}>
                    {['Delete', 'Preference No.', 'College Code', 'College Name', 'District', 'Status'].map((h, i) => (
                      <th key={i} style={{ ...thTd, fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: i === 3 ? 'left' : 'center' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shortlisted.map((col, idx) => (
                    <tr key={col.collegeID} style={{ borderBottom: `1px solid ${V.borderLight}`, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={thTd}>
                        <button
                          onClick={() => handleRemove(col)}
                          disabled={loadingId === col.collegeID}
                          title="Remove from shortlist"
                          style={{
                            width: 28, height: 28, background: '#fff0f0', color: '#dc2626',
                            border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer',
                            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#dc2626' }}
                        >
                          {loadingId === col.collegeID ? '…' : <i className="fas fa-times" />}
                        </button>
                      </td>
                      <td style={thTd}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: V.primary }}>
                          {col.preferenceNo}
                        </span>
                      </td>
                      <td style={thTd}>{col.collegeCode}</td>
                      <td style={tdLeft}>{col.collegeName}</td>
                      <td style={thTd}>{col.district}</td>
                      <td style={thTd}><StatusBadge status={col.courseStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ fontSize: 12, color: V.textLight, padding: '8px 20px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-info-circle" /> Preference order determines allotment priority. Add more colleges above to build your preference list.
          </div>

          {/* ── sl-footer */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            padding: '16px 24px', borderTop: `1px solid ${V.borderLight}`,
            background: '#f8fafc', borderRadius: '0 0 14px 14px',
            flexWrap: 'wrap', gap: 12
          }}>
            {/* left — note */}
            <div style={{ fontSize: 12, color: V.textSecond, display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <i className="fas fa-check-square" style={{ color: V.primary }} />
              Shortlist at least one college to proceed
            </div>

            {/* center — Back + Save & Next */}
            <div style={{ display: 'flex', gap: 10, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <button
                type="button"
                onClick={() => navigate('/candidate/sports')}
                style={{ background: 'transparent', color: V.textPrimary, border: `1.5px solid ${V.border}`, padding: '9px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
              >
                <i className="fas fa-arrow-left" /> Back
              </button>

              {/* btnProceed — hidden when shortlist empty, same as old btnProceed.Visible */}
              {shortlisted.length > 0 && (
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={saving}
                  style={{ background: saving ? '#86efac' : V.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = V.primary }}
                >
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Saving...</>
                    : <>Save &amp; Next <i className="fas fa-arrow-right" style={{ fontSize: 12 }} /></>}
                </button>
              )}
            </div>

            {/* right spacer */}
            <div style={{ flex: 1 }} />
          </div>

        </div>{/* end sl-card */}
      </div>

      {/* scroll-to-top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: 28, right: 28, width: 44, height: 44, borderRadius: '50%', background: '#f97316', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.4)', zIndex: 50 }}
      >
        <i className="fas fa-chevron-up" />
      </button>

    </div>
  )
}
