import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportsListApi } from '../../services/api'

/**
 * AdminReportsList — mirrors Reports/ReportsList.aspx
 *
 * Old project behaviour:
 *  - SP: Administration_GetReportList(@RegionID=1) → ReportID + ReportName
 *  - Grid: Sr. No. | Report Name (clickable link)
 *  - Clicking a report navigates to GenerateReport.aspx?ReportID=N
 *    → mapped here to /admin/reports/{id}/view
 *
 * Access: UserTypeID 11 / 12 only (enforced by ProtectedRoute in App.jsx)
 */

const V = { navy: '#14212e', teal: '#0d9488', primary: '#059669' }

export default function AdminReportsList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    reportsListApi.getList()
      .then(res => {
        if (res.data?.success) setReports(res.data.items ?? [])
        else setError(res.data?.message || 'Failed to load reports.')
      })
      .catch(() => setError('Failed to load reports. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 max-w-4xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="rounded-t-lg px-6 py-4" style={{ background: V.navy }}>
        <h1 className="text-white text-xl font-semibold tracking-wide">Reports List</h1>
        <p className="text-gray-300 text-sm mt-0.5">
          Click a report name to view and export results.
        </p>
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-b-lg shadow border border-t-0 border-gray-200 overflow-hidden">

        {/* Error */}
        {error && (
          <div className="mx-5 mt-5 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <i className="fas fa-file-alt text-3xl mb-3 block opacity-30" />
            No reports found.
          </div>
        )}

        {/* Grid */}
        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: V.navy }}>
                  <th className="px-4 py-3 text-white text-xs font-semibold uppercase tracking-wider text-center w-16">
                    Sr. No.
                  </th>
                  <th className="px-4 py-3 text-white text-xs font-semibold uppercase tracking-wider text-left">
                    Report Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.reportID}
                    className="border-b border-gray-100 hover:bg-emerald-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/reports/${r.reportID}/view`)}
                  >
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {i + 1}.
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-medium hover:underline"
                        style={{ color: V.teal }}
                      >
                        <i className="fas fa-chart-bar mr-2 text-xs opacity-60" />
                        {r.reportName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && reports.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
            {reports.length} report{reports.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>
    </div>
  )
}
