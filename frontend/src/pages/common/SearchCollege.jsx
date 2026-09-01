import { useState, useEffect } from 'react'
import { homeApi } from '../../services/api'

/**
 * Search College — mirrors SearchCollege.aspx exactly.
 *
 * Layout:
 *   1. Green section header "Search College"
 *   2. Filter card — Course | District | Status dropdowns + Search button
 *   3. Results — green filter summary rows + college list table
 *      Columns: Sr. | College Code | District | College Name | Course | Status | Intake
 *
 * SPs: Base_GetMasterCourse, Base_GetMasterCollegeDistrict,
 *      Base_GetMasterTableList(Master_CourseStatus), College_SearchCollege
 */
export default function SearchCollege() {
  const [masters,    setMasters]    = useState({ courses: [], districts: [], courseStatuses: [] })
  const [filters,    setFilters]    = useState({ courseID: '0', districtID: '0', courseStatusID: '0' })
  const [results,    setResults]    = useState(null)   // null = not searched yet
  const [loading,    setLoading]    = useState(true)
  const [searching,  setSearching]  = useState(false)
  const [error,      setError]      = useState('')

  const V = {
    navy:    '#14212e',
    primary: '#059669',
    primaryDark: '#047857',
    teal:    '#0d9488',
    tealLight: '#e6faf5',
    tealBorder: '#a7f3d0',
    border:  '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecond:  '#64748b',
    bg:      '#f5f6fa',
  }

  // Load masters on mount
  useEffect(() => {
    homeApi.getSearchCollegeMasters()
      .then(res => setMasters(res.data))
      .catch(() => setError('Failed to load filter options.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    setSearching(true); setError(''); setResults(null)
    try {
      const res = await homeApi.searchCollege({
        courseID:       parseInt(filters.courseID),
        districtID:     parseInt(filters.districtID),
        courseStatusID: parseInt(filters.courseStatusID),
      })
      if (res.data.success) setResults(res.data)
      else setError(res.data.message || 'No records found.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'An error occurred.')
    } finally { setSearching(false) }
  }

  // Get selected label for a value from a list
  const getLabel = (list, value) =>
    value === '0' ? 'All' : list.find(i => i.value === value)?.text ?? value

  const selCls = { width: '100%', padding: '10px 14px', border: `1.5px solid ${V.border}`, borderRadius: 8, fontSize: 13.5, color: V.textPrimary, background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p style={{ color: V.textSecond, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: V.bg, minHeight: '100vh', padding: '24px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Section Header — green bar matching old .sc-section-header ── */}
        <div style={{ background: V.primary, borderRadius: 12, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-search" style={{ color: '#fff', fontSize: 14 }}/>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Search College</h3>
        </div>

        {/* ── Filter card ─────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '22px 24px 8px' }}>
            {/* 3-column filter grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 18, marginBottom: 16 }} className="sc-filter-grid">

              {/* Course */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.04em' }}>Course</label>
                <select value={filters.courseID} onChange={e => setFilters(f => ({ ...f, courseID: e.target.value }))} style={selCls}>
                  <option value="0">All</option>
                  {masters.courses.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                </select>
              </div>

              {/* District */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.04em' }}>District</label>
                <select value={filters.districtID} onChange={e => setFilters(f => ({ ...f, districtID: e.target.value }))} style={selCls}>
                  <option value="0">All</option>
                  {masters.districts.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: V.textSecond, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.04em' }}>Status</label>
                <select value={filters.courseStatusID} onChange={e => setFilters(f => ({ ...f, courseStatusID: e.target.value }))} style={selCls}>
                  <option value="0">All</option>
                  {masters.courseStatuses.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* Search button row */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px 22px' }}>
            <button type="button" onClick={handleSearch} disabled={searching}
              style={{ background: searching ? '#6b7280' : V.primary, color: '#fff', border: 'none', padding: '11px 36px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: searching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,.25)', fontFamily: 'inherit' }}
              onMouseEnter={e => { if (!searching) e.currentTarget.style.background = V.primaryDark }}
              onMouseLeave={e => { if (!searching) e.currentTarget.style.background = V.primary }}>
              {searching
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Searching...</>
                : <><i className="fas fa-search"/>Search</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}/>{error}
          </div>
        )}

        {/* ── College List ─────────────────────────────────────────────── */}
        {results && (
          <>
            {/* Green section header */}
            <div style={{ background: V.primary, borderRadius: 12, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fas fa-university" style={{ color: '#fff', fontSize: 14 }}/>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>
                College List
                <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 12, opacity: 0.85 }}>
                  ({results.totalCount} record{results.totalCount !== 1 ? 's' : ''} found)
                </span>
              </h3>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

              {/* Filter summary rows — mirrors old gvCollegeList_RowCreated injected rows */}
              {[
                { key: 'COURSE',    value: getLabel(masters.courses,        filters.courseID)       },
                { key: 'DISTRICT',  value: getLabel(masters.districts,      filters.districtID)     },
                { key: 'STATUS',    value: getLabel(masters.courseStatuses, filters.courseStatusID) },
              ].map(row => (
                <div key={row.key} style={{ padding: '8px 14px', background: V.tealLight, borderBottom: `1px solid ${V.tealBorder}`, fontSize: 13 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: V.teal, textTransform: 'uppercase', letterSpacing: '.05em' }}>{row.key}:</span>
                  {' '}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>{row.value}</span>
                </div>
              ))}

              {/* Results table */}
              {results.colleges.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: V.textSecond, fontSize: 14 }}>
                  <i className="fas fa-university" style={{ fontSize: 28, color: '#e2e8f0', display: 'block', marginBottom: 8 }}/>
                  No colleges found matching your filters.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: V.navy }}>
                        {['Sr.', 'College Code', 'District', 'College Name', 'Course', 'Status', 'Intake'].map((h, i) => (
                          <th key={h} style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap', textAlign: i === 6 ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.colleges.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${V.borderLight}`, background: i % 2 === 1 ? '#fafbfc' : '#fff', transition: 'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0fdf9'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? '#fafbfc' : '#fff'}>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: V.textSecond, fontWeight: 600 }}>{i + 1}.</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1d4ed8', fontFamily: 'monospace' }}>{row.collegeCode}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13 }}>{row.district}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: V.textPrimary }}>{row.collegeName}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12.5, color: V.textSecond }}>{row.course}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                              background: row.courseStatus?.toLowerCase() === 'aided' ? '#dcfce7' : '#fef3c7',
                              color:      row.courseStatus?.toLowerCase() === 'aided' ? '#166534' : '#92400e',
                              border:     `1px solid ${row.courseStatus?.toLowerCase() === 'aided' ? '#bbf7d0' : '#fde68a'}`,
                            }}>
                              {row.courseStatus}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'center', fontWeight: 700 }}>{row.intake}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      <style>{`
        @media(max-width:640px){ .sc-filter-grid{ grid-template-columns:1fr!important } }
      `}</style>
    </div>
  )
}
