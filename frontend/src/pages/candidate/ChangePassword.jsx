import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Change Password — mirrors ChangePassword.aspx exactly.
 * Validates old password on backend (Account_GetPassword SP).
 * Saves new password via Account_ResetPassword SP.
 */
export default function ChangePassword() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [form, setForm]         = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    border:'#e2e8f0', textSecond:'#64748b', textPrimary:'#0f172a',
    danger:'#ef4444', bg:'#f5f6fa',
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(er => ({ ...er, [name]: '' }))
    setError(''); setSuccess('')
  }

  const validate = () => {
    const errs = {}
    if (!form.oldPassword.trim())     errs.oldPassword     = 'Please enter your current password.'
    if (!form.newPassword.trim())     errs.newPassword     = 'Please enter a new password.'
    if (form.newPassword.length < 6)  errs.newPassword     = 'Password must be at least 6 characters.'
    if (!form.confirmPassword.trim()) errs.confirmPassword = 'Please confirm your new password.'
    else if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = 'Password and Confirm Password Should be Same.'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await accountApi.changePassword({
        oldPassword:     form.oldPassword,
        newPassword:     form.newPassword,
        confirmPassword: form.confirmPassword,
      })
      if (res.data.success) {
        setSuccess(res.data.message)
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to change password.')
    } finally { setSaving(false) }
  }

  const inp = hasErr => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${hasErr ? V.danger : V.border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: V.textPrimary,
  })

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header */}
          <div style={{ background: V.navy, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              <i className="fas fa-key" style={{ marginRight: 8 }}/>Change Password
            </h3>
          </div>

          <div style={{ padding: '24px' }}>
            {/* login id + name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.textSecond, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Login ID</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{user?.userLoginID || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.textSecond, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Name</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: V.textPrimary }}>{user?.userName || '—'}</div>
              </div>
            </div>

            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}><i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}><i className="fas fa-check-circle" style={{ marginRight: 6 }}/>{success}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {[
                { name: 'oldPassword',     label: 'Current Password',  ph: 'Enter current password' },
                { name: 'newPassword',     label: 'New Password',       ph: 'Enter new password' },
                { name: 'confirmPassword', label: 'Confirm New Password', ph: 'Re-enter new password' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                    {f.label} <span style={{ color: V.danger }}>*</span>
                  </label>
                  <input
                    type="password"
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.ph}
                    style={inp(!!errors[f.name])}
                  />
                  {errors[f.name] && <p style={{ fontSize: 12, color: V.danger, margin: '4px 0 0' }}>{errors[f.name]}</p>}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => navigate(-1)}
                  style={{ flex: 1, padding: '10px 0', background: '#fff', border: `1.5px solid ${V.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: V.textPrimary }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '10px 0', background: saving ? '#d1fae5' : V.primary, color: saving ? '#6b7280' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = V.primary }}>
                  {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
