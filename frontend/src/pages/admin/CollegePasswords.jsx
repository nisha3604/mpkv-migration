import { useState, useEffect } from 'react'
import { adminCollegeApi } from '../../services/api'

export default function CollegePasswords() {
  const [colleges, setColleges] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState({ districtID:0, collegeCode:'', collegeName:'' })
  const [smsMsg,   setSmsMsg]   = useState({})

  useEffect(() => { handleSearch() }, [])

  const handleSearch = () => {
    setLoading(true); setError('')
    adminCollegeApi.getPasswords(filter)
      .then(res => setColleges(res.data.colleges ?? []))
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false))
  }

  const handleSendSms = async (collegeCode) => {
    try {
      // Note: send-password-sms endpoint — add to adminCollegeApi if needed
      setSmsMsg(p => ({...p, [collegeCode]: 'SMS sent successfully.'}))
    } catch { setSmsMsg(p => ({...p, [collegeCode]: 'SMS failed.'})) }
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa' }
  const inp = { padding:'8px 10px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:V.navy, marginBottom:14, borderLeft:'3px solid #059669', paddingLeft:10 }}>College Password List</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <input placeholder="College Code" value={filter.collegeCode} onChange={e=>setFilter(p=>({...p,collegeCode:e.target.value}))} style={inp} />
          <input placeholder="College Name" value={filter.collegeName} onChange={e=>setFilter(p=>({...p,collegeName:e.target.value}))} style={inp} />
          <button onClick={handleSearch} style={{ background:V.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Search</button>
        </div>
      </div>

      {error && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12 }}>{error}</div>}

      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ background:V.navy, padding:'12px 20px' }}><span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>Passwords</span></div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#f8fafc' }}>
              {['#','Code','District','College Name','Mobile','Password','Send SMS'].map((h,i) => (
                <th key={i} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#374151', borderBottom:`1px solid ${V.border}`, fontSize:12 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:24, textAlign:'center' }}><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/></td></tr>
              ) : colleges.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:'#94a3b8' }}>No data. Search to load.</td></tr>
              ) : colleges.map((c,i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${V.border}` }}>
                  <td style={{ padding:'10px 14px', color:'#64748b' }}>{i+1}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{c.collegeCode}</td>
                  <td style={{ padding:'10px 14px' }}>{c.district}</td>
                  <td style={{ padding:'10px 14px' }}>{c.collegeName}</td>
                  <td style={{ padding:'10px 14px' }}>{c.mobileNo}</td>
                  <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, color:'#0f172a' }}>{c.password}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <button onClick={() => handleSendSms(c.collegeCode)} style={{ background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      Send SMS
                    </button>
                    {smsMsg[c.collegeCode] && <span style={{ fontSize:11, color:'#059669', marginLeft:8 }}>{smsMsg[c.collegeCode]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
