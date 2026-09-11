import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eVerificationApi } from '../../services/api'

/**
 * EVCWiseReport — mirrors Reports/EVCWiseReport.aspx
 * SP: Report_GetEVCWiseReport (no params)
 * Tables[0] = per-EVC rows, Tables[1] = totals footer
 * Columns: EVCID, EVCCode, TotalForms, NotVerifiedForms, ReUploadedForms,
 *          PartiallyVerifiedForms, FullyVerifiedForms
 * Click any count cell → drills down to EVCWiseCandidateList
 */
export default function EVCWiseReport() {
  const navigate             = useNavigate()
  const [items,   setItems]  = useState([])
  const [totals,  setTotals] = useState(null)
  const [loading, setLoading]= useState(true)
  const [error,   setError]  = useState('')

  const V = { navy:'#14212e', border:'#dee2e6', bg:'#f8f9fa', white:'#fff', muted:'#6c757d', danger:'#dc2626' }

  useEffect(() => {
    eVerificationApi.getEVCWiseReport()
      .then(r => {
        if (r.data.success) {
          setItems(r.data.items ?? [])
          setTotals(r.data.totals ?? null)
        } else {
          setError(r.data.message || 'Failed to load report.')
        }
      })
      .catch(() => setError('Server error. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  const drill = (evcId, evcCode, flag) => {
    navigate(`/everification/reports/evc-candidates?evcId=${evcId}&evcCode=${encodeURIComponent(evcCode)}&flag=${flag}`)
  }

  const handleExport = () => {
    const rows = items.map((it, i) => `
      <tr>
        <td>${i+1}</td><td>${it.evcCode}</td>
        <td>${it.totalForms}</td><td>${it.notVerifiedForms}</td>
        <td>${it.reUploadedForms}</td><td>${it.partiallyVerifiedForms}</td>
        <td>${it.fullyVerifiedForms}</td>
      </tr>`).join('')
    const footer = totals ? `
      <tr style="font-weight:bold">
        <td colspan="2">Total</td>
        <td>${totals.totalForms}</td><td>${totals.notVerifiedForms}</td>
        <td>${totals.reUploadedForms}</td><td>${totals.partiallyVerifiedForms}</td>
        <td>${totals.fullyVerifiedForms}</td>
      </tr>` : ''
    const html = `<table border="1">
      <thead><tr>
        <th>Sr.</th><th>EVC Code</th><th>Total</th>
        <th>Not Verified</th><th>Re-Uploaded</th>
        <th>Partially Verified</th><th>Fully Verified</th>
      </tr></thead>
      <tbody>${rows}${footer}</tbody>
    </table>`
    const blob = new Blob([html], { type:'application/vnd.ms-excel' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='EVCWiseReport.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  const cell = (val, evcId, evcCode, flag) => {
    // val is "231 + 0" format — extract first number for display and click check
    const firstNum = parseInt((val || '0').toString().split('+')[0].trim(), 10) || 0
    return (
      <td style={{ padding:'8px 12px', textAlign:'center' }}>
        {firstNum > 0 ? (
          <button onClick={() => drill(evcId, evcCode, flag)}
            style={{ background:'none', border:'none', color:'#2563eb', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline', textDecorationStyle:'dotted' }}>
            {firstNum}
          </button>
        ) : <span style={{ color:V.muted }}>0</span>}
      </td>
    )
  }

  return (
    <div style={{ fontFamily:'inherit', background:V.bg, minHeight:'100vh', padding:'20px 28px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        <div style={{ background:V.navy, borderRadius:'8px 8px 0 0', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:14.5 }}>
            <i className="fas fa-chart-bar" style={{ marginRight:8 }} />Co-Ordinator Wise Report
          </h5>
          <button onClick={handleExport} disabled={items.length === 0}
            style={{ background:'#dc2626', color:'#fff', border:'none', padding:'6px 14px', borderRadius:5, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
            <i className="fas fa-file-excel" />Export
          </button>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderTop:'none', color:V.danger, padding:'10px 18px', fontSize:13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight:6 }} />{error}
          </div>
        )}

        <div style={{ border:`1px solid ${V.border}`, borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:48, background:V.white }}>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color:V.muted, fontSize:13 }}>Loading report...</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:V.navy }}>
                    {['Sr.','EVC Code','Total','Not Verified','Re-Uploaded','Partially Verified','Fully Verified'].map((h,i) => (
                      <th key={i} style={{ padding:'9px 12px', color:'#fff', fontWeight:700, fontSize:11.5, textTransform:'uppercase', letterSpacing:'.04em', textAlign:i<=1?'left':'center', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:36, color:V.muted }}>No records found.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.evcid} style={{ background:i%2===0?V.white:V.bg, borderBottom:`1px solid ${V.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#e8f5e9'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?V.white:V.bg}>
                      <td style={{ padding:'8px 12px', color:V.muted }}>{i+1}.</td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>
                        <button onClick={() => drill(item.evcid, item.evcCode, 'A')}
                          style={{ background:'none', border:'none', color:'#2563eb', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                          {item.evcCode}
                        </button>
                      </td>
                      {cell(item.totalForms,            item.evcid, item.evcCode, 'A')}
                      {cell(item.notVerifiedForms,       item.evcid, item.evcCode, 'N')}
                      {cell(item.reUploadedForms,        item.evcid, item.evcCode, 'P')}
                      {cell(item.partiallyVerifiedForms, item.evcid, item.evcCode, 'R')}
                      {cell(item.fullyVerifiedForms,     item.evcid, item.evcCode, 'F')}
                    </tr>
                  ))}
                  {/* Footer totals */}
                  {totals && (
                    <tr style={{ background:'#f0fdf4', borderTop:`2px solid #059669`, fontWeight:700 }}>
                      <td colSpan={2} style={{ padding:'9px 12px', fontSize:13 }}>Total</td>
                      {[totals.totalForms, totals.notVerifiedForms, totals.reUploadedForms, totals.partiallyVerifiedForms, totals.fullyVerifiedForms].map((v,i) => (
                        <td key={i} style={{ padding:'9px 12px', textAlign:'center' }}>
                          {parseInt((v||'0').toString().split('+')[0].trim(),10)||0}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
