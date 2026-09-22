import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { collegeApi } from '../../services/api'

// ── Colour tokens (matches rest of admin UI) ─────────────────────────────────
const V = {
  navy   : '#14212e',
  primary: '#059669',
  teal   : '#0d9488',
  border : '#e2e8f0',
  bg     : '#f5f6fa',
}

// ── Validation helpers (mirrors old project validators) ──────────────────────
const RULES = {
  collegeCode          : v => /^\d{1,5}$/.test(v.trim())       || 'College Code must be 1–5 digits.',
  collegeName          : v => v.trim().length > 0               || 'College Name is required.',
  collegeAddress       : v => v.trim().length > 0               || 'Address is required.',
  districtID           : v => Number(v) > 0                     || 'Please select a District.',
  taluka               : v => v.trim().length > 0               || 'Taluka is required.',
  city                 : v => v.trim().length > 0               || 'City / Village is required.',
  pincode              : v => /^\d{6}$/.test(v.trim())          || 'PIN must be exactly 6 digits.',
  mobileNo             : v => /^[1-9]\d{9}$/.test(v.trim())    || 'Mobile No must be 10 digits (no leading 0).',
  emailID              : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid Email ID.',
  courseID             : v => Number(v) > 0                     || 'Please select a Course.',
  courseStatusID       : v => Number(v) > 0                     || 'Please select a Course Status.',
  intake               : v => /^\d{1,3}$/.test(v.toString().trim()) || 'Intake is required (max 3 digits).',
  principalName        : v => v.trim().length > 0               || 'Principal Name is required.',
  principalEmailID     : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid Principal Email.',
  principalMobileNo    : v => /^[1-9]\d{9}$/.test(v.trim())    || 'Principal Mobile must be 10 digits.',
  admissionInchargeName: v => v.trim().length > 0               || 'Admission Incharge Name is required.',
  admissionInchargeEmailID  : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid Admission Incharge Email.',
  admissionInchargeMobileNo : v => /^[1-9]\d{9}$/.test(v.trim()) || 'Admission Incharge Mobile must be 10 digits.',
}

function validate(form, isAdmin) {
  const errs = {}
  // Admin-only fields (non-admins can't change them, so skip validation for those)
  const adminFields = ['collegeCode','collegeName','districtID','courseID','courseStatusID','intake']
  Object.entries(RULES).forEach(([field, rule]) => {
    if (!isAdmin && adminFields.includes(field)) return
    const result = rule(form[field] ?? '')
    if (result !== true) errs[field] = result
  })
  return errs
}

// ── Reusable field wrapper ───────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ── Shared input style ───────────────────────────────────────────────────────
function inputCls(disabled, hasError) {
  return [
    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition',
    disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900',
    hasError ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200 focus:border-emerald-500',
  ].join(' ')
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, cols = 3, children }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b-2"
          style={{ color: V.teal, borderColor: V.teal }}>
        {title}
      </h4>
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {children}
      </div>
    </div>
  )
}

// ── Empty form (outside component — stable reference) ───────────────────────
const EMPTY_FORM = {
  collegeCode: '', collegeName: '', collegeAddress: '', districtID: '0',
  taluka: '', city: '', pincode: '', mobileNo: '', emailID: '',
  courseID: '0', courseStatusID: '0', intake: '', hasManagementQuota: '0',
  principalName: '', principalEmailID: '', principalMobileNo: '',
  admissionInchargeName: '', admissionInchargeEmailID: '', admissionInchargeMobileNo: '',
}

// ── Main component ───────────────────────────────────────────────────────────
export default function EditCollegeDetails() {
  const { user, isAdmin }   = useAuth()
  const navigate            = useNavigate()
  const [searchParams]      = useSearchParams()
  const collegeIdQS         = searchParams.get('collegeId')   // null = Add New, value = Edit
  const isNew               = !collegeIdQS                    // true when creating a new college

  const [masters,  setMasters]  = useState({ districts: [], courses: [], courseStatuses: [] })
  const [form,     setForm]     = useState(null)
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [apiSuccess, setApiSuccess] = useState('')

  // ── Load form data + masters ─────────────────────────────────────────────
  useEffect(() => {
    setForm(null)        // clear stale data immediately — spinner shows until API responds
    setMasters({ districts: [], courses: [], courseStatuses: [] })
    setErrors({})
    setApiError('')
    setApiSuccess('')
    setLoading(true)
    collegeApi.getDetails(collegeIdQS)
      .then(res => {
        const d = res.data?.details ?? {}
        setForm({
          collegeCode              : d.collegeCode               ?? '',
          collegeName              : d.collegeName               ?? '',
          collegeAddress           : d.collegeAddress            ?? '',
          districtID               : String(d.districtID         ?? 0),
          taluka                   : d.taluka                    ?? '',
          city                     : d.city                      ?? '',
          pincode                  : d.pincode                   ?? '',
          mobileNo                 : d.mobileNo                  ?? '',
          emailID                  : d.emailID                   ?? '',
          courseID                 : String(d.courseID           ?? 0),
          courseStatusID           : String(d.courseStatusID     ?? 0),
          intake                   : String(d.intake ?? ''),
          hasManagementQuota       : String(d.hasManagementQuotaValue ?? 0),
          principalName            : d.principalName             ?? '',
          principalEmailID         : d.principalEmailID          ?? '',
          principalMobileNo        : d.principalMobileNo         ?? '',
          admissionInchargeName    : d.admissionInchargeName     ?? '',
          admissionInchargeEmailID : d.admissionInchargeEmailID  ?? '',
          admissionInchargeMobileNo: d.admissionInchargeMobileNo ?? '',
        })
        setMasters({
          districts     : res.data?.districts      ?? [],
          courses       : res.data?.courses        ?? [],
          courseStatuses: res.data?.courseStatuses ?? [],
        })
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to load college details. Please try again.'
        setApiError(msg)
        setForm({ ...EMPTY_FORM })
        setMasters({ districts: [], courses: [], courseStatuses: [] })
      })
      .finally(() => setLoading(false))
  }, [collegeIdQS])

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target
    // Numeric-only fields (mirrors AllowOnlyNumbers JS in old project)
    if (['collegeCode','pincode','mobileNo','intake','principalMobileNo',
         'admissionInchargeMobileNo'].includes(name) && value && !/^\d*$/.test(value)) return
    setForm(p => ({ ...p, [name]: value }))
    // Clear field error on change
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n })
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate(form, isAdmin)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll to top to show summary
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true); setApiError(''); setApiSuccess('')
    try {
      // Build payload — uppercase text fields, lowercase emails (mirrors old project)
      const payload = {
        ...form,
        collegeName              : form.collegeName.toUpperCase(),
        collegeAddress           : form.collegeAddress.toUpperCase(),
        taluka                   : form.taluka.toUpperCase(),
        city                     : form.city.toUpperCase(),
        principalName            : form.principalName.toUpperCase(),
        admissionInchargeName    : form.admissionInchargeName.toUpperCase(),
        emailID                  : form.emailID.toLowerCase(),
        principalEmailID         : form.principalEmailID.toLowerCase(),
        admissionInchargeEmailID : form.admissionInchargeEmailID.toLowerCase(),
      }
      const res = await collegeApi.save(payload, collegeIdQS)
      if (res.data?.success) {
        setApiSuccess(res.data.message ?? 'College saved successfully.')
        setTimeout(() => {
          // Backend returns CollegeCode (3-char) on success
          const savedCode = res.data.collegeCode ?? collegeIdQS
          if (isAdmin) {
            navigate(savedCode
              ? `/admin/college/summary?collegeId=${savedCode}`
              : '/admin/college/list')
          } else {
            navigate('/college/summary')
          }
        }, 1200)
      } else {
        setApiError(res.data?.message ?? 'Save failed. Please try again.')
      }
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Server error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Helpers for field disabled state (mirrors onPageLoad rules) ───────────
  // College code: editable only when adding new AND user is admin
  const codeDisabled     = !isAdmin || !isNew
  // Admin-only fields (college, course data)
  const adminOnly        = !isAdmin

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading || !form) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const errCount = Object.keys(errors).length

  return (
    <div className="p-4 max-w-5xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="rounded-t-lg px-6 py-4 mb-0" style={{ background: V.navy }}>
        <h1 className="text-white text-xl font-semibold tracking-wide">
          {isNew ? 'Add New College' : `Edit College Details`}
        </h1>
        <p className="text-gray-300 text-sm mt-0.5">
          {isNew
            ? 'Fill in all required fields to register a new college.'
            : `Updating college: ${form?.collegeCode ? `College Code — ${form.collegeCode}` : ''}`}
        </p>
      </div>

      {/* ── Validation summary ───────────────────────────────────────── */}
      {errCount > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 text-sm rounded-b-none">
          <p className="font-semibold mb-1">Please fix {errCount} error{errCount > 1 ? 's' : ''} before saving:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {Object.values(errors).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── API messages ─────────────────────────────────────────────── */}
      {(apiError || apiSuccess) && (
        <div className={`px-4 py-3 text-sm border ${
          apiError
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-green-50 border-green-300 text-green-700'
        } ${errCount > 0 ? '' : 'rounded-b-none'}`}>
          {apiError || apiSuccess}
        </div>
      )}

      {/* ── Form card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-b-lg shadow-md border border-t-0 border-gray-200 overflow-hidden">
        <div className="p-6">

          {/* ── College Information ────────────────────────────────── */}
          <Section title="College Information" cols={3}>
            <Field label="College Code" required error={errors.collegeCode}>
              <input
                name="collegeCode"
                value={form.collegeCode}
                onChange={handleChange}
                disabled={codeDisabled}
                maxLength={5}
                placeholder={isNew ? 'e.g. 10001' : ''}
                className={inputCls(codeDisabled, !!errors.collegeCode)}
              />
              {codeDisabled && !isNew && (
                <p className="text-xs text-gray-400 mt-0.5">College code cannot be changed after creation.</p>
              )}
            </Field>

            <Field label="College Name" required error={errors.collegeName}>
              <input
                name="collegeName"
                value={form.collegeName}
                onChange={handleChange}
                disabled={adminOnly}
                maxLength={250}
                className={inputCls(adminOnly, !!errors.collegeName)}
              />
            </Field>

            <Field label="District" required error={errors.districtID}>
              <select
                name="districtID"
                value={form.districtID}
                onChange={handleChange}
                disabled={adminOnly}
                className={inputCls(adminOnly, !!errors.districtID)}
              >
                <option value="0">-- Select District --</option>
                {masters.districts.map(d => (
                  <option key={d.value} value={d.value}>{d.text}</option>
                ))}
              </select>
            </Field>

            <Field label="Taluka" required error={errors.taluka}>
              <input name="taluka" value={form.taluka} onChange={handleChange}
                maxLength={50} className={inputCls(false, !!errors.taluka)} />
            </Field>

            <Field label="City / Village" required error={errors.city}>
              <input name="city" value={form.city} onChange={handleChange}
                maxLength={50} className={inputCls(false, !!errors.city)} />
            </Field>

            <Field label="PIN Code" required error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={handleChange}
                maxLength={6} placeholder="6 digits" className={inputCls(false, !!errors.pincode)} />
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="College Address" required error={errors.collegeAddress}>
                <input name="collegeAddress" value={form.collegeAddress} onChange={handleChange}
                  maxLength={250} className={inputCls(false, !!errors.collegeAddress)} />
              </Field>
            </div>

            <Field label="Mobile No." required error={errors.mobileNo}>
              <input name="mobileNo" value={form.mobileNo} onChange={handleChange}
                maxLength={10} placeholder="10 digits" className={inputCls(false, !!errors.mobileNo)} />
            </Field>

            <Field label="Email ID" required error={errors.emailID}>
              <input name="emailID" value={form.emailID} onChange={handleChange}
                maxLength={100} type="email" className={inputCls(false, !!errors.emailID)} />
            </Field>
          </Section>

          {/* ── Course Information ─────────────────────────────────── */}
          <Section title="Course Information" cols={4}>
            <Field label="Course" required error={errors.courseID}>
              <select name="courseID" value={form.courseID} onChange={handleChange}
                disabled={adminOnly} className={inputCls(adminOnly, !!errors.courseID)}>
                <option value="0">-- Select Course --</option>
                {masters.courses.map(c => (
                  <option key={c.value} value={c.value}>{c.text}</option>
                ))}
              </select>
            </Field>

            <Field label="Course Status" required error={errors.courseStatusID}>
              <select name="courseStatusID" value={form.courseStatusID} onChange={handleChange}
                disabled={adminOnly} className={inputCls(adminOnly, !!errors.courseStatusID)}>
                <option value="0">-- Select Status --</option>
                {masters.courseStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.text}</option>
                ))}
              </select>
            </Field>

            <Field label="Intake" required error={errors.intake}>
              <input name="intake" value={form.intake} onChange={handleChange}
                disabled={adminOnly} maxLength={3} placeholder="e.g. 60"
                className={inputCls(adminOnly, !!errors.intake)} />
            </Field>

            <Field label="Management Quota" required>
              <select name="hasManagementQuota" value={form.hasManagementQuota}
                onChange={handleChange} disabled={adminOnly}
                className={inputCls(adminOnly, false)}>
                <option value="0">NO</option>
                <option value="1">YES</option>
              </select>
            </Field>
          </Section>

          {/* ── Principal Details ──────────────────────────────────── */}
          <Section title="Principal Details" cols={3}>
            <Field label="Principal Name" required error={errors.principalName}>
              <input name="principalName" value={form.principalName} onChange={handleChange}
                maxLength={150} className={inputCls(false, !!errors.principalName)} />
            </Field>

            <Field label="Principal Email ID" required error={errors.principalEmailID}>
              <input name="principalEmailID" value={form.principalEmailID} onChange={handleChange}
                maxLength={100} type="email" className={inputCls(false, !!errors.principalEmailID)} />
            </Field>

            <Field label="Principal Mobile No." required error={errors.principalMobileNo}>
              <input name="principalMobileNo" value={form.principalMobileNo} onChange={handleChange}
                maxLength={10} placeholder="10 digits" className={inputCls(false, !!errors.principalMobileNo)} />
            </Field>
          </Section>

          {/* ── Admission Incharge Details ─────────────────────────── */}
          <Section title="Admission Incharge Details" cols={3}>
            <Field label="Name" required error={errors.admissionInchargeName}>
              <input name="admissionInchargeName" value={form.admissionInchargeName} onChange={handleChange}
                maxLength={150} className={inputCls(false, !!errors.admissionInchargeName)} />
            </Field>

            <Field label="Email ID" required error={errors.admissionInchargeEmailID}>
              <input name="admissionInchargeEmailID" value={form.admissionInchargeEmailID} onChange={handleChange}
                maxLength={100} type="email" className={inputCls(false, !!errors.admissionInchargeEmailID)} />
            </Field>

            <Field label="Mobile No." required error={errors.admissionInchargeMobileNo}>
              <input name="admissionInchargeMobileNo" value={form.admissionInchargeMobileNo} onChange={handleChange}
                maxLength={10} placeholder="10 digits" className={inputCls(false, !!errors.admissionInchargeMobileNo)} />
            </Field>
          </Section>

        </div>

        {/* ── Footer actions ────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
          >
            ← Back
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-7 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: saving ? '#6b7280' : V.primary }}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Saving…
              </>
            ) : (
              isNew ? 'Save & Proceed ›››' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
