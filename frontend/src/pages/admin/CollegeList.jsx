import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminCollegeApi, collegeApi } from '../../services/api'

export default function AdminCollegeList() {
  const navigate = useNavigate()
  const [colleges, setColleges] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState({ courseID: 0, districtID: 0, collegeCode: '', collegeName: '' })
  const [masters,  setMasters]  = useState({ districts: [], courses: [] })

  useEffect(() => {
    // Load masters for filter dropdowns
    collegeApi.getDetails(0).then(res => {
      setMasters({ districts: res.data.districts ?? [], courses: res.data.courses ?? [] })
    }).catch(() => {})
    handleSearch()
  }, [])

  const handleSearch = () => {
    setLoading(true); setError('')
    adminCollegeApi.getList(filter)
      .then(res => setColleges(res.data.colleges ?? []))
      .catch(() => setError('Failed to load college list.'))
      .finally(() => setLoading(false))
  }

  const V = { navy:'#14212e', primary:'#059669', border:'#e2e8f0', bg:'#f5f6fa' }
  const inp = { padding:'8px 10px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', width:'100%' }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:24 }}>
      {/* Search */}
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, padding:20, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:V.navy, marginBottom:14, borderLeft:'3px solid #059669', paddingLeft:10 }}>Search Colleges</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <div>
            <select value={filter.courseID} onChange={e => setFilter(p=>({...p,courseID:e.target.value}))} style={inp}>
              <option value={0}>All Courses</option>
              {masters.courses.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
            </select>
          </div>
          <div>
            <select value={filter.districtID} onChange={e => setFilter(p=>({...p,districtID:e.target.value}))} style={inp}>
              <option value={0}>All Districts</option>
              {masters.districts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
            </select>
          </div>
          <input placeholder="College Code" value={filter.collegeCode} onChange={e=>setFilter(p=>({...p,collegeCode:e.target.value}))} style={inp} />
          <input placeholder="College Name" value={filter.collegeName} onChange={e=>setFilter(p=>({...p,collegeName:e.target.value}))} style={inp} />
        </div>
        <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={handleSearch} style={{ background:V.primary, color:'#fff', border:'none', borderRadius:8, padding:'9px 24px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Search
          </button>
        </div>
      </div>

      {error && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12 }}>{error}</div>}

      {/* Results */}
      <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ background:V.navy, padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>College List ({colleges.length})</span>
        </div>
        {loading ? (
          <div style={{ padding:32, textAlign:'center' }}><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Code','District','College Name','Course','Status','Current Status','Action'].map((h,i) => (
                    <th key={i} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#374151', borderBottom:`1px solid ${V.border}`, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colleges.length === 0
                  ? <tr><td colSpan={8} style={{ padding:24, textAlign:'center', color:'#94a3b8' }}>No colleges found. Use search above.</td></tr>
                  : colleges.map((c,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${V.border}` }}>
                      <td style={{ padding:'10px 14px', color:'#64748b' }}>{i+1}</td>
                      <td style={{ padding:'10px 14px', fontWeight:600 }}>{c.collegeCode}</td>
                      <td style={{ padding:'10px 14px' }}>{c.district}</td>
                      <td style={{ padding:'10px 14px' }}>{c.collegeName}</td>
                      <td style={{ padding:'10px 14px' }}>{c.course}</td>
                      <td style={{ padding:'10px 14px' }}>{c.courseStatus}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ background:c.isActive?'#dcfce7':'#fee2e2', color:c.isActive?'#166534':'#991b1b', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <button onClick={() => navigate(`/admin/college/summary?collegeId=${c.collegeID}`)}
                          style={{ background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
