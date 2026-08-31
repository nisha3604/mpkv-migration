import { useState, useEffect, useRef } from 'react'
import { reportApi } from '../../services/api'

export default function CandidatesEligibleForCounselling() {
  const tableRef = useRef(null)   // on the actual <table> for export
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    reportApi.getEligibleForCounselling()
      .then(res => {
        if (res.data.success) setRows(res.data.rows ?? [])
        else setError(res.data.message || 'Failed to load report.')
      })
      .catch(err => setError(err.response?.data?.message ?? 'An error occurred.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    !search.trim() ||
    r.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    r.applicationID?.toLowerCase().includes(search.toLowerCase()) ||
    r.domicileDistrict?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Excel export — ref on actual <table>, strip tr background, fix th colors ──
  const handleExport = () => {
    if (!tableRef.current) return
    const printedOn = new Date().toLocaleString('en-IN')

    // Count columns from first header row
    const firstRow = tableRef.current.querySelector('tr')
    let colCount = 0
    if (firstRow) firstRow.querySelectorAll('th,td').forEach(c => { colCount += parseInt(c.getAttribute('colspan') || '1') })
    if (colCount === 0) colCount = 12

    let tableHtml = tableRef.current.outerHTML
    // Remove rgba() — Excel can't parse
    tableHtml = tableHtml.replace(/rgba\([^)]+\)/g, '#cccccc')
    // Remove background from <tr> — bleeds into empty cols
    tableHtml = tableHtml.replace(/<tr([^>]*?)style="([^"]*)"([^>]*?)>/g, (m, pre, style, post) => {
      const cleaned = style.replace(/background(-color)?:[^;]+;?/gi, '').trim()
      return cleaned ? `<tr${pre}style="${cleaned}"${post}>` : `<tr${pre}${post}>`
    })
    // Force correct colors on <th> inline
    tableHtml = tableHtml.replace(/<th([^>]*?)style="([^"]*)"([^>]*?)>/g, (m, pre, style, post) => {
      const cleaned = style.replace(/background(-color)?:[^;]+;?/gi, '').replace(/color:[^;]+;?/gi, '').trim()
      return `<th${pre}style="${cleaned};background:#14212e;color:#ffffff;"${post}>`
    })

    const html = `<html><head><meta charset='utf-8'/>
      <style>
        table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;}
        th,td{border:1px solid #ccc;padding:5px 7px;}
        th{background:#14212e !important;color:#ffffff !important;font-weight:bold;}
        .footer{background:#D5CEA3;font-weight:bold;}
      </style></head><body>
      <table>
        <tr><td colspan="${colCount}" style="background:#14212e;color:#ffffff;font-weight:bold;font-size:13pt;padding:8px;">List of Candidates Eligible for Counselling</td></tr>
        <tr><td colspan="${colCount}" style="font-style:italic;color:gray;font-size:8pt;padding:4px;">Printed On: ${printedOn} &nbsp;|&nbsp; Total Records: ${filtered.length}</td></tr>
        <tr><td colspan="${colCount}"></td></tr>
      </table>
      ${tableHtml}
      </body></html>`

    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'CandidatesEligibleForCounselling.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const now       = new Date()
  const printedOn = now.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
                  + '  ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  const C = {
    navy:'#14212e', navyLight:'#1e3a5f',
    slate:'#475569', slateLight:'#64748b',
    border:'#e2e8f0', bg:'#f8fafc',
    accent:'#059669', white:'#fff',
  }

  const thBase = {
    padding:'10px 10px', color:C.white, fontWeight:700, fontSize:11,
    textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap',
    background:C.navy, position:'sticky', top:0, zIndex:10,
  }
  const tdBase = {
    padding:'9px 10px', fontSize:12.5,
    borderBottom:`1px solid ${C.border}`,
    verticalAlign:'top',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', padding:'20px 20px 32px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1500, margin:'0 auto' }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:10, padding:'10px 16px', marginBottom:14, fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }}/>{error}
          </div>
        )}

        <div style={{ background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>

          {/* Title strip */}
          <div style={{ background:C.navy, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-users" style={{ color:C.white, fontSize:15 }} />
              </div>
              <div>
                <h2 style={{ color:C.white, fontWeight:800, fontSize:16, margin:0 }}>List of Candidates Eligible for Counselling</h2>
                <p style={{ color:'rgba(255,255,255,.55)', fontSize:11.5, margin:'2px 0 0' }}>
                  {rows.length > 0 ? `${rows.length} candidates found` : 'No data available'}
                </p>
              </div>
            </div>
            {rows.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ position:'relative' }}>
                  <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.45)', fontSize:11, pointerEvents:'none' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / ID / district..."
                    style={{ paddingLeft:30, paddingRight:12, paddingTop:8, paddingBottom:8, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, fontSize:12.5, color:C.white, fontFamily:'inherit', outline:'none', width:220 }} />
                </div>
                <button onClick={handleExport}
                  style={{ display:'flex', alignItems:'center', gap:7, background:'#217346', color:C.white, border:'none', borderRadius:8, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background='#1a5c38'}
                  onMouseLeave={e => e.currentTarget.style.background='#217346'}>
                  <i className="fas fa-file-excel" style={{ fontSize:13 }} /> Export to Excel
                </button>
              </div>
            )}
          </div>

          {/* Info strip */}
          {rows.length > 0 && (
            <div style={{ background:C.bg, padding:'9px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
              <span style={{ fontSize:12, color:C.slateLight }}>
                <i className="fas fa-info-circle" style={{ color:C.accent, marginRight:5 }}/>
                {search.trim() ? `${filtered.length} of ${rows.length} records shown` : `${rows.length} total records`}
              </span>
              <span style={{ fontSize:11.5, color:C.slateLight, fontStyle:'italic' }}>Printed On : {printedOn}</span>
            </div>
          )}

          {/* Table — horizontal scroll, sticky header */}
          {rows.length === 0 ? (
            <div style={{ padding:'52px 0', textAlign:'center' }}>
              <i className="fas fa-users" style={{ fontSize:32, color:'#e2e8f0', display:'block', marginBottom:10 }}/>
              <p style={{ color:C.slateLight, fontSize:14, margin:0 }}>No candidates eligible for counselling.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <div style={{ overflowY:'auto', maxHeight:'65vh' }}>
                {/* tableRef on the actual table — export reads this */}
                <table ref={tableRef} style={{ width:'100%', minWidth:1200, borderCollapse:'collapse', fontSize:12.5 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thBase, width:45,  textAlign:'center' }}>Sr.</th>
                      <th style={{ ...thBase, width:130, textAlign:'left'   }}>Applied Course</th>
                      <th style={{ ...thBase, width:65,  textAlign:'center' }}>Points</th>
                      <th style={{ ...thBase, width:110, textAlign:'center' }}>Application ID</th>
                      <th style={{ ...thBase, width:180, textAlign:'left'   }}>Candidate Name</th>
                      <th style={{ ...thBase, width:60,  textAlign:'center' }}>Gender</th>
                      <th style={{ ...thBase, width:90,  textAlign:'center' }}>DOB</th>
                      <th style={{ ...thBase, width:80,  textAlign:'center' }}>Category</th>
                      <th style={{ ...thBase, width:110, textAlign:'center' }}>Domicile District</th>
                      <th style={{ ...thBase, width:110, textAlign:'center' }}>Mobile No.</th>
                      <th style={{ ...thBase, width:170, textAlign:'left'   }}>E-Mail ID</th>
                      <th style={{ ...thBase, width:200, textAlign:'left', borderRight:'none' }}>Documents Discrepancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={12} style={{ padding:28, textAlign:'center', color:'#94a3b8' }}>No results match your search.</td></tr>
                    ) : filtered.map((row, i) => (
                      <tr key={i}
                        style={{ background: i%2===0 ? C.white : C.bg }}
                        onMouseEnter={e => e.currentTarget.style.background='#f0fdf9'}
                        onMouseLeave={e => e.currentTarget.style.background=i%2===0?C.white:C.bg}>
                        <td style={{ ...tdBase, textAlign:'center', color:C.slateLight, fontWeight:600 }}>{i+1}.</td>
                        <td style={{ ...tdBase, textAlign:'left',   fontWeight:600, color:'#0f172a' }}>{row.appliedCourse}</td>
                        <td style={{ ...tdBase, textAlign:'center' }}>
                          <span style={{ background:C.accent+'15', color:C.accent, border:`1px solid ${C.accent}30`, borderRadius:6, padding:'2px 7px', fontWeight:800, fontSize:12 }}>{row.totalWeightage}</span>
                        </td>
                        <td style={{ ...tdBase, textAlign:'center', fontWeight:600, color:'#1d4ed8', fontFamily:'monospace' }}>{row.applicationID}</td>
                        <td style={{ ...tdBase, textAlign:'left',   fontWeight:700, color:'#0f172a' }}>{row.candidateName}</td>
                        <td style={{ ...tdBase, textAlign:'center', color:C.slate }}>{row.gender}</td>
                        <td style={{ ...tdBase, textAlign:'center', color:C.slate, whiteSpace:'nowrap' }}>{row.dOB || row.dob || row.DOB || '—'}</td>
                        <td style={{ ...tdBase, textAlign:'center' }}>
                          <span style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'2px 6px', fontSize:11.5, fontWeight:600, color:C.slate }}>{row.finalCategory}</span>
                        </td>
                        <td style={{ ...tdBase, textAlign:'center', color:C.slate }}>{row.domicileDistrict}</td>
                        <td style={{ ...tdBase, textAlign:'center', fontFamily:'monospace', fontSize:12, color:C.slate, whiteSpace:'nowrap' }}>{row.mobileNo}</td>
                        <td style={{ ...tdBase, textAlign:'left',   fontSize:12, color:C.slateLight, wordBreak:'break-all' }}>{row.eMailID}</td>
                        <td style={{ ...tdBase, textAlign:'left',   fontSize:12, color:C.slate }}
                          dangerouslySetInnerHTML={{ __html: row.documentsDiscrepancy || '—' }} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
