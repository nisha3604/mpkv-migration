import { useState } from 'react'
import { candidateUtilsApi } from '../../services/api'

/**
 * AdminChangeSecurityQuestion
 *
 * Mirrors Admin/CheckApplicationID.aspx?Flag=ChangeSecurityQuestion
 *       + Candidate/ChangeSecurityQuestion.aspx (exact same UI)
 *
 * Step 1 — Enter Application ID → Search (resolves candidate + loads their current question)
 * Step 2 — Single card: Security Question dropdown + Answer input + ▶ Change button
 *
 * SPs: Base_GetCandidateID, Base_GetMasterTableList(Master_SecurityQuestion),
 *      Account_GetSecurityQuestionDetails, Account_ResetSecurityQuestion
 */
export default function AdminChangeSecurityQuestion() {

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const [appId,     setAppId]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [data,      setData]      = useState(null) // AdminSecurityQuestionResponse

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const [selQuestion, setSelQuestion] = useState('-1')
  const [answer,      setAnswer]      = useState('')
  const [questionErr, setQuestionErr] = useState('')
  const [answerErr,   setAnswerErr]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState(null) // { text, ok }

  const navy    = '#14212e'
  const primary = '#059669'
  const border  = '#e2e8f0'
  const bg      = '#f5f6fa'

  // ── Step 1: resolve Application ID + load security question details ───────
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!appId.trim()) { setSearchErr('Please Enter Application ID.'); return }
    setSearching(true); setSearchErr(''); setData(null); setMsg(null)
    setSelQuestion('-1'); setAnswer('')
    try {
      const res = await candidateUtilsApi.getSecurityQuestion(appId.trim())
      if (res.data?.success) {
        setData({ ...res.data, applicationId: appId.trim().toUpperCase() })
        setSelQuestion(res.data.currentSecurityQuestionID > 0
          ? String(res.data.currentSecurityQuestionID)
          : '-1')
        setAnswer(res.data.currentSecurityQuestionAnswer || '')
      } else {
        setSearchErr(res.data?.message || 'Invalid Application ID.')
      }
    } catch {
      setSearchErr('Server error. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  // ── Step 2: save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setQuestionErr(''); setAnswerErr(''); setMsg(null)
    if (selQuestion === '-1') { setQuestionErr('Please Select Security Question.'); return }
    if (!answer.trim())       { setAnswerErr("Please Enter Security Question's Answer."); return }
    setSaving(true)
    try {
      const res = await candidateUtilsApi.changeSecurityQuestion({
        applicationId:      data.applicationId,
        securityQuestionId: parseInt(selQuestion),
        answer:             answer.trim(),
      })
      setMsg({ text: res.data.message, ok: res.data.success })
    } catch {
      setMsg({ text: 'Server error. Please try again.', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const inp = (err) => ({
    width: '100%', padding: '11px 14px 11px 34px', boxSizing: 'border-box',
    border: `1.5px solid ${err ? '#dc2626' : border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    color: '#0f172a', background: '#fff', outline: 'none',
  })

  const selStyle = (err) => ({
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    border: `1.5px solid ${err ? '#dc2626' : border}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit',
    color: selQuestion === '-1' ? '#94a3b8' : '#0f172a',
    background: '#fff', outline: 'none', cursor: 'pointer',
  })

  const Alert = ({ msg, onClose }) => !msg ? null : (
    <div style={{
      marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: msg.ok ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${msg.ok ? '#86efac' : '#fecaca'}`,
      color:  msg.ok ? '#166534' : '#dc2626',
    }}>
      <i className={`fas ${msg.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginTop: 1, flexShrink: 0 }}/>
      <span style={{ flex: 1 }}>{msg.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 15, padding: 0 }}>×</button>
    </div>
  )

  return (
    <div style={{ padding: 24, background: bg, minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ── STEP 1: Enter Application ID ─────────────────────────────────── */}
      {!data && (
        <div style={{ maxWidth: 560, margin: '0 auto', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', background: '#fff' }}>
          <div style={{ background: navy, padding: '12px 20px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Change Security Question</span>
          </div>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            {searchErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '9px 14px', marginBottom: 16, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-exclamation-circle"/>{searchErr}
              </div>
            )}
            <form onSubmit={handleSearch}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>Application ID :</label>
                <input
                  value={appId}
                  onChange={e => { setAppId(e.target.value.toUpperCase()); setSearchErr('') }}
                  placeholder="Enter Application ID"
                  maxLength={15}
                  style={{ padding: '7px 12px', border: `1px solid ${border}`, borderRadius: 6, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: 200 }}
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = border}
                />
              </div>
            </form>
          </div>
          <div style={{ background: '#f8fafc', borderTop: `1px solid ${border}`, padding: '14px 20px', textAlign: 'center' }}>
            <button onClick={handleSearch} disabled={searching}
              style={{ background: searching ? '#d1fae5' : primary, color: '#fff', border: 'none', padding: '8px 28px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minWidth: 100 }}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Change Security Question ─────────────────────────────── */}
      {data && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Page title — mirrors csq-title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, background: '#f0fdfb', border: '1.5px solid #ccfbf1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fas fa-shield-alt" style={{ color: primary, fontSize: 18 }}/>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Change Security Question</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Application ID: <strong>{data.applicationId}</strong>
                &nbsp;·&nbsp;
                <button onClick={() => setData(null)} style={{ background: 'none', border: 'none', color: primary, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                  Search again
                </button>
              </p>
            </div>
          </div>

          {/* Form card — mirrors csq-card */}
          <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
            <form onSubmit={handleSave}>
              <div style={{ padding: '24px 28px 8px' }}>

                {/* Security Question dropdown */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                    Security Question <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
                  </label>
                  <select
                    value={selQuestion}
                    onChange={e => { setSelQuestion(e.target.value); setQuestionErr('') }}
                    style={selStyle(!!questionErr)}>
                    <option value="-1">-- Select Security Question --</option>
                    {(data.securityQuestions || []).map(q => (
                      <option key={q.value} value={q.value}>{q.text}</option>
                    ))}
                  </select>
                  {questionErr && <p style={{ fontSize: 12, color: '#dc2626', margin: '5px 0 0' }}>{questionErr}</p>}
                </div>

                {/* Answer input */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                    Security Question's Answer <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-comment-dots" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}/>
                    <input
                      type="text"
                      value={answer}
                      onChange={e => { setAnswer(e.target.value); setAnswerErr('') }}
                      placeholder="Enter your answer"
                      maxLength={50}
                      style={inp(!!answerErr)}
                    />
                  </div>
                  {answerErr && <p style={{ fontSize: 12, color: '#dc2626', margin: '5px 0 0' }}>{answerErr}</p>}
                </div>

                <Alert msg={msg} onClose={() => setMsg(null)}/>
              </div>

              {/* Footer — mirrors csq-footer */}
              <div style={{ padding: '16px 28px 28px', display: 'flex', justifyContent: 'center' }}>
                <button type="submit" disabled={saving}
                  style={{ background: saving ? '#d1fae5' : primary, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,.25)', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#047857' }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = primary }}>
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>
                    : <><i className="fas fa-chevron-right" style={{ fontSize: 12 }}/>Change Security Question</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
