import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { normalizedEventValue } from '../../utils/formInput'

/**
 * Address page — mirrors Address.aspx exactly.
 *
 * Layout: same as Personal.jsx (info bar → tab wizard → dark-header section → form)
 *
 * Two address blocks:
 *   1. Correspondence Address  (filled first — same as old form order)
 *   2. Permanent Address       (can be copied from Correspondence via checkbox)
 *
 * Logic (exact match to old code):
 *   - State default = 27 (Maharashtra)
 *   - District list filtered client-side by selected StateID (Group field)
 *   - chkSameAddress checked → copy Corr → Permanent, disable Permanent validators
 *   - Corr State change + sameAddress → sync Permanent state too
 *   - Corr District change + sameAddress → sync Permanent district
 *   - On save success → navigate to /candidate/summary
 */
export default function Address() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── State ─────────────────────────────────────────────────────────────────
  const [allStates,    setAllStates]    = useState([])
  const [allDistricts, setAllDistricts] = useState([])   // all districts, filter client-side
  const [pageLoading,  setPageLoading]  = useState(true)
  const [applicationId,setApplicationId]= useState('')

  // Correspondence address
  const [corr, setCorr] = useState({
    addressLine1: '', addressLine2: '',
    stateID: '27', districtID: '', city: '', pincode: ''
  })

 
  const [perm, setPerm] = useState({
    addressLine1: '', addressLine2: '',
    stateID: '27', districtID: '', city: '', pincode: ''
  })

  const [sameAddress, setSameAddress] = useState(false)
  const [fieldErrors,  setFieldErrors] = useState({})
  const [error,        setError]       = useState('')
  const [submitting,   setSubmitting]  = useState(false)

  // ── Filtered district lists ───────────────────────────────────────────────
  const corrDistricts = allDistricts.filter(d => d.group === corr.stateID)
  const permDistricts = allDistricts.filter(d => d.group === perm.stateID)

  // ── Load masters + existing data ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      applicationFormApi.getAddressMasters(),
      applicationFormApi.getAddress(),
    ])
      .then(([mRes, dRes]) => {
        setAllStates(mRes.data.states ?? [])
        setAllDistricts(mRes.data.districts ?? [])
        setApplicationId(user?.userLoginID ?? '')

        const d = dRes.data
        if (d.found) {
          setCorr({
            addressLine1: d.corrAddressLine1 ?? '',
            addressLine2: d.corrAddressLine2 ?? '',
            stateID:      d.corrStateID?.toString() ?? '27',
            districtID:   d.corrDistrictID?.toString() ?? '',
            city:         d.corrCity    ?? '',
            pincode:      d.corrPincode ?? ''
          })
          setPerm({
            addressLine1: d.addressLine1 ?? '',
            addressLine2: d.addressLine2 ?? '',
            stateID:      d.stateID?.toString() ?? '27',
            districtID:   d.districtID?.toString() ?? '',
            city:         d.city    ?? '',
            pincode:      d.pincode ?? ''
          })
          setSameAddress(d.isCorrAddressSameAsPermanent ?? false)
        }
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => setPageLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Correspondence field change
  const handleCorrChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    const updated = { ...corr, [name]: value }

    // Reset district when state changes — mirrors ddlCorrState_SelectedIndexChanged
    if (name === 'stateID') updated.districtID = ''

    setCorr(updated)
    setFieldErrors(fe => ({ ...fe, [`corr_${name}`]: '' }))
    setError('')

    // If sameAddress → sync permanent too — mirrors old behaviour
    if (sameAddress) {
      setPerm(p => ({
        ...p,
        [name]: value,
        ...(name === 'stateID' ? { districtID: '' } : {})
      }))
    }
  }

  // Correspondence district change — mirrors ddlCorrDistrict_SelectedIndexChanged
  const handleCorrDistrictChange = e => {
    const val = e.target.value
    setCorr(c => ({ ...c, districtID: val }))
    setFieldErrors(fe => ({ ...fe, corr_districtID: '' }))
    if (sameAddress) setPerm(p => ({ ...p, districtID: val }))
  }

  // Permanent field change
  const handlePermChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    if (name === 'stateID') setPerm(p => ({ ...p, stateID: value, districtID: '' }))
    else setPerm(p => ({ ...p, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [`perm_${name}`]: '' }))
    setError('')
  }

  // "Same as Correspondence" checkbox — mirrors chkSameAddress_CheckedChanged
  const handleSameAddress = e => {
    const checked = e.target.checked
    setSameAddress(checked)
    setFieldErrors({})
    if (checked) {
      // Copy Corr → Permanent (old code: perm = corr when checked)
      setPerm({
        addressLine1: corr.addressLine1,
        addressLine2: corr.addressLine2,
        stateID:      corr.stateID,
        districtID:   corr.districtID,
        city:         corr.city,
        pincode:      corr.pincode
      })
    } else {
      // Clear permanent — mirrors old: clear all perm fields, reset state to -1
      setPerm({ addressLine1: '', addressLine2: '', stateID: '27', districtID: '', city: '', pincode: '' })
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!corr.addressLine1.trim())  errs.corr_addressLine1 = 'Required.'
    if (!corr.stateID || corr.stateID === '-1') errs.corr_stateID = 'Please select state.'
    if (!corr.districtID)           errs.corr_districtID   = 'Please select district.'
    if (!corr.city.trim())          errs.corr_city         = 'Required.'
    if (!corr.pincode.trim())       errs.corr_pincode      = 'Required.'
    else if (!/^\d{6}$/.test(corr.pincode.trim())) errs.corr_pincode = 'Enter valid 6-digit pincode.'

    if (!sameAddress) {
      if (!perm.addressLine1.trim()) errs.perm_addressLine1 = 'Required.'
      if (!perm.stateID || perm.stateID === '-1') errs.perm_stateID = 'Please select state.'
      if (!perm.districtID)          errs.perm_districtID   = 'Please select district.'
      if (!perm.city.trim())         errs.perm_city         = 'Required.'
      if (!perm.pincode.trim())      errs.perm_pincode      = 'Required.'
      else if (!/^\d{6}$/.test(perm.pincode.trim())) errs.perm_pincode = 'Enter valid 6-digit pincode.'
    }
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setSubmitting(true); setError('')
    try {
      await applicationFormApi.saveAddress({
        addressLine1: perm.addressLine1.trim(),
        addressLine2: perm.addressLine2.trim(),
        stateID:      parseInt(perm.stateID),
        districtID:   parseInt(perm.districtID),
        city:         perm.city.trim(),
        pincode:      perm.pincode.trim(),
        isCorrAddressSameAsPermanent: sameAddress,
        corrAddressLine1: corr.addressLine1.trim(),
        corrAddressLine2: corr.addressLine2.trim(),
        corrStateID:      parseInt(corr.stateID),
        corrDistrictID:   parseInt(corr.districtID),
        corrCity:         corr.city.trim(),
        corrPincode:      corr.pincode.trim(),
      })
      navigate('/candidate/category')
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Failed to save.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading Address Details...</p>
        </div>
      </div>
    )
  }

  // ── Tab wizard — same as Personal.jsx ────────────────────────────────────
  const tabs = [
    { label: 'Application Form',               active: true  },
    { label: 'College Selection & Preference', active: false },
    { label: 'Documents Upload',               active: false },
    { label: 'Fee Payment',                    active: false },
    { label: 'Lock Form',                      active: false },
  ]

  return (
    <div style={{ fontFamily: 'inherit', background: '#f5f6fa', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Top info bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 24px', display: 'flex', alignItems: 'center',
        flexWrap: 'wrap', gap: '6px 32px'
      }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application ID</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>{applicationId || '—'}</span>
      </div>

      {/* ── Tab wizard bar ───────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap'
      }}>
        {tabs.map((tab, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: tab.active ? '#059669' : 'transparent',
              border: tab.active ? 'none' : '1px solid #d1d5db',
              fontSize: 13, fontWeight: tab.active ? 600 : 500,
              color: tab.active ? '#ffffff' : '#374151', whiteSpace: 'nowrap'
            }}>
              {tab.active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />}
              {tab.label}
            </div>
            {i < tabs.length - 1 && <span style={{ color: '#9ca3af', fontSize: 16, margin: '0 4px' }}>›</span>}
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px' }}>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', borderRadius: 8,
            padding: '10px 16px', marginBottom: 16, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Correspondence Address ─────────────────────────────────── */}
          <div style={{ background: '#ffffff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: '#14212e', padding: '12px 20px', color: '#ffffff', fontSize: 15, fontWeight: 600 }}>
              Correspondence Address
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px', marginBottom: 16 }} className="addr-grid">

                <Field label="Address Line 1" required error={fieldErrors.corr_addressLine1}>
                  <input name="addressLine1" type="text" value={corr.addressLine1}
                    onChange={handleCorrChange} style={inpCls(!!fieldErrors.corr_addressLine1)} />
                </Field>

                <Field label="Address Line 2" error={fieldErrors.corr_addressLine2}>
                  <input name="addressLine2" type="text" value={corr.addressLine2}
                    onChange={handleCorrChange} style={inpCls(false)} />
                </Field>

                <Field label="State" required error={fieldErrors.corr_stateID}>
                  <select name="stateID" value={corr.stateID}
                    onChange={handleCorrChange} style={selCls(!!fieldErrors.corr_stateID)}>
                    <option value="">-- Select State --</option>
                    {allStates.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                  </select>
                </Field>

                <Field label="District" required error={fieldErrors.corr_districtID}>
                  <select value={corr.districtID}
                    onChange={handleCorrDistrictChange} style={selCls(!!fieldErrors.corr_districtID)}>
                    <option value="">-- Select District --</option>
                    {corrDistricts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                  </select>
                </Field>

                <Field label="City / Town" required error={fieldErrors.corr_city}>
                  <input name="city" type="text" value={corr.city}
                    onChange={handleCorrChange} style={inpCls(!!fieldErrors.corr_city)} />
                </Field>

                <Field label="Pincode" required error={fieldErrors.corr_pincode}>
                  <input name="pincode" type="text" maxLength={6} value={corr.pincode}
                    onChange={handleCorrChange} style={inpCls(!!fieldErrors.corr_pincode)} />
                </Field>

              </div>
            </div>
          </div>

          {/* ── Permanent Address ──────────────────────────────────────── */}
          <div style={{ background: '#ffffff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              background: '#14212e', padding: '12px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 600 }}>Permanent Address</span>
              {/* Same as Correspondence checkbox — mirrors chkSameAddress */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ffffff', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={sameAddress}
                  onChange={handleSameAddress}
                  style={{ accentColor: '#10b981', width: 16, height: 16 }}
                />
                Same as Correspondence Address
              </label>
            </div>

            <div style={{ padding: 20 }}>
              {/* Grey overlay when sameAddress is checked */}
              <div style={{ position: 'relative' }}>
                {sameAddress && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(249,250,251,0.7)',
                    zIndex: 2, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                      <i className="fas fa-lock" style={{ marginRight: 6 }} />
                      Same as Correspondence Address
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px' }} className="addr-grid">

                  <Field label="Address Line 1" required={!sameAddress} error={fieldErrors.perm_addressLine1}>
                    <input name="addressLine1" type="text" value={perm.addressLine1}
                      onChange={handlePermChange} disabled={sameAddress}
                      style={{ ...inpCls(!!fieldErrors.perm_addressLine1), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }} />
                  </Field>

                  <Field label="Address Line 2">
                    <input name="addressLine2" type="text" value={perm.addressLine2}
                      onChange={handlePermChange} disabled={sameAddress}
                      style={{ ...inpCls(false), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }} />
                  </Field>

                  <Field label="State" required={!sameAddress} error={fieldErrors.perm_stateID}>
                    <select name="stateID" value={perm.stateID}
                      onChange={handlePermChange} disabled={sameAddress}
                      style={{ ...selCls(!!fieldErrors.perm_stateID), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }}>
                      <option value="">-- Select State --</option>
                      {allStates.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                    </select>
                  </Field>

                  <Field label="District" required={!sameAddress} error={fieldErrors.perm_districtID}>
                    <select value={perm.districtID}
                      onChange={e => { setPerm(p => ({ ...p, districtID: e.target.value })); setFieldErrors(fe => ({ ...fe, perm_districtID: '' })) }}
                      disabled={sameAddress}
                      style={{ ...selCls(!!fieldErrors.perm_districtID), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }}>
                      <option value="">-- Select District --</option>
                      {permDistricts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                    </select>
                  </Field>

                  <Field label="City / Town" required={!sameAddress} error={fieldErrors.perm_city}>
                    <input name="city" type="text" value={perm.city}
                      onChange={handlePermChange} disabled={sameAddress}
                      style={{ ...inpCls(!!fieldErrors.perm_city), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }} />
                  </Field>

                  <Field label="Pincode" required={!sameAddress} error={fieldErrors.perm_pincode}>
                    <input name="pincode" type="text" maxLength={6} value={perm.pincode}
                      onChange={handlePermChange} disabled={sameAddress}
                      style={{ ...inpCls(!!fieldErrors.perm_pincode), ...(sameAddress ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}) }} />
                  </Field>

                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div style={{
            background: '#ffffff', borderRadius: 8, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: 12
          }}>
            <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>* Fields marked are mandatory</p>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#86efac' : '#059669', color: '#ffffff',
                border: 'none', padding: '10px 28px', borderRadius: 6,
                fontSize: 14, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'background 0.2s'
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#047857' }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#059669' }}
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Saving...</>
                : <>Save &amp; Next →</>
              }
            </button>
          </div>

        </form>
      </div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: 28, right: 28, width: 44, height: 44,
          borderRadius: '50%', background: '#f97316', color: '#ffffff',
          border: 'none', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(249,115,22,0.4)', zIndex: 50
        }}
      >
        <i className="fas fa-chevron-up" />
      </button>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 768px) { .addr-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 1024px) and (min-width: 769px) { .addr-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: 10 }} /> {error}
        </p>
      )}
    </div>
  )
}

function inpCls(hasError) {
  return {
    width: '100%', padding: '8px 10px',
    border: `1px solid ${hasError ? '#f87171' : '#d1d5db'}`,
    borderRadius: 6, fontSize: 13, color: '#111827',
    background: hasError ? '#fef2f2' : '#ffffff',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
  }
}

function selCls(hasError) {
  return { ...inpCls(hasError), cursor: 'pointer', appearance: 'auto' }
}
