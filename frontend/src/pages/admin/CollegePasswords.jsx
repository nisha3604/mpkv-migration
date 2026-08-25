import { useState, useEffect } from 'react'
import { adminCollegeApi, collegeApi } from '../../services/api'

/**
 * Get College Password — mirrors GetCollegePassword.aspx + .aspx.cs
 *
 * Exact functionality from old project:
 *  - Page_Load: loads District dropdown, calls GetCollegeList() on load
 *  - SP: College_GetCollegeList(@CourseID=0, @DistrictID, @CollegeCode, @CollegeName)
 *  - Passwords are Base64-decoded on display (mirrors Base64Decrypt in old code)
 *    — backend already decodes before sending
 *  - Send SMS button → gvCollegeList_SelectedIndexChanging:
 *      fetches SMS template via GetEMailSMS("SendLoginIDPassword","S",CollegeCode)
 *      sends SMS with CollegeCode as VAR1, decoded Password as VAR2
 *  - Export to Excel (CSV equivalent)
 *
 * Columns: Sr.No., CollegeCode, District, CollegeName, Mobile No., Password, Send SMS
 */
export default function CollegePasswords() {
  const [districts, setDistricts]   = useState([{ value: '0', text: 'All' }])
  const [filter,    setFilter]      = useState({ districtID: '0', collegeCode: '', collegeName: '' })
  const [colleges,  setColleges]    = useState([])
  const [loading,   setLoading]     = useState(false)
  const [searched,  setSearched]    = useState(false)
  const [error,     setError]       = useState('')
  const [noRecord,  setNoRecord]    = useState(false)
  const [smsStatus, setSmsStatus]   = useState({})  // { collegeCode: 'success'|'error'|'sending' }

  // ── Load districts on mount ───────────────────────────────────────────────
  useEffect(() => {
    collegeApi.getDetails(null)
      .then(res => {
        setDistricts([{ value: '0', text: 'All' }, ...(res.data.districts ?? [])])
      })
      .catch(() => {})

    // Load all colleges on page load — same as Page_Load calling GetCollegeList()
    handleSearch()
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (f = filter) => {
    setLoading(true); setError(''); setNoRecord(false)
    adminCollegeApi.getPasswords({
      districtID : f.districtID,
      collegeCode: f.collegeCode,
      collegeName: f.collegeName,
    })
      .then(res => {
        const list = res.data.colleges ?? []
        setColleges(list)
        setSearched(true)
        if (list.length === 0) setNoRecord(true)
      })
      .catch(() => setError('Failed to load college passwords.'))
      .finally(() => setLoading(false))
  }

  const handleFilterChange = e => {
    const { name, value } = e.target
    if (name === 'collegeCode' && value && !/^\d*$/.test(value)) return
    setFilter(p => ({ ...p, [name]: value }))
  }

  // ── Send SMS (mirrors gvCollegeList_SelectedIndexChanging) ────────────────
  // Backend sends SMS via Msg91 using template "SendLoginIDPassword"
  // VAR1 = CollegeCode, VAR2 = decoded password
  const handleSendSms = async (collegeCode) => {
    setSmsStatus(p => ({ ...p, [collegeCode]: 'sending' }))
    try {
      // POST to backend which calls GetEMailSMS + MessagingHelperMsg91.SendSMS
      await adminCollegeApi.sendSms({ collegeCode })
      setSmsStatus(p => ({ ...p, [collegeCode]: 'success' }))
      setTimeout(() => setSmsStatus(p => ({ ...p, [collegeCode]: null })), 3000)
    } catch {
      setSmsStatus(p => ({ ...p, [collegeCode]: 'error' }))
      setTimeout(() => setSmsStatus(p => ({ ...p, [collegeCode]: null })), 3000)
    }
  }

  // ── Export to CSV ─────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!colleges.length) return
    const headers = ['Sr.No.', 'College Code', 'District', 'College Name', 'Mobile No.', 'Password']
    const rows    = colleges.map((c, i) => [i + 1, c.collegeCode, c.district, c.collegeName, c.mobileNo, c.password])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'CollegePasswordList.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}
        {noRecord && !error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" /> No Records Found.
          </div>
        )}

        {/* ── Search Card ────────────────────────────────────────────── */}
        <div className="card mb-4 shadow-sm overflow-hidden">
          <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
            <i className="fas fa-search text-gray-400 text-sm" />
            <span className="text-white font-semibold text-sm tracking-wide">Search College</span>
          </div>
          <div className="px-5 py-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">District</label>
                <select name="districtID" value={filter.districtID} onChange={handleFilterChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  {districts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">College Code</label>
                <input name="collegeCode" value={filter.collegeCode} onChange={handleFilterChange}
                  maxLength={4} placeholder="e.g. 1234"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">College Name</label>
                <input name="collegeName" value={filter.collegeName} onChange={handleFilterChange}
                  placeholder="Search by name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-center">
            <button onClick={() => handleSearch(filter)} disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-2.5 rounded-lg transition-colors">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching...</>
                : <><i className="fas fa-search" />Search</>}
            </button>
          </div>
        </div>

        {/* ── Results ───────────────────────────────────────────────── */}
        {searched && colleges.length > 0 && (
          <div className="card shadow-sm overflow-hidden">
            <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-key text-gray-400 text-sm" />
                <span className="text-white font-semibold text-sm tracking-wide">
                  College List ({colleges.length})
                </span>
              </div>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors">
                <i className="fas fa-file-excel" /> Export to Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {['Sr. No.', 'College Code', 'District', 'College Name', 'Mobile No.', 'Password', 'Send SMS'].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center ${i === 3 ? 'text-left' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{i + 1}.</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{c.collegeCode}</td>
                      <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">{c.district}</td>
                      <td className="px-4 py-3 text-left text-gray-900 font-medium">{c.collegeName}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{c.mobileNo}</td>
                      {/* Password — displayed decoded (mirrors Base64Decrypt in old code) */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-gray-900 tracking-wider">
                        {c.password || '—'}
                      </td>
                      {/* Send SMS button */}
                      <td className="px-4 py-3 text-center">
                        {smsStatus[c.collegeCode] === 'sending' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : smsStatus[c.collegeCode] === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <i className="fas fa-check-circle" /> Sent!
                          </span>
                        ) : smsStatus[c.collegeCode] === 'error' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                            <i className="fas fa-times-circle" /> Failed
                          </span>
                        ) : (
                          <button onClick={() => handleSendSms(c.collegeCode)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded transition-colors mx-auto">
                            <i className="fas fa-sms" /> Send SMS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 mt-4">
        © {new Date().getFullYear()} Mahatma Phule Krishi Vidyapeeth, Rahuri
      </footer>
    </>
  )
}
