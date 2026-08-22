import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * SetPreferences — exact UI match to SetPreferences.aspx
 *
 * Layout:
 *   step-bar (College Selection & Preference = active, Application Form = done)
 *   pref-card (instructions)
 *   pref-card (College Preference List — teal header)
 *     pref-table: Set Preference (checkbox) | Pref. No. (auto-filled, read-only) |
 *                 College Code | College Name | District | Status
 *   pref-footer: note | Reset Preferences + Save & Next | spacer
 *
 * Logic (mirrors SetPreferences.aspx JS exactly):
 *   - On load: if PreferenceNo > 0 → checkbox checked + highlight row green + left border
 *   - Checkbox checked   → Counter++ → fill PreferenceNo = Counter
 *   - Checkbox unchecked → Counter-- → clear this row's number → decrement all higher numbers
 *   - Reset button       → uncheck all + clear all numbers + Counter = 0 + remove highlights
 *   - Save & Next: validate ALL rows have PreferenceNo > 0 else error
 *                  POST → navigate to /candidate/summary
 *   - If no colleges → redirect back to /candidate/shortlist
 *
 * Max preferences = 30000 (matches old Counter == 30000 guard)
 */
export default function SetPreferences() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [colleges,     setColleges]     = useState([])   // { collegeID, collegeCode, collegeName, district, courseStatus, preferenceNo }
  const [prefs,        setPrefs]        = useState([])   // parallel array of { checked, prefNo }
  const [counter,      setCounter]      = useState(0)    // mirrors JS Counter variable
  const [pageLoading,  setPageLoading]  = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [applicationId,setApplicationId]= useState('')

  const MAX_PREFS = 30000

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setApplicationId(user?.userLoginID ?? '')
    applicationFormApi.getPreferencedOptions()
      .then(res => {
        const cols = res.data.colleges ?? []
        // If empty → go back to shortlist (mirrors old Response.Redirect("ShortListOptions.aspx"))
        if (cols.length === 0) {
          navigate('/candidate/shortlist')
          return
        }
        setColleges(cols)
        // Initialise prefs from existing PreferenceNo values
        // Same as gvShortlistedOptionsList_RowDataBound: if PreferenceNo > 0 → checked
        let maxPref = 0
        const initialPrefs = cols.map(c => {
          const pn = c.preferenceNo ?? 0
          if (pn > maxPref) maxPref = pn
          return { checked: pn > 0, prefNo: pn > 0 ? pn : 0 }
        })
        setPrefs(initialPrefs)
        setCounter(maxPref)   // mirrors CheckPreferenceCount
      })
      .catch(() => setError('Failed to load preferences. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Checkbox toggle — mirrors SetPreferences(chkBox) JS function ──────────
  const handleCheck = (idx, checked) => {
    setError('')
    setPrefs(prev => {
      const next = prev.map(p => ({ ...p }))

      if (checked) {
        // Counter guard
        const newCounter = counter + 1
        if (newCounter > MAX_PREFS) return prev   // mirrors: if (Counter == 30000) chkBox.checked = false
        next[idx].checked = true
        next[idx].prefNo  = newCounter
        setCounter(newCounter)
      } else {
        // Uncheck: decrement all higher preference numbers (mirrors JS unchecked branch)
        const removedPref = next[idx].prefNo
        next[idx].checked = false
        next[idx].prefNo  = 0
        next.forEach((p, i) => {
          if (i !== idx && p.prefNo > removedPref) p.prefNo--
        })
        setCounter(c => c - 1)
      }

      return next
    })
  }

  // ── Reset — mirrors ResetPreferences() JS function ────────────────────────
  const handleReset = async () => {
    setError('')
    // Clear UI immediately
    setPrefs(prev => prev.map(() => ({ checked: false, prefNo: 0 })))
    setCounter(0)
    // Also persist to DB so page refresh shows cleared state
    try {
      await applicationFormApi.resetPreferences()
    } catch {
      // UI is already reset — DB failure is non-critical for UX
    }
  }

  // ── Save & Next — mirrors btnProceed_Click ─────────────────────────────────
  const handleSave = async () => {
    // Validate counter > 0 (mirrors checkAtleastOneOption)
    if (counter <= 0) {
      setError('Please Set Preferences for Atleast One College.')
      return
    }
    // Validate ALL colleges have a preference number (mirrors IsAllPreferencesGiven)
    const allSet = prefs.every(p => p.prefNo > 0)
    if (!allSet) {
      setError('Please Set Preferences to All Shortlisted Colleges.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const options = colleges.map((col, i) => ({
        collegeID:    col.collegeID,
        preferenceNo: prefs[i].prefNo
      }))
      const res = await applicationFormApi.savePreferences({ options })
      if (res.data.success) {
        navigate('/candidate/photo-sign')   // mirrors Response.Redirect("ApplicationFormSummary.aspx")
      } else {
        setError(res.data.message || 'Failed to save preferences.')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to save preferences.'
      setError(typeof msg === 'string' ? msg : 'Failed to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  // ── Status badge (same as old GetStatusBadge) ─────────────────────────────
  const StatusBadge = ({ status }) => {
    if (!status) return null
    const isUnaided = status.toUpperCase().includes('UN-AIDED') || status.toUpperCase().includes('UNAIDED')
    return isUnaided
      ? <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>■ UN-AIDED</span>
      : <span style={{ background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>■ AIDED</span>
  }

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading Preference List...</p>
      </div>
    </div>
  )

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    primaryDark: '#047857',
    teal:        '#0d9488',
    tealLight:   '#f0fdfb',
    tealBorder:  '#ccfbf1',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    textLight:   '#94a3b8',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
  }

  const thStyle = { padding: '11px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#fff', textAlign: 'center', whiteSpace: 'nowrap', background: V.navy }
  const tdStyle = { padding: '11px 14px', color: V.textPrimary, verticalAlign: 'middle', textAlign: 'center' }

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── top info bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${V.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 32px' }}>
        <span style={{ fontSize: 12, color: V.textSecond, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application ID</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: V.primary }}>{applicationId || '—'}</span>
      </div>

      {/* ── step-bar — College Selection & Preference = active, Application Form = done */}
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

      <div style={{ padding: '20px 24px 24px' }}>

        {/* ── Instructions card — mirrors .instructions-box */}
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ background: V.navy, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Set Preferences</h3>
          </div>
          <div style={{ background: '#f0fdf9', borderLeft: `4px solid ${V.primary}`, padding: '16px 24px', borderBottom: `1px solid ${V.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: V.teal, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <i className="fas fa-info-circle" /> Instructions
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, color: V.textPrimary, fontSize: 13, lineHeight: 1.8 }}>
              <li>Click on the checkboxes one by one to set your preferences. The preference number will appear in the adjoining text box.</li>
              <li>You must set preferences for all colleges selected by you.</li>
              <li>You can reset all preferences by clicking the <strong>Reset Preferences</strong> button.</li>
              <li>After setting all preferences, click <strong>Save &amp; Next</strong> to proceed.</li>
            </ol>
          </div>
        </div>

        {/* ── College Preference List card */}
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ background: V.teal, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              <i className="fas fa-list-ul" style={{ marginRight: 8 }} />College Preference List
            </h3>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#dc2626', padding: '10px 24px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          {/* pref-table-wrap — max-height 400px scrollable */}
          <div style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, borderLeft: `4px solid ${V.primary}` }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '6%' }}>Set Preference</th>
                  <th style={{ ...thStyle, width: '8%' }}>Pref. No.</th>
                  <th style={{ ...thStyle, width: '9%' }}>College Code</th>
                  <th style={{ ...thStyle, width: '48%', textAlign: 'left' }}>College Name</th>
                  <th style={{ ...thStyle, width: '18%' }}>District</th>
                  <th style={{ ...thStyle, width: '11%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((col, idx) => {
                  const p = prefs[idx] ?? { checked: false, prefNo: 0 }
                  // Highlight row when checked — mirrors SetRowBackgroundColor
                  const rowBg = p.checked ? '#ecfdf5' : (idx % 2 === 0 ? '#fff' : '#f8fafc')
                  const rowBorderLeft = p.checked ? `3px solid ${V.primary}` : 'none'
                  return (
                    <tr key={col.collegeID}
                      style={{ borderBottom: `1px solid ${V.borderLight}`, background: rowBg, borderLeft: rowBorderLeft, transition: 'background .15s' }}>
                      {/* Checkbox */}
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={p.checked}
                          onChange={e => handleCheck(idx, e.target.checked)}
                          style={{ accentColor: V.primary, width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </td>
                      {/* Preference No — text-box-seq-no style, read-only (mirrors disabled textbox) */}
                      <td style={tdStyle}>
                        <input
                          type="text"
                          readOnly
                          value={p.prefNo > 0 ? p.prefNo : ''}
                          style={{
                            width: 60, textAlign: 'center',
                            border: `1.5px solid ${V.border}`, borderRadius: 6,
                            padding: '5px 8px', fontSize: 14, fontWeight: 700,
                            color: V.primary, background: '#f8fafc',
                            cursor: 'not-allowed', outline: 'none', fontFamily: 'inherit'
                          }}
                        />
                      </td>
                      <td style={tdStyle}>{col.collegeCode}</td>
                      <td style={{ ...tdStyle, textAlign: 'left' }}>{col.collegeName}</td>
                      <td style={tdStyle}>{col.district}</td>
                      <td style={tdStyle}><StatusBadge status={col.courseStatus} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* pref-footer */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            padding: '16px 24px', borderTop: `1px solid ${V.borderLight}`,
            background: '#f8fafc', borderRadius: '0 0 14px 14px',
            flexWrap: 'wrap', gap: 12
          }}>
            {/* left — note */}
            <div style={{ fontSize: 12, color: V.textSecond, display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              <span style={{ color: V.danger }}>*</span> Set preference order for your selected colleges
            </div>

            {/* center — Reset + Save & Next */}
            <div style={{ display: 'flex', gap: 10, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              {/* Reset button — mirrors btnResetPreferences */}
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: '#fff0f0', color: '#dc2626', border: '1.5px solid #fecaca',
                  padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
              >
                <i className="fas fa-redo" /> Reset Preferences
              </button>

              {/* Save & Next — mirrors btnProceed */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? '#86efac' : V.primary, color: '#fff', border: 'none',
                  padding: '10px 24px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = V.primaryDark }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = V.primary }}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Saving...</>
                  : <>Save &amp; Next →</>}
              </button>
            </div>

            {/* right spacer */}
            <div style={{ flex: 1 }} />
          </div>

        </div>
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
