import { useState, useEffect, useRef } from 'react'
import { reportApi } from '../../services/api'

/**
 * Candidates Eligible for Counselling
 * Professional redesign — navy/slate/white palette, Excel export
 * Backend unchanged: SP Report_GetCandidatesEligibleForCounselling(@CourseID)
 * All functionality preserved — same API call, same data mapping
 */
export default function CandidatesEligibleForCounselling() {
  const tableRef = useRef(null)
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    reportApi.getEligibleForCounselling()
      .then(res => {
        if (res.data.success) setRows(res.data.rows ?? [])
        else setError(res.data.message || 'Failed to load report.')
      })
      .catch(err => setError(err.response?.data?.message ?? 'An error occurred.'))
      .finally(() => setLoading(false))
  }, [])

  // Client-side search filter
  const filtered = rows.filter(r =>
    !search.trim() ||
    r.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    r.applicationID?.toLowerCase().includes(search.toLowerCase()) ||
    r.domicileDistrict?.toLowerCase().includes(search.toLowerCase())
  )

  // Excel export with proper formatting
  const handleExport = () => {
    if (!tableRef.current) return
    const printedOn = new Date().toLocaleString('en-IN')
    const html = `
      <html><head><meta charset='utf-8'/>
      <style>
        table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;}
        th,td{border:1px solid #dee2e6;padding:5px 7px;}
        .hdr{background:#14212e;color:white;font-weight:bold;}
        .sub{background:#D5CEA3;font-weight:bold;text-align:center;}
        .pr{background:#f8f9fa;font-style:italic;color:gray;font-size:8pt;}
      </style></head><body>
      <table>
        <tr><td colspan="12" class="hdr" style="font-size:13pt;">List of Candidates Eligible for Counselling</td></tr>
        <tr><td colspan="12" class="pr">Printed On: ${printedOn}</td></tr>
        <tr><td colspan="12"></td></tr>
        ${tableRef.current.innerHTML}
      </table></body></html>`
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
    padding:'10px 12px', color:C.white, fontWeight:700, fontSize:11,
    textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap',
    borderRight:`1px solid rgba(255,255,255,.1)`, background:C.navy,
  }

  const tdBase = {
    padding:'10px 12px', fontSize:12.5,
    borderBottom:`1px solid ${C.border}`,
    borderRight:`1px solid ${C.border}`,
    verticalAlign:'top',
  }

  const columns = [
    { key:'sr',                  label:'Sr.',                  width:'4%',  align:'center' },
    { key:'appliedCourse',       label:'Applied Course',       width:'12%', align:'center' },
    { key:'totalWeightage',      label:'Points',               width:'5%',  align:'center' },
    { key:'applicationID',       label:'Application ID',       width:'10%', align:'center' },
    { key:'candidateName',       label:'Candidate Name',       width:'18%', align:'left'   },
    { key:'gender',              label:'Gender',               width:'6%',  align:'center' },
    { key:'dOB',                 label:'DOB',                  width:'8%',  align:'center' },
    { key:'finalCategory',       label:'Category',             width:'6%',  align:'center' },
    { key:'domicileDistrict',    label:'Domicile District',    width:'10%', align:'center' },
    { key:'mobileNo',            label:'Mobile No.',           width:'9%',  align:'center' },
    { key:'eMailID',             label:'E-Mail ID',            width:'12%', align:'left'   },
    { key:'documentsDiscrepancy',label:'Documents Discrepancy',width:null,  align:'left'   },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading candidates...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#f1f5f9', minHeight:'100vh', padding:'20px 20px 32px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:10, padding:'10px 16px', marginBottom:14, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── Main card ─────────────────────────────────────────────────── */}
        <div style={{ background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.06)' }}>

          {/* Title strip */}
          <div style={{ background:C.navy, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-users" style={{ color:C.white, fontSize:15 }} />
              </div>
              <div>
                <h2 style={{ color:C.white, fontWeight:800, fontSize:16, margin:0, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
                  List of Candidates Eligible for Counselling
                </h2>
                <p style={{ color:'rgba(255,255,255,.55)', fontSize:11.5, margin:'2px 0 0' }}>
                  {rows.length > 0 ? `${rows.length} candidate${rows.length !== 1 ? 's' : ''} found` : 'No data available'}
                </p>
              </div>
            </div>

            {/* Actions */}
            {rows.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {/* Search */}
                <div style={{ position:'relative' }}>
                  <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.45)', fontSize:11, pointerEvents:'none' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name / ID / district..."
                    style={{ paddingLeft:30, paddingRight:12, paddingTop:8, paddingBottom:8, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, fontSize:12.5, color:C.white, fontFamily:'inherit', outline:'none', width:220, fontWeight:500 }}
                  />
                </div>

                {/* Export Excel */}
                <button onClick={handleExport}
                  style={{ display:'flex', alignItems:'center', gap:7, background:'#217346', color:C.white, border:'none', borderRadius:8, padding:'8px 16px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(33,115,70,.4)', transition:'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#1a5c38'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#217346'; e.currentTarget.style.transform='translateY(0)' }}>
                  <i className="fas fa-file-excel" style={{ fontSize:13 }} /> Export to Excel
                </button>
              </div>
            )}
          </div>

          {/* Info strip */}
          {rows.length > 0 && (
            <div style={{ background:C.bg, padding:'9px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
              <span style={{ fontSize:12, color:C.slateLight, display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-info-circle" style={{ color:C.accent, fontSize:11 }} />
                {search.trim() ? `${filtered.length} of ${rows.length} records shown` : `${rows.length} total records`}
              </span>
              <span style={{ fontSize:11.5, color:C.slateLight, fontStyle:'italic' }}>Printed On : {printedOn}</span>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────── */}
          {rows.length === 0 ? (
            <div style={{ padding:'52px 0', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <i className="fas fa-users" style={{ fontSize:22, color:'#cbd5e1' }} />
              </div>
              <p style={{ color:C.slateLight, fontSize:14, margin:'0 0 4px', fontWeight:600 }}>No Candidates Found</p>
              <p style={{ color:'#94a3b8', fontSize:12.5, margin:0 }}>No candidates are eligible for counselling at this time.</p>
            </div>
          ) : (
            /* Scrollable container — header stays fixed, body scrolls */
            <div style={{ overflowX:'auto' }}>
              <div style={{ overflowY:'auto', maxHeight:'62vh' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5, tableLayout:'fixed' }}>
                  <colgroup>
                    <col style={{ width:'4%'  }} />
                    <col style={{ width:'11%' }} />
                    <col style={{ width:'5%'  }} />
                    <col style={{ width:'10%' }} />
                    <col style={{ width:'16%' }} />
                    <col style={{ width:'5%'  }} />
                    <col style={{ width:'8%'  }} />
                    <col style={{ width:'6%'  }} />
                    <col style={{ width:'9%'  }} />
                    <col style={{ width:'9%'  }} />
                    <col style={{ width:'10%' }} />
                    <col />
                  </colgroup>

                  {/* Sticky thead — stays at top while body scrolls */}
                  <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                    {/* Hidden rows for Excel export */}
                    <tr ref={tableRef} style={{ display:'none' }}>
                      {columns.map((c,i) => <th key={i}>{c.label}</th>)}
                    </tr>

                    {/* Visible sticky header row */}
                    <tr style={{ background:C.navy }}>
                      {columns.map((c, i) => (
                        <th key={i} style={{ ...thBase, textAlign:c.align, borderRight:i===columns.length-1?'none':thBase.borderRight, position:'sticky', top:0, background:C.navy }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ padding:28, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
                          No results match your search.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, i) => (
                        <tr key={i}
                          style={{ background:i%2===0?C.white:C.bg, transition:'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#f0fdf9'}
                          onMouseLeave={e => e.currentTarget.style.background=i%2===0?C.white:C.bg}>
                          <td style={{ ...tdBase, textAlign:'center', color:C.slateLight, fontWeight:600 }}>{i+1}.</td>
                          <td style={{ ...tdBase, textAlign:'center', color:'#0f172a', fontWeight:600 }}>{row.appliedCourse}</td>
                          <td style={{ ...tdBase, textAlign:'center' }}>
                            <span style={{ background:C.accent+'15', color:C.accent, border:`1px solid ${C.accent}30`, borderRadius:6, padding:'2px 8px', fontWeight:800, fontSize:12 }}>
                              {row.totalWeightage}
                            </span>
                          </td>
                          <td style={{ ...tdBase, textAlign:'center', fontWeight:600, color:'#1d4ed8', fontFamily:'monospace', fontSize:12.5 }}>{row.applicationID}</td>
                          <td style={{ ...tdBase, textAlign:'left', fontWeight:700, color:'#0f172a' }}>{row.candidateName}</td>
                          <td style={{ ...tdBase, textAlign:'center', color:C.slate }}>{row.gender}</td>
                          <td style={{ ...tdBase, textAlign:'center', color:C.slate, whiteSpace:'nowrap' }}>{row.dOB}</td>
                          <td style={{ ...tdBase, textAlign:'center' }}>
                            <span style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'2px 7px', fontSize:11.5, fontWeight:600, color:C.slate }}>
                              {row.finalCategory}
                            </span>
                          </td>
                          <td style={{ ...tdBase, textAlign:'center', color:C.slate }}>{row.domicileDistrict}</td>
                          <td style={{ ...tdBase, textAlign:'center', fontFamily:'monospace', fontSize:12, color:C.slate, whiteSpace:'nowrap' }}>{row.mobileNo}</td>
                          <td style={{ ...tdBase, textAlign:'left', fontSize:12, color:C.slateLight }}>{row.eMailID}</td>
                          <td style={{ ...tdBase, textAlign:'left', fontSize:12, color:C.slate, borderRight:'none' }}
                            dangerouslySetInnerHTML={{ __html: row.documentsDiscrepancy || '—' }} />
                        </tr>
                      ))
                    )}
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
