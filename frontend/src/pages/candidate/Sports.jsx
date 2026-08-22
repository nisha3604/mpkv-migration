import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Sports Details — exact UI match to SportsDetails.aspx
 *
 * Layout:
 *   step-bar → page-wrap → form-card
 *     form-card-header : "Sports Details"
 *     form-card-body   : flex row
 *       yn-item  : "Do you have any Sports Certificate ?"  YES / NO radios
 *       divCertificateType (shown only when YES): Certificate Type dropdown
 *     form-footer: mandatory note | ← Back  Save & Next → (centered) | spacer
 *
 * Logic (mirrors rbnlstIsSportsCertificate_SelectedIndexChanged):
 *   YES → show CertificateType dropdown, enable validator
 *   NO  → hide CertificateType, clear selection
 */
export default function Sports() {
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [certTypes,     setCertTypes]     = useState([])
  const [pageLoading,   setPageLoading]   = useState(true)
  const [applicationId, setApplicationId] = useState('')

  const [isSports,   setIsSports]   = useState('')   // '1'=YES, '0'=NO, ''=not selected
  const [certTypeID, setCertTypeID] = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [error,       setError]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      applicationFormApi.getSportsMasters(),
      applicationFormApi.getSports(),
    ])
      .then(([mRes, dRes]) => {
        setCertTypes(mRes.data.certificateTypes ?? [])
        setApplicationId(user?.userLoginID ?? '')
        const d = dRes.data
        if (d.found) {
          setIsSports(d.isSportsCertificate ? '1' : '0')
          setCertTypeID(d.certificateTypeID > 0 ? d.certificateTypeID.toString() : '')
        }
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  // Mirrors rbnlstIsSportsCertificate_SelectedIndexChanged
  const handleIsSportsChange = e => {
    const val = e.target.value
    setIsSports(val)
    setFieldErrors({})
    setError('')
    if (val === '0') setCertTypeID('')   // clear on NO
  }

  const handleCertTypeChange = e => {
    setCertTypeID(e.target.value)
    setFieldErrors(fe => ({ ...fe, certTypeID: '' }))
    setError('')
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!isSports)
      errs.isSports = 'Please Select Sports Certificate Status.'
    if (isSports === '1' && (!certTypeID || certTypeID === '-1'))
      errs.certTypeID = 'Please Select Certificate Type.'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setSubmitting(true)
    setError('')
    try {
      await applicationFormApi.saveSports({
        isSportsCertificate: isSports === '1',
        certificateTypeID:   isSports === '1' ? parseInt(certTypeID) : 0,
      })
      navigate('/candidate/shortlist')
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Failed to save.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading Sports Details...</p>
      </div>
    </div>
  )

  // ── CSS tokens ────────────────────────────────────────────────────────────
  const V = {
    navy:        '#14212e',
    primary:     '#059669',
    primaryDark: '#047857',
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    danger:      '#ef4444',
    bg:          '#f5f6fa',
  }

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── top info bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${V.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 32px' }}>
        <span style={{ fontSize: 12, color: V.textSecond, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application ID</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: V.primary }}>{applicationId || '—'}</span>
      </div>

      {/* ── step-bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 24px 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Application Form',               active: true  },
          { label: 'College Selection & Preference', active: false },
          { label: 'Documents Upload',               active: false },
          { label: 'Fee Payment',                    active: false },
          { label: 'Lock Form',                      active: false },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              fontSize: 12.5, fontWeight: 600,
              background: s.active ? V.primary : V.borderLight,
              color:      s.active ? '#fff'    : V.textSecond,
              border: `1px solid ${s.active ? V.primary : V.border}`
            }}>
              {s.active && <i className="fas fa-circle" style={{ fontSize: 8 }} />}
              {s.label}
            </div>
            {i < arr.length - 1 && <span style={{ color: V.textSecond, fontSize: 12 }}>›</span>}
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

        <form onSubmit={handleSubmit} noValidate>

          {/* ── form-card */}
          <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* form-card-header */}
            <div style={{ background: V.navy, padding: '16px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Sports Details</h3>
            </div>

            {/* form-card-body — flex row */}
            <div style={{ padding: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* yn-item — Do you have any Sports Certificate? */}
              <div style={{
                background: '#fff', borderRadius: 10,
                border: `1.5px solid ${fieldErrors.isSports ? V.danger : V.border}`,
                padding: '16px 18px', minWidth: 300
              }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: V.textPrimary, marginBottom: 10 }}>
                  Do you have any Sports Certificate ?{' '}
                  <span style={{ color: V.danger }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[{ val: '1', lbl: 'YES' }, { val: '0', lbl: 'NO' }].map(opt => (
                    <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: V.textSecond }}>
                      <input
                        type="radio"
                        name="isSportsCertificate"
                        value={opt.val}
                        checked={isSports === opt.val}
                        onChange={handleIsSportsChange}
                        style={{ accentColor: V.primary, width: 15, height: 15, margin: 0, cursor: 'pointer' }}
                      />
                      {opt.lbl}
                    </label>
                  ))}
                </div>
                {fieldErrors.isSports && (
                  <p style={{ fontSize: 11, color: V.danger, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: 10 }} /> {fieldErrors.isSports}
                  </p>
                )}
              </div>

              {/* Certificate Type — visible only when YES */}
              {isSports === '1' && (
                <div style={{ minWidth: 250 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                    Certificate Type <span style={{ color: V.danger }}>*</span>
                  </label>
                  <select
                    value={certTypeID}
                    onChange={handleCertTypeChange}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: `1.5px solid ${fieldErrors.certTypeID ? V.danger : V.border}`,
                      borderRadius: 8, fontSize: 13.5, color: V.textPrimary,
                      background: '#fff', boxSizing: 'border-box',
                      fontFamily: 'inherit', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="-1">-- Select --</option>
                    {certTypes.map(c => (
                      <option key={c.value} value={c.value}>{c.text}</option>
                    ))}
                  </select>
                  {fieldErrors.certTypeID && (
                    <p style={{ fontSize: 11, color: V.danger, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <i className="fas fa-exclamation-circle" style={{ fontSize: 10 }} /> {fieldErrors.certTypeID}
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* form-footer */}
            <div style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', borderTop: `1px solid ${V.borderLight}`,
              background: '#f8fafc', borderRadius: '0 0 14px 14px',
              flexWrap: 'wrap', gap: 12
            }}>
              {/* left — mandatory note */}
              <div style={{ fontSize: 12, color: V.textSecond, display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <span style={{ color: V.danger }}>*</span> Fields marked are mandatory
              </div>

              {/* center — Back + Save */}
              <div style={{ display: 'flex', gap: 10, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <button
                  type="button"
                  onClick={() => navigate('/candidate/category')}
                  style={{ background: 'transparent', color: V.textPrimary, border: `1.5px solid ${V.border}`, padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: submitting ? '#86efac' : V.primary, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = V.primary }}
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Saving...</>
                    : <>Save &amp; Next →</>}
                </button>
              </div>

              {/* right spacer */}
              <div style={{ flex: 1 }} />
            </div>

          </div>
        </form>
      </div>

      {/* scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: 28, right: 28, width: 44, height: 44, borderRadius: '50%', background: '#f97316', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.4)', zIndex: 50 }}
      >
        <i className="fas fa-chevron-up" />
      </button>

    </div>
  )
}
