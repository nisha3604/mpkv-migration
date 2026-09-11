import { Link, useLocation } from 'react-router-dom'

/**
 * AdminBreadcrumb — auto-generates breadcrumb from the current URL path.
 *
 * Usage:  <AdminBreadcrumb extra={[{ label: 'Edit', to: null }]} />
 *
 * Props:
 *   extra  (array)  — optional additional crumbs appended after the auto-crumbs
 *                     each item: { label: string, to: string | null }
 *                     to=null means it renders as plain text (current page)
 */

// Map of path segments → human-readable labels
const SEGMENT_LABELS = {
  admin:                    'Admin',
  dashboard:                'Dashboard',
  // College
  college:                  'College',
  list:                     'College List',
  passwords:                'College Passwords',
  'reset-password':         'Reset Password',
  summary:                  'Summary',
  edit:                     'Edit Details',
  // Candidate
  'search-candidate':       'Search Candidate',
  'reset-candidate-password': 'Reset Candidate Password',
  'doc-status':             'Document Verification Status',
  // Users
  users:                    'Manage Users',
  add:                      'Add New',
  // Phases
  phases:                   'Manage Phases',
  // Activity & Schedule
  'activity-status':        'Activity Status',
  'admission-schedule':     'Admission Schedule',
  // Notifications
  notifications:            'Notifications',
  // Menu
  menu:                     'Menu Management',
  menus:                    'Manage Menus',
  groups:                   'Manage Groups',
  links:                    'Manage Links',
  'add-edit':               'Add / Edit Menu',
  'add-edit-link':          'Add / Edit Link',
  // Config
  config:                   'Project Configuration',
  // Reports
  reports:                  'Reports',
  builder:                  'Report Builder',
  run:                      'Run Report',
  // EVC
  evc:                      'EVC Management',
  'sub-evc':                'Sub-EVC Management',
  // Utilities
  'app-settings':           'App Settings',
  // Misc
  'admission-schedule':     'Admission Schedule',
}

function toLabel(segment) {
  return SEGMENT_LABELS[segment] ?? segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function AdminBreadcrumb({ extra = [] }) {
  const { pathname } = useLocation()

  // Build crumbs from path segments, skipping empty/UUIDs/numeric IDs
  const segments = pathname.split('/').filter(Boolean)

  // Build cumulative paths
  const autoCrumbs = segments.map((seg, idx) => ({
    label: toLabel(seg),
    to:    '/' + segments.slice(0, idx + 1).join('/'),
  }))

  // Merge auto + extra; the last crumb is always plain text (no link)
  const all = [...autoCrumbs, ...extra]

  if (all.length <= 1) return null   // no breadcrumb needed on top-level pages

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {all.map((crumb, idx) => {
        const isLast = idx === all.length - 1
        return (
          <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {idx > 0 && (
              <i className="fas fa-chevron-right" style={{ fontSize: 9, color: '#94a3b8' }} />
            )}
            {isLast || !crumb.to ? (
              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: isLast ? 600 : 400 }}>
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to}
                style={{ fontSize: 13, color: '#059669', textDecoration: 'none', fontWeight: 400 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/**
 * AdminPageHeader — drop-in page header used at the top of every admin page.
 *
 * Usage:
 *   <AdminPageHeader
 *     title="Manage Users"
 *     subtitle="Add, edit and activate admin accounts"
 *     icon="fa-users-cog"
 *     iconColor="#7c3aed"
 *     actions={<button>+ Add User</button>}
 *   />
 *
 * Props:
 *   title       (string, required)
 *   subtitle    (string)
 *   icon        (string)   — FontAwesome icon class e.g. 'fa-users-cog'
 *   iconColor   (string)   — hex color for the icon bg tint
 *   actions     (node)     — right-side action buttons
 *   extra       (array)    — forwarded to AdminBreadcrumb as extra crumbs
 */
export function AdminPageHeader({ title, subtitle, icon = 'fa-circle', iconColor = '#059669', actions, extra = [] }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
      {/* Breadcrumb row */}
      <div style={{ marginBottom: 10 }}>
        <AdminBreadcrumb extra={extra} />
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: iconColor + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className={`fas ${icon}`} style={{ color: iconColor, fontSize: 17 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
