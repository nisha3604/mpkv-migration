import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reportsListApi } from '../../services/api'

/**
 * AdminGenerateReport — mirrors Reports/GenerateReport.aspx
 *
 * Old project behaviour:
 *  - Receives ReportID from query string
 *  - SP: Administration_ExecuteReport(@ReportID)
 *  - Card header = ReportHeader from SP
 *  - Two injected header rows above column names:
 *      Row 1 (tan #D5CEA3): "Printed On : dd/MM/yyyy  HH:MM:SS" — left aligned
 *      Row 2 (tan #D5CEA3): ReportHeader — centre aligned, medium bold
 *  - Back button (red) → /admin/reports/list
 *  - Export to Excel (green) → streams HTML table as .xls
 *    Filename: ReportHeader spaces→underscores + ".xls"
 *
 * Access: UserTypeID 11 / 12 only (enforced by ProtectedRoute in App.jsx)
 */

const V = { navy: '#14212e', tan: '#D5CEA3', primary: '#059669', danger: '#dc2626' }

// Format date exactly as old project: dd/MM/yyyy  HH:MM:SS AM/PM
function printedOnText() {
  const now = new Date()
  const pad  = n => String(n).padStart(2, '0')
  const dd   = pad(now.getDate())
  const mm   = pad(now.getMonth() + 1)
  const yyyy = now.getFullYear()
  let   hh   = now.getHours()
  const min  = pad(now.getMinutes())
  const sec  = pad(now.getSeconds())
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `Printed On : ${dd}/${mm}/${yyyy}  ${pad(hh)}:${min}:${sec} ${ampm}`
}

export default function AdminGenerateReport() {
  const { id }   = useParams()            // /admin/reports/:id/view
  const navigate = useNavigate()

  const [data,    setData]    = useState(null)   // GenerateReportResponse
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [printOn] = useState(() => printedOnText())   // captured once on mount

  useEffect(() => {
    if (!id) { setError('Invalid report ID.'); setLoading(false); return }
    reportsListApi.generateReport(id)
      .then(res => {
        if (res.data?.success) setData(res.data)
        else setError(res.data?.message || 'Failed to generate report.')
      })
      .catch(() => setError('Server error. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Export to Excel (mirrors btnExportToExcel_Click) ──────────────────────
  const handleExport = () => {
    if (!data?.rows?.length) return

    // Build HTML table identical to old project (includes the two header rows)
    const colSpan = (data.columns?.length ?? 0) + 1  // +1 for Sr. No.

    const headerRows = `
      <tr>
        <td colspan="${colSpan}" style="background:#D5CEA3;font-weight:bold;font-size:small;text-align:left;border:1px solid #ccc;">
          ${printOn}
        </td>
      </tr>
      <tr>
        <td colspan="${colSpan}" style="background:#D5CEA3;font-weight:bold;font-size:medium;text-align:center;border:1px solid #ccc;">
          ${data.reportHeader ?? ''}
        </td>
      </tr>`

    const colHeaders = `<tr style="background:#14212e;color:#fff;">
      <th style="padding:6px 10px;border:1px solid #ccc;">Sr.</th>
      ${(data.columns ?? []).map(c => `<th style="padding:6px 10px;border:1px solid #ccc;">${c}</th>`).join('')}
    </tr>`

    const bodyRows = (data.rows ?? []).map((row, i) =>
      `<tr>
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
        ${(row ?? []).map(cell => `<td style="padding:5px 10px;border:1px solid #ddd;">${cell ?? ''}</td>`).join('')}
      </tr>`
    ).join('')

    const html = `<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
      <thead>${headerRows}${colHeaders}</thead>
      <tbody>${bodyRows}</tbody>
    </table>`

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${data.fileName || 'Report'}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasData = data?.rows?.length > 0

  return (
    <div className="p-4 max-w-full mx-auto">

      {/* ── Card header ─────────────────────────────────────────────── */}
      <div
        className="rounded-t-lg px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: V.navy }}
      >
        <div className="min-w-0">
          <h1 className="text-white text-xl font-semibold tracking-wide truncate">
            {loading ? 'Loading…' : (data?.reportHeader || 'Report')}
          </h1>
          {hasData && (
            <p className="text-gray-300 text-xs mt-0.5">
              {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Action buttons — shown once data loads (mirrors divReport visibility) */}
        {!loading && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/admin/reports/list')}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold text-white transition"
              style={{ background: V.danger }}
            >
              <i className="fas fa-arrow-left text-xs" /> Back
            </button>
            {hasData && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold text-white transition"
                style={{ background: V.primary }}
              >
                <i className="fas fa-file-excel text-xs" /> Export to Excel
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-b-lg shadow border border-t-0 border-gray-200 overflow-hidden">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="m-5 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle flex-shrink-0" />
            {error}
          </div>
        )}

        {/* No data */}
        {!loading && !error && !hasData && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <i className="fas fa-inbox text-3xl mb-3 block opacity-30" />
            No data found for this report.
          </div>
        )}

        {/* ── Data grid ─────────────────────────────────────────────── */}
        {!loading && hasData && (
          <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table className="w-full text-sm border-collapse">

              {/* ── Injected header rows (mirrors gvReport_RowCreated) ── */}
              <thead>
                {/* Row 1: Printed On (left, tan) */}
                <tr style={{ background: V.tan }}>
                  <td
                    colSpan={(data.columns?.length ?? 0) + 1}
                    className="px-4 py-2 text-left text-xs font-bold border border-gray-300"
                    style={{ color: '#3d3d1e' }}
                  >
                    {printOn}
                  </td>
                </tr>

                {/* Row 2: Report Header (centre, tan) */}
                <tr style={{ background: V.tan }}>
                  <td
                    colSpan={(data.columns?.length ?? 0) + 1}
                    className="px-4 py-2 text-center text-sm font-bold border border-gray-300"
                    style={{ color: '#3d3d1e' }}
                  >
                    {data.reportHeader}
                  </td>
                </tr>

                {/* Row 3: Column names */}
                <tr style={{ background: V.navy }}>
                  <th className="px-3 py-2 text-white text-xs font-semibold uppercase tracking-wider text-center w-14 whitespace-nowrap border border-gray-700">
                    Sr.
                  </th>
                  {(data.columns ?? []).map((col, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-white text-xs font-semibold uppercase tracking-wider text-left whitespace-nowrap border border-gray-700"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Data rows ─────────────────────────────────────────── */}
              <tbody>
                {data.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    style={{ background: ri % 2 === 0 ? '#fff' : '#f9fafb' }}
                  >
                    <td className="px-3 py-2 text-center text-gray-400 text-xs border-r border-gray-100">
                      {ri + 1}
                    </td>
                    {(row ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100"
                      >
                        {cell ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && hasData && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>{data.rows.length} row{data.rows.length !== 1 ? 's' : ''}</span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white"
              style={{ background: V.primary }}
            >
              <i className="fas fa-file-excel" /> Export to Excel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
