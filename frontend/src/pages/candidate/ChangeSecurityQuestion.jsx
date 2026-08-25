import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountApi } from '../../services/api'

/**
 * Change Security Question — mirrors ChangeSecurityQuestion.aspx exactly.
 * Loads masters via Base_GetMasterTableList (Master_SecurityQuestion).
 * Loads current value via Account_GetSecurityQuestionDetails.
 * Saves via Account_ResetSecurityQuestion SP.
 */
export default function ChangeSecurityQuestion() {
  const navigate = useNavigate()

  const [questions,   setQuestions]   = useState([])
  const [form,        setForm]        = useState({ securityQuestionID: '', securityQuestionAnswer: '' })
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const V = {
    navy: '#14212e', primary: '#059669', primaryDark: '#047857',
    border: '#e2e8f0', textSecond: '#64748b', textPrimary: '#0f172a',
    danger: '#ef4444', bg: '#f5f6fa',
  }

  useEffect(() => {
    accountApi.getSecurityQuestion()
      .then(res => {
        setQuestions(res.data.securityQuestions ?? [])
        if (res.data.currentSecurityQuestionID)
          setForm({
            securityQuestionID:     res.data.currentSecurityQuestionID.toString(),
            securityQuestionAnswer: res.data.currentSecurityQuestionAnswer ?? '',
          })
      })
      .catch(() => setError('Failed to load security questions.'))
      .finally(() => setLoading(false))
  }, [])

  const inp = hasErr => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${hasErr ? V.danger : V.border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: V.textPrimary,
  })

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(er => ({ ...er, [name]: '' }))
    setError(''); setSuccess('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!form.securityQuestionID)           errs.securityQuestionID     = 'Please select a security question.'
    if (!form.securityQuestionAnswer.trim()) errs.securityQuestionAnswer = 'Please enter an answer.'
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }

    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await accountApi.changeSecurityQuestion({
        securityQuestionID:     parseInt(form.securityQuestionID),
        securityQuestionAnswer: form.securityQuestionAnswer.trim(),
      })
      if (res.data.success) {
        setSuccess(res.data.message)
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to change security question.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color: V.textSecond, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* header */}
          <div style={{ background: V.navy, padding: '16px 24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              <i className="fas fa-shield-alt" style={{ marginRight: 8 }}/>Change Security Question
            </h3>
          </div>

          <div style={{ padding: '24px' }}>
            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}><i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}><i className="fas fa-check-circle" style={{ marginRight: 6 }}/>{success}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* Security Question dropdown */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                  Security Question <span style={{ color: V.danger }}>*</span>
                </label>
                <select
                  name="securityQuestionID"
                  value={form.securityQuestionID}
                  onChange={handleChange}
                  style={{ ...inp(!!fieldErrors.securityQuestionID), cursor: 'pointer' }}
                >
                  <option value="">-- Select Security Question --</option>
                  {questions.map(q => (
                    <option key={q.value} value={q.value}>{q.text}</option>
                  ))}
                </select>
                {fieldErrors.securityQuestionID && <p style={{ fontSize: 12, color: V.danger, margin: '4px 0 0' }}>{fieldErrors.securityQuestionID}</p>}
              </div>

              {/* Security Question Answer */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 6 }}>
                  Security Question Answer <span style={{ color: V.danger }}>*</span>
                </label>
                <input
                  type="text"
                  name="securityQuestionAnswer"
                  value={form.securityQuestionAnswer}
                  onChange={handleChange}
                  placeholder="Enter your answer"
                  className="input-no-uppercase"
                  style={inp(!!fieldErrors.securityQuestionAnswer)}
                />
                {fieldErrors.securityQuestionAnswer && <p style={{ fontSize: 12, color: V.danger, margin: '4px 0 0' }}>{fieldErrors.securityQuestionAnswer}</p>}
                <p style={{ fontSize: 11, color: V.textSecond, margin: '4px 0 0' }}>
                  <i className="fas fa-info-circle"/> Answer is case-sensitive. Remember exactly what you type.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => navigate(-1)}
                  style={{ flex: 1, padding: '10px 0', background: '#fff', border: `1.5px solid ${V.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: V.textPrimary }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '10px 0', background: saving ? '#d1fae5' : V.primary, color: saving ? '#6b7280' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = V.primaryDark }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = V.primary }}>
                  {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</> : 'Change Security Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
