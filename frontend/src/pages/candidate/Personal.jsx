import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationFormApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { normalizedEventValue } from '../../utils/formInput'

/**
 * Personal Info — layout exactly matches old Personal.aspx screenshot:
 *
 * Top bar : APPLICATION ID  2026101042   APPLIED COURSE  DIPLOMA IN...
 * Tab bar : ● Application Form  ›  College Selection  ›  Documents Upload  ›  Fee Payment  ›  Lock Form
 * Section : Dark header "Personal Details"
 * Grid    : 4 columns per row — same as old Bootstrap grid layout
 *   Row 1 : Apply For* | Candidate's Full Name* | Father's Full Name* | Mother's Full Name*
 *   Row 2 : Gender*    | Date of Birth*         | Age as on 01/07/2026 | Mobile Number* (+91 prefix)
 *   Row 3 : E-Mail ID* | Are You a Resident of India? (Yes/No radio)
 * Footer  : * Fields marked are mandatory    [Save & Next →]    scroll-to-top button
 */
export default function Personal() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── State ─────────────────────────────────────────────────────────────────
  const [masters,       setMasters]       = useState({ courses: [], genders: [] })
  const [mastersLoading,setMastersLoading]= useState(true)
  const [pageLoading,   setPageLoading]   = useState(true)
  const [applicationId, setApplicationId] = useState('')
  const [appliedCourseName, setAppliedCourseName] = useState('')

  const [form, setForm] = useState({
    appliedCourseID:   '',
    candidateName:     '',
    fatherName:        '',
    motherName:        '',
    genderCode:        '',
    dob:               '',
    mobileNo:          '',
    emailID:           '',
    isResidentOfIndia: '1',
  })

  const [age,        setAge]        = useState('')
  const [fieldErrors,setFieldErrors]= useState({})
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      applicationFormApi.getPersonalMasters(),
      applicationFormApi.getPersonal(),
    ])
      .then(([mRes, dRes]) => {
        setMasters(mRes.data)
        const d = dRes.data
        if (d.found) {
          const cid = d.appliedCourseID?.toString() ?? ''
          setForm({
            appliedCourseID:   cid,
            candidateName:     d.candidateName  ?? '',
            fatherName:        d.fatherName     ?? '',
            motherName:        d.motherName     ?? '',
            genderCode:        d.genderCode     ?? '',
            dob:               d.dob            ?? '',
            mobileNo:          d.mobileNo       ?? '',
            emailID:           d.emailID        ?? '',
            isResidentOfIndia: d.isResidentOfIndia?.toString() ?? '1',
          })
          if (d.dob) setAge(computeAge(d.dob))
          setApplicationId(d.applicationID ?? user?.userLoginID ?? '')
          // course name set after masters load
          setTimeout(() => {
            setAppliedCourseName(
              mRes.data.courses.find(c => c.value === cid)?.text ?? ''
            )
          }, 0)
        } else {
          setApplicationId(user?.userLoginID ?? '')
        }
      })
      .catch(() => setError('Failed to load page data. Please refresh.'))
      .finally(() => { setMastersLoading(false); setPageLoading(false) })
  }, [])

  // Update course name when appliedCourseID changes
  useEffect(() => {
    if (form.appliedCourseID && masters.courses.length > 0) {
      setAppliedCourseName(
        masters.courses.find(c => c.value === form.appliedCourseID)?.text ?? ''
      )
    }
  }, [form.appliedCourseID, masters.courses])

  // ── Age formula — cutoff July 1, 2026 ────────────────────────────────────
  function computeAge(isoDate) {
    if (!isoDate) return ''
    const dob    = new Date(isoDate)
    const cutoff = new Date(2026, 6, 1)
    let years  = cutoff.getFullYear() - dob.getFullYear()
    let months = cutoff.getMonth()    - dob.getMonth()
    let days   = cutoff.getDate()     - dob.getDate()
    if (days < 0) {
      months--
      const pm = cutoff.getMonth() === 0 ? 11 : cutoff.getMonth() - 1
      const py = cutoff.getMonth() === 0 ? cutoff.getFullYear() - 1 : cutoff.getFullYear()
      days += new Date(py, pm + 1, 0).getDate()
    }
    if (months < 0) { years--; months += 12 }
    return `${years} years ${months} months ${days} days`
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = e => {
    const { name } = e.target
    const value = normalizedEventValue(e)
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setError('')
    if (name === 'dob') setAge(value ? computeAge(value) : '')
  }

  const validate = () => {
    const errs = {}
    if (!form.appliedCourseID || form.appliedCourseID === '-1') errs.appliedCourseID = 'Please select the applied course.'
    if (!form.candidateName.trim())  errs.candidateName  = "Required."
    if (!form.fatherName.trim())     errs.fatherName     = "Required."
    if (!form.motherName.trim())     errs.motherName     = "Required."
    if (!form.genderCode)            errs.genderCode     = "Required."
    if (!form.dob)                   errs.dob            = "Required."
    if (!form.mobileNo.trim())       errs.mobileNo       = "Required."
    else if (!/^\d{10}$/.test(form.mobileNo.trim())) errs.mobileNo = 'Enter valid 10-digit number.'
    if (!form.emailID.trim())        errs.emailID        = "Required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailID.trim())) errs.emailID = 'Enter valid email.'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setSubmitting(true); setError('')
    try {
      const [y, m, d] = form.dob.split('-')
      await applicationFormApi.savePersonal({
        appliedCourseID:   parseInt(form.appliedCourseID),
        candidateName:     form.candidateName.trim(),
        fatherName:        form.fatherName.trim(),
        motherName:        form.motherName.trim(),
        genderCode:        form.genderCode,
        dob:               `${d}/${m}/${y}`,
        mobileNo:          form.mobileNo.trim(),
        emailID:           form.emailID.trim().toLowerCase(),
        isResidentOfIndia: parseInt(form.isResidentOfIndia),
      })
      navigate('/candidate/address')
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
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading Personal Details...</p>
        </div>
      </div>
    )
  }

  // ── Tab steps — same as old wizard tabs ───────────────────────────────────
  const tabs = [
    { label: 'Application Form',          active: true  },
    { label: 'College Selection & Preference', active: false },
    { label: 'Documents Upload',          active: false },
    { label: 'Fee Payment',               active: false },
    { label: 'Lock Form',                 active: false },
  ]

  return (
    <div style={{ fontFamily: 'inherit', background: '#f5f6fa', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Top info bar: APPLICATION ID + APPLIED COURSE ─────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 24px', display: 'flex', alignItems: 'center',
        flexWrap: 'wrap', gap: '6px 32px'
      }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Application ID
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
          {applicationId || user?.userLoginID || '—'}
        </span>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginLeft: 16 }}>
          Applied Course
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
          {appliedCourseName || '—'}
        </span>
      </div>

      {/* ── Tab wizard bar ────────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        gap: 0, flexWrap: 'wrap'
      }}>
        {tabs.map((tab, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: tab.active ? '#059669' : 'transparent',
              border: tab.active ? 'none' : '1px solid #d1d5db',
              cursor: tab.active ? 'default' : 'pointer',
              fontSize: 13, fontWeight: tab.active ? 600 : 500,
              color: tab.active ? '#ffffff' : '#374151',
              whiteSpace: 'nowrap'
            }}>
              {tab.active && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ffffff', display: 'inline-block'
                }} />
              )}
              {tab.label}
            </div>
            {i < tabs.length - 1 && (
              <span style={{ color: '#9ca3af', fontSize: 16, margin: '0 4px' }}>›</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px' }}>

        {/* Global error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', borderRadius: 8, padding: '10px 16px',
            marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── Personal Details section ────────────────────────────────────── */}
        <div style={{
          background: '#ffffff', borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden'
        }}>
          {/* Dark section header — same as old panel-heading dark */}
          <div style={{
            background: '#14212e', padding: '12px 20px',
            color: '#ffffff', fontSize: 15, fontWeight: 600
          }}>
            Personal Details
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ padding: '20px' }}>

            {/* Row 1: Apply For | Candidate Name | Father Name | Mother Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', marginBottom: 16 }}>

              <Field label="Apply For" required error={fieldErrors.appliedCourseID}>
                <select
                  name="appliedCourseID"
                  value={form.appliedCourseID}
                  onChange={handleChange}
                  disabled={mastersLoading}
                  style={selCls(!!fieldErrors.appliedCourseID)}
                >
                  <option value="">-- Select --</option>
                  {masters.courses.map(c => (
                    <option key={c.value} value={c.value}>{c.text}</option>
                  ))}
                </select>
              </Field>

              <Field label="Candidate's Full Name" required error={fieldErrors.candidateName}>
                <input
                  name="candidateName"
                  type="text"
                  value={form.candidateName}
                  onChange={handleChange}
                  style={inpCls(!!fieldErrors.candidateName)}
                />
              </Field>

              <Field label="Father's Full Name" required error={fieldErrors.fatherName}>
                <input
                  name="fatherName"
                  type="text"
                  value={form.fatherName}
                  onChange={handleChange}
                  style={inpCls(!!fieldErrors.fatherName)}
                />
              </Field>

              <Field label="Mother's Full Name" required error={fieldErrors.motherName}>
                <input
                  name="motherName"
                  type="text"
                  value={form.motherName}
                  onChange={handleChange}
                  style={inpCls(!!fieldErrors.motherName)}
                />
              </Field>

            </div>

            {/* Row 2: Gender | DOB | Age | Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', marginBottom: 16 }}>

              <Field label="Gender" required error={fieldErrors.genderCode}>
                <select
                  name="genderCode"
                  value={form.genderCode}
                  onChange={handleChange}
                  disabled={mastersLoading}
                  style={selCls(!!fieldErrors.genderCode)}
                >
                  <option value="">-- Select --</option>
                  {masters.genders.map(g => (
                    <option key={g.value} value={g.value}>{g.text}</option>
                  ))}
                </select>
              </Field>

              <Field label="Date of Birth (DD/MM/YYYY)" required error={fieldErrors.dob}>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={inpCls(!!fieldErrors.dob)}
                />
              </Field>

              <Field label="Age as on 01/07/2026">
                <input
                  type="text"
                  value={age}
                  readOnly
                  placeholder="Auto-calculated"
                  style={{
                    ...inpCls(false),
                    background: '#f1f5f9',
                    color: '#475569',
                    cursor: 'not-allowed'
                  }}
                />
              </Field>

              <Field label="Mobile Number" required error={fieldErrors.mobileNo}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '8px 10px', background: '#f1f5f9',
                    border: '1px solid #d1d5db', borderRight: 'none',
                    borderRadius: '6px 0 0 6px', fontSize: 13,
                    color: '#374151', fontWeight: 600, whiteSpace: 'nowrap'
                  }}>+91</span>
                  <input
                    name="mobileNo"
                    type="tel"
                    maxLength={10}
                    value={form.mobileNo}
                    onChange={handleChange}
                    style={{
                      ...inpCls(!!fieldErrors.mobileNo),
                      borderRadius: '0 6px 6px 0',
                      borderLeft: 'none',
                      flex: 1
                    }}
                  />
                </div>
              </Field>

            </div>

            {/* Row 3: E-Mail | Resident of India */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', marginBottom: 24 }}>

              <Field label="E-Mail ID" required error={fieldErrors.emailID}>
                <input
                  name="emailID"
                  type="email"
                  value={form.emailID}
                  onChange={handleChange}
                  style={inpCls(!!fieldErrors.emailID)}
                />
              </Field>

              <Field label="Are You a Resident of India?" required>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 6 }}>
                  {[{ val: '1', label: 'Yes' }, { val: '0', label: 'No' }].map(opt => (
                    <label key={opt.val} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'pointer', fontSize: 14, color: '#374151'
                    }}>
                      <input
                        type="radio"
                        name="isResidentOfIndia"
                        value={opt.val}
                        checked={form.isResidentOfIndia === opt.val}
                        onChange={handleChange}
                        style={{ accentColor: '#059669', width: 16, height: 16 }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </Field>

            </div>

            {/* Footer: mandatory note + Save button + scroll-top */}
            <div style={{
              borderTop: '1px solid #e2e8f0', paddingTop: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12
            }}>
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>
                * Fields marked are mandatory
              </p>

              <button
                type="submit"
                disabled={submitting || mastersLoading}
                style={{
                  background: submitting ? '#86efac' : '#059669',
                  color: '#ffffff', border: 'none',
                  padding: '10px 28px', borderRadius: 6,
                  fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
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
      </div>

      {/* ── Scroll to top button — orange circle, same as old ─────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 44, height: 44, borderRadius: '50%',
          background: '#f97316', color: '#ffffff',
          border: 'none', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
          zIndex: 50
        }}
      >
        <i className="fas fa-chevron-up" />
      </button>

    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 600,
        color: '#374151', marginBottom: 5
      }}>
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

// ── Input styles — same white background with border like old Bootstrap form-control ──
function inpCls(hasError) {
  return {
    width: '100%', padding: '8px 10px',
    border: `1px solid ${hasError ? '#f87171' : '#d1d5db'}`,
    borderRadius: 6, fontSize: 13, color: '#111827',
    background: hasError ? '#fef2f2' : '#ffffff',
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box'
  }
}

function selCls(hasError) {
  return {
    ...inpCls(hasError),
    cursor: 'pointer', appearance: 'auto'
  }
}
