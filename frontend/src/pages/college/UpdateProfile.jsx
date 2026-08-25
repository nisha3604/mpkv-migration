import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { profileApi } from '../../services/api'

/**
 * Update Profile — mirrors Administration/EditUserProfile.aspx + .aspx.cs
 *
 * Exact functionality:
 *  Page Load:
 *   - Administration_GetUserDetails(@UserID) → UserName, UserMobileNo, UserEMailID
 *   - UserName prefilled in UPPER, EMailID in lower
 *
 *  Validations (mirrors old RequiredFieldValidator + RegularExpressionValidator):
 *   - UserName: required, alphabets + space + apostrophe only
 *   - UserMobileNo: required, exactly 10 digits, must start with 6-9
 *   - UserEMailID: required, valid email format
 *
 *  Save (btnSave_Click):
 *   - Administration_EditUser(@UserID, @UserTypeID, @UserName(UPPER),
 *       @UserMobileNo, @UserEMailID(lower), @ModifiedBy, @ModifiedByIPAddress)
 *   - returnValue == "Y" → "Profile Updated Successfully."
 *   - else → show error message
 */
export default function UpdateProfile() {
  const { user, updateUser } = useAuth()

  const [form, setForm]       = useState({ userName: '', userMobileNo: '', userEMailID: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  // ── Load profile — mirrors Page_Load → GetUserDetails(user.UserID) ─────────
  useEffect(() => {
    profileApi.getProfile()
      .then(res => {
        if (res.data.success && res.data.profile) {
          const p = res.data.profile
          setForm({
            userName    : p.userName     ?? '',
            userMobileNo: p.userMobileNo ?? '',
            userEMailID : p.userEMailID  ?? '',
          })
        } else {
          setError(res.data.message || 'Failed to load profile.')
        }
      })
      .catch(() => setError('Failed to load profile. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target
    let v = value
    // UserName → force UPPER (mirrors: CssClass="upper")
    if (name === 'userName') v = value.toUpperCase()
    setForm(p => ({ ...p, [name]: v }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  // Only allow alphabets, space, apostrophe (mirrors AllowOnlyAlphabetsSpaceAndApostrophe)
  const onKeyPressName = e => {
    if (!/[a-zA-Z '\u0900-\u097F]/.test(e.key)) e.preventDefault()
  }

  // Only allow numbers (mirrors AllowOnlyNumbers)
  const onKeyPressNumbers = e => {
    if (!/[0-9]/.test(e.key)) e.preventDefault()
  }

  // ── Validation (mirrors RequiredFieldValidator + RegularExpressionValidator)
  const validate = () => {
    const e = {}
    if (!form.userName.trim())
      e.userName = 'Please Enter User Name.'
    if (!form.userMobileNo.trim())
      e.userMobileNo = 'Please Enter User Mobile Number.'
    else if (!/^[6-9]\d{9}$/.test(form.userMobileNo.trim()))
      e.userMobileNo = 'User Mobile Number Should be Proper and of 10 Digits.'
    if (!form.userEMailID.trim())
      e.userEMailID = 'Please Enter User E-Mail ID.'
    else if (!/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(form.userEMailID.trim()))
      e.userEMailID = 'Please Enter Valid User E-Mail ID.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Save — mirrors btnSave_Click ──────────────────────────────────────────
  const handleSave = async () => {
    setSuccess(''); setError('')
    if (!validate()) return
    setSaving(true)
    try {
      const res = await profileApi.saveProfile({
        userName    : form.userName.trim().toUpperCase(),
        userMobileNo: form.userMobileNo.trim(),
        userEMailID : form.userEMailID.trim().toLowerCase(),
      })
      if (res.data.success) {
        setSuccess(res.data.message || 'Profile Updated Successfully.')
        // Update navbar name if AuthContext supports it
        if (updateUser) updateUser({ userName: form.userName.trim().toUpperCase() })
      } else {
        setError(res.data.message || 'Data has not been saved. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Design ────────────────────────────────────────────────────────────────
  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa' }

  const inpCls = (hasErr) =>
    `w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
      hasErr ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-emerald-500'
    }`

  const Field = ({ label, required, error: err, children }) => (
    <div>
      <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {err && (
        <p className="mt-1 text-[11.5px] text-red-500 flex items-center gap-1">
          <i className="fas fa-exclamation-circle" /> {err}
        </p>
      )}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        <div className="card overflow-hidden shadow-sm max-w-3xl mx-auto">

          {/* Card header */}
          <div style={{ background: V.navy }} className="px-5 py-3.5 flex items-center gap-2.5">
            <i className="fas fa-user-edit text-gray-400 text-sm" />
            <span className="text-white font-semibold text-sm tracking-wide">Update Profile</span>
          </div>

          <div className="px-6 py-5">

            {/* Success */}
            {success && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm font-medium">
                <i className="fas fa-check-circle flex-shrink-0" /> {success}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
              </div>
            )}

            {/* Form fields — 3 columns matching old col-md-4 layout */}
            <div className="grid grid-cols-3 gap-5">

              {/* User Name */}
              <Field label="User Name" required error={errors.userName}>
                <input
                  name="userName"
                  value={form.userName}
                  onChange={handleChange}
                  onKeyPress={onKeyPressName}
                  maxLength={150}
                  placeholder="Enter user name"
                  className={inpCls(!!errors.userName)}
                  style={{ textTransform: 'uppercase' }}
                />
              </Field>

              {/* User Mobile Number */}
              <Field label="User Mobile Number" required error={errors.userMobileNo}>
                <input
                  name="userMobileNo"
                  value={form.userMobileNo}
                  onChange={handleChange}
                  onKeyPress={onKeyPressNumbers}
                  maxLength={10}
                  placeholder="10-digit mobile (6-9...)"
                  className={inpCls(!!errors.userMobileNo)}
                />
              </Field>

              {/* User E-Mail ID */}
              <Field label="User E-Mail ID" required error={errors.userEMailID}>
                <input
                  name="userEMailID"
                  type="email"
                  value={form.userEMailID}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="user@example.com"
                  className={inpCls(!!errors.userEMailID)}
                />
              </Field>
            </div>
          </div>

          {/* Card footer — Save button (mirrors card-footer text-center) */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-8 py-2.5 rounded-lg text-sm shadow transition-colors">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : <><i className="fas fa-save" /> Save</>
              }
            </button>
          </div>
        </div>
      </div>

    </>
  )
}
