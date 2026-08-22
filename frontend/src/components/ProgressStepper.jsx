import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Application Progress Stepper
 *
 * Sub-page dot colours:
 *   green  = that sub-page is done (SP returned true)
 *   orange = first incomplete sub-page in the currently active round (you are here)
 *   grey   = not yet reached
 *
 * "Proceed to fill application form" on Dashboard navigates to the orange page.
 */
export default function ProgressStepper({ progress }) {
  if (!progress) return null

  // ── Sub-page lists with real done flags from SP ───────────────────────────
  const round2Pages = [
    { label: 'Personal Info',          done: !!progress.personalDetails,      route: '/candidate/personal'      },
    { label: 'Address',                done: !!progress.addressDetails,        route: '/candidate/address'       },
    { label: 'Category & Reservation', done: !!progress.categoryDetails,       route: '/candidate/category'      },
    { label: 'Qualification',          done: !!progress.qualificationDetails,  route: '/candidate/qualification' },
    { label: 'Sports Details',         done: !!progress.sportsDetails,         route: '/candidate/sports'        },
  ]

  const round3Pages = [
    { label: 'Shortlist Options', done: !!progress.shortlistOptions, route: '/candidate/shortlist'    },
    { label: 'Set Preferences',   done: !!progress.setPreferences,   route: '/candidate/preferences'  },
  ]

  const round4Pages = [
    { label: 'Photo & Signature',  done: !!progress.photoAndSign,      route: '/candidate/photo-sign' },
    { label: 'Required Documents', done: !!progress.requiredDocuments,  route: '/candidate/documents'  },
  ]

  // Assign green / orange / grey to each sub-page
  // orange = first NOT-done page in an active group
  const assignStatus = (pages, groupIsActive) => {
    let orangeGiven = false
    return pages.map(p => {
      if (p.done) return { ...p, status: 'green' }
      if (groupIsActive && !orangeGiven) {
        orangeGiven = true
        return { ...p, status: 'orange' }   // ← current page you are on
      }
      return { ...p, status: 'grey' }
    })
  }

  // A round is "active" if its predecessor round is complete but it itself isn't yet complete
  const round2Active = !progress.personalInfo   // registration done, filling form
  const round3Active = !!progress.personalInfo  && !progress.collegeSelection
  const round4Active = !!progress.collegeSelection && !progress.documentUpload

  const r2 = assignStatus(round2Pages, round2Active || (!progress.personalInfo))
  const r3 = assignStatus(round3Pages, round3Active)
  const r4 = assignStatus(round4Pages, round4Active)

  // Main step states
  const stepState = (done, active) => done ? 'done' : active ? 'active' : 'pending'

  const steps = [
    {
      number: 1,
      label:  'Registration',
      state:  'done',
      dropdownTitle: null,
      pages: []
    },
    {
      number: 2,
      label:  'Personal info',
      state:  stepState(
        progress.personalInfo,
        !progress.personalInfo
      ),
      dropdownTitle: 'Application Form Pages',
      pages: r2
    },
    {
      number: 3,
      label:  ['College', 'selection &', 'preference'],
      state:  stepState(
        progress.collegeSelection,
        !!progress.personalInfo && !progress.collegeSelection
      ),
      dropdownTitle: 'College Preference Pages',
      pages: r3
    },
    {
      number: 4,
      label:  ['Upload', 'documents'],
      state:  stepState(
        progress.documentUpload,
        !!progress.collegeSelection && !progress.documentUpload
      ),
      dropdownTitle: 'Document Pages',
      pages: r4
    },
    {
      number: 5,
      label:  'Fee payment',
      state:  stepState(
        progress.feePayment,
        !!progress.documentUpload && !progress.feePayment
      ),
      dropdownTitle: null,
      pages: []
    },
    {
      number: 6,
      label:  'Lock form',
      state:  stepState(
        progress.formLocked,
        !!progress.feePayment && !progress.formLocked
      ),
      dropdownTitle: null,
      pages: []
    },
  ]

  return (
    <div className="rounded-xl overflow-visible border border-gray-200 mb-4 shadow-sm">

      {/* Dark header */}
      <div className="bg-gray-900 px-5 py-3.5 rounded-t-xl flex items-center gap-2.5">
        <i className="fas fa-list text-gray-400 text-sm" />
        <span className="text-white font-semibold text-sm tracking-wide">Application Progress</span>
      </div>

      {/* Stepper body */}
      <div className="bg-white rounded-b-xl px-3 py-7">
        <div className="relative flex items-start justify-between w-full">

          {/* Connector line */}
          <div
            className="absolute top-[22px] h-0.5 bg-gray-200 z-0"
            style={{ left: 'calc(100%/12)', right: 'calc(100%/12)' }}
          />

          {steps.map((step, idx) => (
            <StepItem key={idx} step={step} />
          ))}

        </div>
      </div>
    </div>
  )
}

// ── Individual Step ───────────────────────────────────────────────────────────
function StepItem({ step }) {
  const [hovered, setHovered] = useState(false)
  const hasDropdown = step.pages.length > 0

  const circleClass = {
    done:    'bg-emerald-500 text-white border-0',
    active:  'bg-amber-400 text-white border-0',
    pending: 'bg-white text-gray-400 border-2 border-gray-200',
  }[step.state]

  const labelLines = Array.isArray(step.label) ? step.label : [step.label]

  return (
    <div className="flex flex-col items-center flex-1 relative z-10">

      <div
        className="relative"
        onMouseEnter={() => hasDropdown && setHovered(true)}
        onMouseLeave={() => hasDropdown && setHovered(false)}
      >
        {/* Circle */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base cursor-${hasDropdown ? 'pointer' : 'default'} ${circleClass}`}>
          {step.state === 'done'
            ? <i className="fas fa-check text-sm" />
            : step.number
          }
        </div>

        {/* Hover dropdown */}
        {hasDropdown && hovered && (
          <StepDropdown title={step.dropdownTitle} pages={step.pages} />
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center text-[11px] text-gray-500 leading-snug max-w-[80px]">
        {labelLines.map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </div>

    </div>
  )
}

// ── Dropdown popup ────────────────────────────────────────────────────────────
function StepDropdown({ title, pages }) {
  const navigate = useNavigate()

  return (
    <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2
                    bg-white border border-gray-200 rounded-lg shadow-xl
                    min-w-[220px] z-50 py-2 whitespace-nowrap">

      {/* Arrow */}
      <div className="absolute -top-[7px] left-1/2 -translate-x-1/2
                      border-l-[7px] border-r-[7px] border-b-[7px]
                      border-l-transparent border-r-transparent border-b-gray-200" />
      <div className="absolute -top-[6px] left-1/2 -translate-x-1/2
                      border-l-[6px] border-r-[6px] border-b-[6px]
                      border-l-transparent border-r-transparent border-b-white" />

      {/* Header */}
      {title && (
        <div className="px-3.5 pb-2 pt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
          {title}
        </div>
      )}

      {/* Page rows — clickable, navigate to that page */}
      {pages.map((page, i) => (
        <div
          key={i}
          onClick={() => navigate(page.route)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <DotIcon status={page.status} />
          <span className={`text-[13px] ${page.status === 'orange' ? 'font-semibold text-amber-600' : 'text-gray-700'}`}>
            {page.label}
          </span>
          {/* "current" badge on orange */}
          {page.status === 'orange' && (
            <span className="ml-auto text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              current
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Status dot icon ───────────────────────────────────────────────────────────
function DotIcon({ status }) {
  if (status === 'green') {
    return (
      <span className="w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <i className="fas fa-check text-white" style={{ fontSize: '9px' }} />
      </span>
    )
  }
  if (status === 'orange') {
    return (
      <span className="w-[18px] h-[18px] rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
        <i className="fas fa-circle text-white" style={{ fontSize: '7px' }} />
      </span>
    )
  }
  // grey
  return (
    <span className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white flex-shrink-0" />
  )
}
