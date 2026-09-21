/**
 * ResetApplicationVariables — mirrors Administration/ResetApplicationVariables.aspx
 *
 * Old project: cached master data (menus, dropdowns, notifications) in static
 * Global variables in ASP.NET application memory. This page forced a reload of
 * all those cached variables from the database.
 *
 * New project: No application-level cache exists. Every API call fetches data
 * directly from the database on each request. Nothing needs to be reset.
 *
 * This page is kept for menu compatibility only — it informs the admin accordingly.
 */
export default function ResetApplicationVariables() {
  const V = {
    navy: '#14212e', primary: '#059669', border: '#e2e8f0',
    bg: '#f1f5f9', white: '#fff', muted: '#64748b',
  }

  return (
    <div style={{ fontFamily: 'inherit', background: V.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: V.navy, borderRadius: '12px 12px 0 0', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-sync-alt" style={{ color: '#fff', fontSize: 17 }}/>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', margin: 0 }}>Administration</p>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 17, margin: 0 }}>Reset Application Variables</h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 36, textAlign: 'center' }}>

          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-check-circle" style={{ color: V.primary, fontSize: 28 }}/>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
            No Action Required
          </h3>

          <p style={{ fontSize: 14, color: V.muted, lineHeight: 1.8, margin: '0 0 24px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            In the previous system, master data (menus, dropdowns, notifications) was cached
            in server memory and needed to be manually refreshed when database changes were made.
          </p>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <i className="fas fa-info-circle" style={{ color: V.primary, fontSize: 16, marginTop: 2, flexShrink: 0 }}/>
              <p style={{ fontSize: 13, color: '#166534', margin: 0, lineHeight: 1.7 }}>
                The new system fetches all data <strong>directly from the database</strong> on every
                request — there is no in-memory cache. Changes made anywhere (notifications,
                menus, master data) are reflected <strong>immediately</strong> without any reset needed.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
