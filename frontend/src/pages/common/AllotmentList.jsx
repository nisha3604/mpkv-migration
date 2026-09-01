import { useState, useEffect, useRef } from 'react'
import { homeApi } from '../../services/api'

/**
 * Allotment List — mirrors AllotmentList.aspx exactly.
 *
 * Layout:
 *   1. Navy gradient header "Allotment List"
 *   2. Filter card — Round* | Course* (→ cascades College dropdown) | College*
 *   3. "Get Allotment List" button
 *   4. Results — 3 wheat header rows (Report title, College name, Course name)
 *      + Table: Sr | Merit No | Points | Application ID | Candidate Name | Allotted Type
 *   5. Export to Excel button (top-right of results)
 *
 * SPs:
 *   Admission_GetPhaseList → Round dropdown
 *   Base_GetMasterCourse   → Course dropdown
 *   College_GetCollegeList(@CourseID) → College cascade
 *   Report_GetAllotmentReport(@CollegeID, @PhaseID, @Flag='Allotment') → list
 */
export default function AllotmentList() {
  const tableRef = useRef(null)

  const [phases,   setPhases]   = useState([])
  const [courses,  setCourses]  = useState([])
  const [colleges, setColleges] = useState([])

  const [phaseId,    setPhaseId]    = useState('-1')
  const [courseId,   setCourseId]   = useState('-1')
  const [collegeCode,setCollegeCode]= useState('-1')
  const [collegeName,setCollegeName]= useState('')
  const [courseName, setCourseName] = useState('')
  const [phaseName,  setPhaseName]  = useState('')

  const [results,    setResults]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [loadingColl,setLoadingColl]= useState(false)
  const [searching,  setSearching]  = useState(false)
  const [error,      setError]      = useState('')

  const V = {
    navy:'#14212e', primary:'#059669', primaryDark:'#047857',
    teal:'#0d9488', tealLight:'#f0fdf9', border:'#e2e8f0', borderLight:'#f1f5f9',
    textPrimary:'#0f172a', textSecond:'#64748b', bg:'#f5f6fa', wheat:'#D5CEA3',
  }

  // Load phases + courses on mount
  useEffect(() => {
    homeApi.getAllotmentListMasters()
      .then(res => {
        setPhases(res.data.phases ?? [])
        setCourses(res.data.courses ?? [])
      })
      .catch(() => setError('Failed to load filter options.'))
      .finally(() => setLoading(false))
  }, [])

  // Cascade: when course changes, load colleges
  const handleCourseChange = async (val) => {
    setCourseId(val)
    setCollegeCode('-1')
    setCollegeName('')
    setCourseName(courses.find(c => c.value === val)?.text ?? '')
    setColleges([])
    setResults(null)
    if (val === '-1') return
    setLoadingColl(true)
    try {
      const res = await homeApi.getCollegesByCourse(parseInt(val))
      setColleges(res.data.colleges ?? [])
    } catch { setError('Failed to load colleges.') }
    finally { setLoadingColl(false) }
  }

  const handleGetList = async () => {
    if (phaseId === '-1') { setError('Please Select Round.'); return }
    if (courseId === '-1') { setError('Please Select Course.'); return }
    if (collegeCode === '-1') { setError('Please Select College.'); return }
    setSearching(true); setError(''); setResults(null)
    try {
      const res = await homeApi.getAllotmentList({
        collegeID:   parseInt(collegeCode),
        phaseID:     parseInt(phaseId),
        collegeName, courseName, phaseName,
      })
      if (res.data.success) setResults(res.data)
      else setError(res.data.message || 'No records found.')
    } catch (err) { setError(err.response?.data?.message ?? 'An error occurred.') }
    finally { setSearching(false) }
  }

  // Export to Excel — same as old btnExportToExcel_Click
  const handleExport = () => {
    if (!tableRef.current) return
    let tableHtml = tableRef.current.outerHTML
    tableHtml = tableHtml.replace(/rgba\([^)]+\)/g, '#cccccc')
    tableHtml = tableHtml.replace(/<tr([^>]*?)style="([^"]*)"([^>]*?)>/g, (m, pre, style, post) => {
      const c = style.replace(/background(-color)?:[^;]+;?/gi, '').trim()
      return c ? `<tr${pre}style="${c}"${post}>` : `<tr${pre}${post}>`
    })
    tableHtml = tableHtml.replace(/<th([^>]*?)style="([^"]*)"([^>]*?)>/g, (m, pre, style, post) => {
      const c = style.replace(/background(-color)?:[^;]+;?/gi, '').replace(/color:[^;]+;?/gi, '').trim()
      return `<th${pre}style="${c};background:#14212e;color:#ffffff;"${post}>`
    })
    const html = `<html><head><meta charset='utf-8'/><style>table{border-collapse:collapse;font-family:Arial;font-size:10pt;}th,td{border:1px solid #ccc;padding:5px 8px;}th{background:#14212e;color:#fff;font-weight:bold;}.wheat{background:#D5CEA3;font-weight:bold;text-align:center;}</style></head><body>${tableHtml}</body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'AllotmentReport.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const selCls = { width:'100%', padding:'10px 14px', border:`1.5px solid ${V.border}`, borderRadius:8, fontSize:13.5, color:V.textPrimary, background:'#fff', boxSizing:'border-box', fontFamily:'inherit', outline:'none', cursor:'pointer' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
    </div>
  )

  const phaseLabel = phases.find(p => p.value === phaseId)?.text ?? ''

  return (
    <div style={{ background:V.bg, minHeight:'100vh', padding:'24px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Navy gradient header ─────────────────────────────────────── */}
        <div style={{ background:'linear-gradient(135deg, #14212e, #0d3d2e)', borderRadius:12, padding:'16px 24px', display:'flex', alignItems:'center', gap:12 }}>
          <i className="fas fa-list-ol" style={{ color:V.primary, fontSize:16 }}/>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#fff' }}>Allotment List</h2>
        </div>

        {/* ── Filter card ──────────────────────────────────────────────── */}
        <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1.6fr', gap:18 }} className="al-filter-grid">

              {/* Round */}
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textPrimary, marginBottom:7 }}>
                  Select Round <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <select value={phaseId} onChange={e => { setPhaseId(e.target.value); setPhaseName(phases.find(p=>p.value===e.target.value)?.text??''); setResults(null) }} style={selCls}>
                  <option value="-1">Select</option>
                  {phases.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}
                </select>
              </div>

              {/* Course */}
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textPrimary, marginBottom:7 }}>
                  Select Course <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <select value={courseId} onChange={e => handleCourseChange(e.target.value)} style={selCls}>
                  <option value="-1">Select</option>
                  {courses.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                </select>
              </div>

              {/* College — cascades from Course */}
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:V.textPrimary, marginBottom:7 }}>
                  Select College <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <select value={collegeCode}
                  onChange={e => { setCollegeCode(e.target.value); setCollegeName(colleges.find(c=>c.collegeCode===e.target.value)?.collegeNameWithCode??''); setResults(null) }}
                  disabled={loadingColl || colleges.length === 0}
                  style={{ ...selCls, background: (loadingColl||colleges.length===0)?'#f8fafc':'#fff', cursor:(loadingColl||colleges.length===0)?'not-allowed':'pointer' }}>
                  <option value="-1">{loadingColl ? 'Loading...' : colleges.length===0&&courseId!=='-1' ? 'No colleges' : 'Select'}</option>
                  {colleges.map(c => <option key={c.collegeCode} value={c.collegeCode}>{c.collegeNameWithCode}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* Button row */}
          <div style={{ display:'flex', justifyContent:'center', padding:'20px 24px', borderTop:`1px solid ${V.borderLight}`, background:'#f8fafc' }}>
            <button type="button" onClick={handleGetList} disabled={searching}
              style={{ background:searching?'#6b7280':V.primary, color:'#fff', border:'none', padding:'12px 36px', borderRadius:8, fontSize:14, fontWeight:700, cursor:searching?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(5,150,105,.28)', fontFamily:'inherit' }}
              onMouseEnter={e=>{ if(!searching) e.currentTarget.style.background=V.primaryDark }}
              onMouseLeave={e=>{ if(!searching) e.currentTarget.style.background=V.primary }}>
              {searching
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Loading...</>
                : <><i className="fas fa-play"/>Get Allotment List</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 16px', fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {results && (
          <div style={{ background:'#fff', border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* Results header with Export button */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 22px', background:V.tealLight, borderBottom:`1px solid ${V.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:V.primary, borderRadius:2, flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:700, color:V.teal, textTransform:'uppercase', letterSpacing:'.05em' }}>
                  Allotment List
                </span>
                <span style={{ fontSize:12, color:V.textSecond, marginLeft:6 }}>({results.totalCount} candidates)</span>
              </div>
              <button onClick={handleExport}
                style={{ background:'#dc2626', color:'#fff', border:'none', padding:'7px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}
                onMouseEnter={e=>e.currentTarget.style.background='#b91c1c'}
                onMouseLeave={e=>e.currentTarget.style.background='#dc2626'}>
                <i className="fas fa-file-excel"/> Export to Excel
              </button>
            </div>

            {results.rows.length === 0 ? (
              <div style={{ padding:'32px 0', textAlign:'center', color:V.textSecond, fontSize:14 }}>
                <i className="fas fa-list-ol" style={{ fontSize:28, color:'#e2e8f0', display:'block', marginBottom:8 }}/>
                No allotment records found.
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table ref={tableRef} style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    {/* 3 wheat header rows — matches old gvAllotmentReport_RowCreated */}
                    {[
                      `Allotment Report${phaseLabel ? ' (' + phaseLabel + ')' : ''}`,
                      collegeName,
                      courseName,
                    ].map((text, i) => (
                      <tr key={i}>
                        <td colSpan={6} style={{ padding:'8px 14px', background:V.wheat, fontWeight:'bold', fontSize:14, textAlign:'center', borderBottom:'1px solid #c9b77a', color:'#3d3000' }}>
                          {text}
                        </td>
                      </tr>
                    ))}
                    {/* Column headers */}
                    <tr style={{ background:V.navy }}>
                      {['Sr.','Merit No.','Points','Application ID','Candidate Name','Allotted Type'].map((h, i) => (
                        <th key={h} style={{ padding:'11px 14px', fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap', textAlign: i===0||i===1||i===2||i===5 ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${V.borderLight}`, background: i%2===1?'#fafbfc':'#fff', transition:'background .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f0fdf9'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===1?'#fafbfc':'#fff'}>
                        <td style={{ padding:'11px 14px', fontSize:13, textAlign:'center', color:V.textSecond, fontWeight:600 }}>{i+1}.</td>
                        <td style={{ padding:'11px 14px', fontSize:13, textAlign:'center', fontWeight:700 }}>{row.meritNo}</td>
                        <td style={{ padding:'11px 14px', fontSize:13, textAlign:'center' }}>
                          <span style={{ background:'#f0fdf4', color:V.primary, border:`1px solid #bbf7d0`, borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:800 }}>
                            {row.totalWeightage}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:13, textAlign:'left', fontWeight:600, color:'#1d4ed8', fontFamily:'monospace' }}>{row.applicationID}</td>
                        <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600, color:V.textPrimary }}>{row.candidateName}</td>
                        <td style={{ padding:'11px 14px', fontSize:12, textAlign:'center' }}>
                          <span style={{ background:'#eff6ff', color:'#1e40af', border:'1px solid #bfdbfe', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>
                            {row.allottedTypeDisplay}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`@media(max-width:700px){ .al-filter-grid{ grid-template-columns:1fr!important } }`}</style>
    </div>
  )
}
