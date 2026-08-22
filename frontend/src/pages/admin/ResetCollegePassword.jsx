import { useState } from 'react'
import { adminCollegeApi } from '../../services/api'

export default function ResetCollegePassword() {
  const [form, setForm]               = useState({ collegeCode:'', newPassword:'', confirmPassword:'' })
  const [currentPwd, setCurrentPwd]   = useState('')
  const [loading,  setLoading]        = useState(false)
  const [saving,   setSaving]         = useState(false)
  const [error,    setError]          = useState('')
  const [success,  setSuccess]        = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleFetch = async () => {
    if (!form.collegeCode.trim()) { setError('Enter college code first.'); return }
    setLoading(true); setError('')
    try {
      const res = await adminCollegeApi.getCurrentPassword(form.collegeCode.trim())
      setCurrentPwd(res.data.currentPassword ?? '')
    } catch { setError('College not found.') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!form.newPassword || !form.confirmPassword) { setError('Both password fields are required.'); return }
    if (form.newPassword !== form.confirmPassword)  { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      const res = await adminCollegeApi.resetPassword(form)
      if (res.data.success) {
        setSuccess(res.data.message)
        setCurrentPwd(res.data.updatedPassword || form.newPassword)
        setForm(p => ({ ...p, newPassword:'', confirmPassword:'' }))
      } else setError(res.data.message)
    } catch (err) { setError(err.response?.data?.message ?? 'Reset failed.') }
    finally { setSaving(false) }
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa' }
  const inp = { width:'100%', padding:'9px 12px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24, display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', width:'100%', maxWidth:520, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginTop:24 }}>
        <div style={{ background:V.navy, padding:'16px 24px' }}>
          <h3 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>Reset College Password</h3>
        </div>
        <div style={{ padding:24 }}>
          {(error||success) && <div style={{ background:error?'#fef2f2':'#f0fdf9', border:`1px solid ${error?'#fecaca':'#bbf7d0'}`, color:error?'#dc2626':'#065f46', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13 }}>{error||success}</div>}

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>College Code *</label>
            <div style={{ display:'flex', gap:8 }}>
              <input name="collegeCode" value={form.collegeCode} onChange={handleChange} style={{ ...inp, flex:1 }} placeholder="e.g. ABC" />
              <button onClick={handleFetch} disabled={loading}
                style={{ background:V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                {loading ? '...' : 'Get Password'}
              </button>
            </div>
          </div>

          {currentPwd && (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13 }}>
              <strong>Current Password:</strong> <span style={{ fontFamily:'monospace', fontWeight:700, color:'#92400e' }}>{currentPwd}</span>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>New Password *</label>
            <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} style={inp} placeholder="8-15 chars, 1 upper, 1 lower, 1 digit, 1 special" />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Confirm Password *</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} style={inp} />
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width:'100%', background:saving?'#d1fae5':V.primary, color:'#fff', border:'none', borderRadius:8, padding:'11px 0', fontSize:14, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
