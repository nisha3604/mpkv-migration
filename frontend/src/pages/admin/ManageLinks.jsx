import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuApi } from '../../services/api'
import { MenuTopNav, PageHeader } from './MenuHome'

/**
 * ManageLinks — mirrors ManageLinks.aspx exactly.
 *
 * Functionality:
 *  1. Directory dropdown (Groups | ExternalLinks | Admission | Candidate | College …)
 *  2. Grid: Sr | Link Name | Link URL | Directory | Is Active ☑
 *  3. Add New Link → /admin/menu/add-edit-link?LinkID=0&Directory=X
 *  4. Edit (pencil) → /admin/menu/add-edit-link?LinkID=Y&Directory=X
 *  5. Save Links button — saves IsActive for all rows
 */

const DIRECTORIES = [
  { value:'-1', label:'Select' },
  { value:'Groups',         label:'Groups' },
  { value:'ExternalLinks',  label:'External Links' },
  { value:'Admission',      label:'Admission' },
  { value:'Candidate',      label:'Candidate' },
  { value:'College',        label:'College' },
  { value:'Administration', label:'Administration' },
  { value:'Reports',        label:'Reports' },
  { value:'Fee',            label:'Fee' },
  { value:'Menu',           label:'Menu' },
  { value:'Counselling',    label:'Counselling' },
]

export default function ManageLinks() {
  const navigate      = useNavigate()
  const [sp]          = useSearchParams()

  const [directory,   setDirectory]  = useState(sp.get('Directory') || '-1')
  const [rows,        setRows]       = useState([])
  const [loading,     setLoading]    = useState(false)
  const [saving,      setSaving]     = useState(false)
  const [msg,         setMsg]        = useState({ text:'', ok:true })

  useEffect(() => {
    if (directory === '-1') { setRows([]); return }
    loadLinks()
  }, [directory])

  const loadLinks = async () => {
    setLoading(true); setMsg({ text:'', ok:true })
    try {
      const res = await menuApi.getLinks(directory)
      const items = res.data.items ?? []
      setRows(items.map(item => ({ ...item })))
      if (items.length === 0) setMsg({ text:'No Records Found.', ok:false })
    } catch { setMsg({ text:'Failed to load links.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleIsActive = (linkId, val) =>
    setRows(prev => prev.map(r => r.linkID===linkId ? {...r, isActive:val} : r))

  const handleSave = async () => {
    setSaving(true); setMsg({ text:'', ok:true })
    try {
      // Save each link's IsActive via saveLink
      const promises = rows.map(r => menuApi.saveLink({
        linkID:               r.linkID,
        linkName:             r.linkName,
        linkNameMarathi:      r.linkNameMarathi       || '',
        linkDescription:      r.linkDescription       || '',
        linkDescriptionMarathi:r.linkDescriptionMarathi||'',
        linkURL:              r.linkURL,
        linkType:             r.linkType              || 'P',
        directory:            r.directory             || directory,
        pageName:             '',
        queryString:          '',
        isActive:             r.isActive,
      }))
      await Promise.all(promises)
      setMsg({ text:'Data Saved Successfully.', ok:true })
      loadLinks()
    } catch { setMsg({ text:'An error occurred.', ok:false }) }
    finally { setSaving(false) }
  }

  const thS = { padding:'10px 12px', color:'#fff', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', borderRight:'1px solid rgba(255,255,255,.1)', whiteSpace:'nowrap' }
  const tdS = { padding:'8px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', textAlign:'center', verticalAlign:'middle' }

  return (
    <div style={{ fontFamily:'inherit', background:'#f1f5f9', minHeight:'100vh', padding:24 }}>
      <PageHeader title="Manage Links" />
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

        <MenuTopNav active="Manage Links" />

        {msg.text && (
          <div style={{ background:msg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.ok?'#86efac':'#fecaca'}`, color:msg.ok?'#166534':'#dc2626', borderRadius:7, padding:'9px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>{msg.text}
            <button onClick={()=>setMsg({text:'',ok:true})} style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'inherit' }}>×</button>
          </div>
        )}

        {/* Directory + Add */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:20, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:5 }}>Module / Directory <span style={{ color:'#dc2626' }}>*</span></label>
            <select value={directory} onChange={e => { setDirectory(e.target.value); setRows([]) }}
              style={{ padding:'7px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', minWidth:220 }}>
              {DIRECTORIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          {directory !== '-1' && (
            <button onClick={() => navigate(`/admin/menu/add-edit-link?LinkID=0&Directory=${directory}`)}
              style={{ background:'#059669', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7, boxShadow:'0 3px 10px rgba(5,150,105,.3)' }}>
              <i className="fas fa-plus"/>Add New Link
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : rows.length > 0 && (
          <>
            <div style={{ overflowX:'auto', marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#14212e' }}>
                    <th style={{ ...thS, width:'4%' }}>Sr.</th>
                    <th style={{ ...thS, width:'5%' }}>Action</th>
                    <th style={{ ...thS, width:'30%', textAlign:'left' }}>Link Name</th>
                    <th style={{ ...thS, width:'35%', textAlign:'left' }}>Link URL</th>
                    <th style={{ ...thS, width:'10%' }}>Type</th>
                    <th style={{ ...thS, width:'8%' }}>Is Active</th>
                    <th style={{ ...thS, width:'8%', borderRight:'none' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.linkID} style={{ background:idx%2===0?'#fff':'#f9f9f9' }}>
                      <td style={{ ...tdS, color:'#64748b' }}>{idx+1}.</td>
                      <td style={tdS}>
                        <button onClick={() => navigate(`/admin/menu/add-edit-link?LinkID=${row.linkID}&Directory=${directory}`)}
                          style={{ background:'transparent', border:'none', cursor:'pointer', color:'#059669', fontSize:18, padding:0 }} title="Edit">
                          <i className="fa fa-edit"/>
                        </button>
                      </td>
                      <td style={{ ...tdS, textAlign:'left', fontWeight:500, color:'#0f172a' }}>{row.linkName}</td>
                      <td style={{ ...tdS, textAlign:'left', color:'#475569', fontSize:12, fontFamily:'monospace', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.linkURL}>{row.linkURL}</td>
                      <td style={tdS}><span style={{ background:'#f1f5f9', color:'#64748b', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>{row.linkType}</span></td>
                      <td style={tdS}>
                        <input type="checkbox" checked={row.isActive} onChange={e=>handleIsActive(row.linkID,e.target.checked)}
                          style={{ width:16, height:16, cursor:'pointer', accentColor:'#059669' }}/>
                      </td>
                      <td style={{ ...tdS, borderRight:'none' }}>
                        <button onClick={() => navigate(`/admin/menu/add-edit-link?LinkID=${row.linkID}&Directory=${directory}`)}
                          style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign:'center' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background:saving?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                {saving?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<>Save Links</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
