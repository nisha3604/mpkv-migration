import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuApi } from '../../services/api'
import { MenuTopNav, PageHeader } from './MenuHome'

/**
 * ManageGroups — mirrors ManageGroups.aspx exactly.
 *
 * Functionality:
 *  1. UserType dropdown → loads top-level group list (ParentMenuID=0)
 *  2. Grid: Edit | Menu Name | Display Start | Display End | IsActive ☑ | Set Seq ☑ | Seq No
 *  3. Reset Groups / Save Groups buttons (same SeqNo logic as ManageMenus)
 *  4. Add New Group → /admin/menu/add-edit?MenuID=0&UserTypeID=X&ParentMenuID=0
 */

const USER_TYPES = [
  { value: '-1', label: 'Select' },
  { value:  '0', label: 'Public' },
  { value: '91', label: 'Candidate' },
  { value: '61', label: 'College' },
  { value: '11', label: 'Super Admin' },
  { value: '12', label: 'Admin' },
]

export default function ManageGroups() {
  const navigate       = useNavigate()
  const [sp]           = useSearchParams()

  const [userTypeId,   setUserTypeId]   = useState(sp.get('UserTypeID') || '-1')
  const [rows,         setRows]         = useState([])
  const [seqCounter,   setSeqCounter]   = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState({ text:'', ok:true })

  useEffect(() => {
    if (userTypeId === '-1') { setRows([]); return }
    loadGroups()
  }, [userTypeId])

  const loadGroups = async () => {
    setLoading(true); setMsg({ text:'', ok:true })
    try {
      const res = await menuApi.getGroups(parseInt(userTypeId))
      const items = res.data.items ?? []
      let maxSeq = 0
      setRows(items.map(item => {
        if (item.seqNo > maxSeq) maxSeq = item.seqNo
        return { ...item, checked: item.seqNo > 0, seqInput: item.seqNo > 0 ? item.seqNo.toString() : '' }
      }))
      setSeqCounter(maxSeq)
      if (items.length === 0) setMsg({ text:'No Records Found.', ok:false })
    } catch { setMsg({ text:'Failed to load groups.', ok:false }) }
    finally { setLoading(false) }
  }

  const handleSetSeq = (menuID, checked) => {
    setRows(prev => {
      let counter = seqCounter
      const updated = prev.map(r => {
        if (r.menuID !== menuID) return r
        if (checked) { counter++; return { ...r, checked: true, seqInput: counter.toString() } }
        return { ...r, checked: false, seqInput: '' }
      })
      if (!checked) {
        const target = prev.find(r => r.menuID === menuID)
        const removed = parseInt(target?.seqInput) || 0
        counter = Math.max(0, counter - 1)
        updated.forEach(r => { if (r.checked && parseInt(r.seqInput) > removed) r.seqInput = (parseInt(r.seqInput)-1).toString() })
      }
      setSeqCounter(counter)
      return [...updated]
    })
  }

  const handleIsActive = (menuID, val) =>
    setRows(prev => prev.map(r => r.menuID===menuID ? {...r,isActive:val} : r))

  const handleReset = () => { setRows(prev => prev.map(r => ({...r,checked:false,seqInput:''}))); setSeqCounter(0) }

  const handleSave = async () => {
    setSaving(true); setMsg({ text:'', ok:true })
    try {
      const res = await menuApi.reorderMenus({ items: rows.map(r => ({ menuID:r.menuID, seqNo:r.seqInput.trim()!==''?parseInt(r.seqInput):0, isActive:r.isActive })) })
      if (res.data.success) { setMsg({ text:'Data Saved Successfully.', ok:true }); loadGroups() }
      else setMsg({ text: res.data.message||'Failed.', ok:false })
    } catch { setMsg({ text:'An error occurred.', ok:false }) }
    finally { setSaving(false) }
  }

  const thS = { padding:'10px 12px', color:'#fff', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', borderRight:'1px solid rgba(255,255,255,.1)', whiteSpace:'nowrap' }
  const tdS = { padding:'8px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', textAlign:'center', verticalAlign:'middle' }

  return (
    <div style={{ fontFamily:'inherit', background:'#f1f5f9', minHeight:'100vh', padding:24 }}>
      <PageHeader title="Manage Groups" />
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', padding:24 }}>

        <MenuTopNav active="Manage Groups" />

        {msg.text && (
          <div style={{ background:msg.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.ok?'#86efac':'#fecaca'}`, color:msg.ok?'#166534':'#dc2626', borderRadius:7, padding:'9px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <i className={`fas ${msg.ok?'fa-check-circle':'fa-exclamation-circle'}`}/>{msg.text}
            <button onClick={()=>setMsg({text:'',ok:true})} style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'inherit' }}>×</button>
          </div>
        )}

        {/* UserType dropdown — centered */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:5 }}>User Type <span style={{ color:'#dc2626' }}>*</span></label>
            <select value={userTypeId} onChange={e => { setUserTypeId(e.target.value); setRows([]) }}
              style={{ padding:'7px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', minWidth:220 }}>
              {USER_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        {/* Add New Group */}
        {userTypeId !== '-1' && (
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <button onClick={() => navigate(`/admin/menu/add-edit?MenuID=0&UserTypeID=${userTypeId}&ParentMenuID=0`)}
              style={{ background:'#059669', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7, boxShadow:'0 3px 10px rgba(5,150,105,.3)' }}>
              <i className="fas fa-plus"/>Add New Group
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : rows.length > 0 && (
          <>
            <div style={{ overflowX:'auto', marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#14212e' }}>
                    <th style={{ ...thS, width:'5%' }}>Action</th>
                    <th style={{ ...thS, width:'39%', textAlign:'left' }}>Group Name</th>
                    <th style={{ ...thS, width:'17%' }}>Display Start Date Time</th>
                    <th style={{ ...thS, width:'17%' }}>Display End Date Time</th>
                    <th style={{ ...thS, width:'8%' }}>Is Active</th>
                    <th style={{ ...thS, width:'7%' }}>Set Seq</th>
                    <th style={{ ...thS, width:'7%', borderRight:'none' }}>Seq No</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.menuID} style={{ background:row.checked?'#d4edda':idx%2===0?'#fff':'#f9f9f9' }}>
                      <td style={tdS}>
                        <button onClick={() => navigate(`/admin/menu/add-edit?MenuID=${row.menuID}&UserTypeID=${userTypeId}&ParentMenuID=0`)}
                          style={{ background:'transparent', border:'none', cursor:'pointer', color:'#059669', fontSize:18, padding:0 }} title="Edit">
                          <i className="fa fa-edit"/>
                        </button>
                      </td>
                      <td style={{ ...tdS, textAlign:'left', fontWeight:500, color:'#0f172a' }}>{row.linkName}</td>
                      <td style={tdS}>{row.displayStartDateTime || '—'}</td>
                      <td style={tdS}>{row.displayEndDateTime || '—'}</td>
                      <td style={tdS}>
                        <input type="checkbox" checked={row.isActive} onChange={e=>handleIsActive(row.menuID,e.target.checked)}
                          style={{ width:16, height:16, cursor:'pointer', accentColor:'#059669' }}/>
                      </td>
                      <td style={tdS}>
                        <input type="checkbox" checked={row.checked} onChange={e=>handleSetSeq(row.menuID,e.target.checked)}
                          style={{ width:16, height:16, cursor:'pointer', accentColor:'#059669' }}/>
                      </td>
                      <td style={tdS}>
                        <input type="text" value={row.seqInput} disabled={!row.checked}
                          onChange={e=>setRows(prev=>prev.map(r=>r.menuID===row.menuID?{...r,seqInput:e.target.value}:r))}
                          style={{ width:52, textAlign:'center', padding:'4px 6px', border:'1px solid #dee2e6', borderRadius:5, fontSize:13, background:row.checked?'#fff':'#f8fafc', cursor:row.checked?'text':'not-allowed' }}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign:'center' }}>
              <button onClick={handleReset}
                style={{ background:'#dc2626', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', marginRight:16 }}>
                Reset Groups
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ background:saving?'#d1fae5':'#059669', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
                {saving?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving...</>:<>Save Groups</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
