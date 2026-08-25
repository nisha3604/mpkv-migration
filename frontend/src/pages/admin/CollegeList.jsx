import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminCollegeApi, collegeApi } from '../../services/api'

/**
 * College List — mirrors CollegeList.aspx + CollegeList.aspx.cs
 *
 * Exact functionality from old project:
 *  - Page_Load: LoadMasters() → Course + District dropdowns
 *  - SP: College_GetCollegeList(@CourseID, @DistrictID, @CollegeCode, @CollegeName)
 *  - Loads list on page load (same as GetCollegeList() called in Page_Load)
 *  - Search button → btnProceed_Click → re-runs GetCollegeList()
 *  - Edit icon → gvCollegeList_SelectedIndexChanging → navigate to CollegeSummary
 *  - Grid header rows show applied filter values (Course/District/CollegeCode/CollegeName)
 *  - CollegeCode: numbers only, max 4 digits
 *  - Export to Excel button (opens grid data as downloadable CSV — browser-side equivalent)
 *
 * Columns: Sr.No., CollegeCode, District, CollegeName, Course, CourseStatus, CurrentStatus, Edit
 */
export default function CollegeList() {
  const navigate = useNavigate()

  const [masters,  setMasters]  = useState({ courses: [], districts: [] })
  const [filter,   setFilter]   = useState({ courseID: '0', districtID: '0', collegeCode: '', collegeName: '' })
  const [colleges, setColleges] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,    setError]    = useState('')
  const [noRecord, setNoRecord] = useState(false)

  // ── Load masters on mount (mirrors LoadMasters()) ─────────────────────────
  useEffect(() => {
    collegeApi.getDetails(null)
      .then(res => {
        setMasters({
          courses   : [{ value: '0', text: 'All' }, ...(res.data.courses    ?? [])],
          districts : [{ value: '0', text: 'All' }, ...(res.data.districts  ?? [])],
        })
      })
      .catch(() => {})

    // Load all on page load — mirrors Page_Load calling GetCollegeList()
    handleSearch()
  }, [])

  // ── Search (mirrors btnProceed_Click → GetCollegeList()) ─────────────────
  const handleSearch = (f = filter) => {
    setLoading(true); setError(''); setNoRecord(false)
    adminCollegeApi.getList({
      courseID   : f.courseID,
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
      .catch(() => setError('Failed to load college list.'))
      .finally(() => setLoading(false))
  }

  const handleFilterChange = e => {
    const { name, value } = e.target
    // CollegeCode: numbers only (mirrors AllowOnlyNumbers JS)
    if (name === 'collegeCode' && value && !/^\d*$/.test(value)) return
    setFilter(p => ({ ...p, [name]: value }))
  }

  // ── Click Edit → navigate to Summary (mirrors gvCollegeList_SelectedIndexChanging)
  const handleEdit = (collegeID) => {
    navigate(`/admin/college/summary?collegeId=${collegeID}`)
  }

  // ── Export to Excel (browser-side CSV — replaces server-side Excel export) ─
  const handleExport = () => {
    if (!colleges.length) return
    const headers = ['Sr.No.', 'College Code', 'District', 'College Name', 'Course', 'Course Status', 'Current Status']
    const rows    = colleges.map((c, i) => [
      i + 1, c.collegeCode, c.district, c.collegeName, c.course, c.courseStatus, c.status
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'CollegeList.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Applied filter labels (mirrors gvCollegeList_RowCreated header rows) ─
  const selectedCourseName   = masters.courses.find(c => c.value === filter.courseID)?.text    ?? 'All'
  const selectedDistrictName = masters.districts.find(d => d.value === filter.districtID)?.text ?? 'All'

  return (
    <>
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* No records */}
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
            <div className="grid grid-cols-4 gap-4">
              {/* Course dropdown */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Course
                </label>
                <select name="courseID" value={filter.courseID} onChange={handleFilterChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  {masters.courses.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                </select>
              </div>

              {/* District dropdown */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  District
                </label>
                <select name="districtID" value={filter.districtID} onChange={handleFilterChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  {masters.districts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                </select>
              </div>

              {/* College Code — numbers only, max 4 */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  College Code
                </label>
                <input name="collegeCode" value={filter.collegeCode} onChange={handleFilterChange}
                  maxLength={4} placeholder="e.g. 1234"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>

              {/* College Name */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  College Name
                </label>
                <input name="collegeName" value={filter.collegeName} onChange={handleFilterChange}
                  placeholder="Search by name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
            </div>
          </div>

          {/* Search button */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-center">
            <button onClick={() => handleSearch(filter)} disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-2.5 rounded-lg transition-colors">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
                : <><i className="fas fa-search" /> Search</>}
            </button>
          </div>
        </div>

        {/* ── Results Card (visible only when results exist) ─────────── */}
        {searched && colleges.length > 0 && (
          <div className="card shadow-sm overflow-hidden">
            <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-list text-gray-400 text-sm" />
                <span className="text-white font-semibold text-sm tracking-wide">
                  College List ({colleges.length})
                </span>
              </div>
              {/* Export to Excel button */}
              <button onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors">
                <i className="fas fa-file-excel" /> Export to Excel
              </button>
            </div>

            {/* Filter summary header rows — mirrors gvCollegeList_RowCreated */}
            <div className="border-b border-gray-200" style={{ background: '#D5CEA3' }}>
              {[
                { label: 'Course',       value: selectedCourseName },
                { label: 'District',     value: selectedDistrictName },
                { label: 'College Code', value: filter.collegeCode || 'All' },
                { label: 'College Name', value: filter.collegeName || 'All' },
              ].map((row, i) => (
                <div key={i} className="px-5 py-1 text-sm font-bold text-gray-800 border-b border-gray-300 last:border-b-0">
                  {row.label} : {row.value}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {['Sr. No.', 'College Code', 'District', 'College Name', 'Course', 'Course Status', 'Current Status', 'Edit'].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${i === 3 ? 'text-left' : ''}`}>
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
                      <td className="px-4 py-3 text-center text-gray-700">{c.course}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {c.courseStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {c.status || (c.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {/* Edit icon — mirrors fa-edit in old grid command field */}
                        <button onClick={() => handleEdit(c.collegeID)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors mx-auto"
                          title="Edit">
                          <i className="fas fa-edit text-base" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 mt-4">
        © {new Date().getFullYear()} Mahatma Phule Krishi Vidyapeeth, Rahuri
      </footer>
    </>
  )
}
