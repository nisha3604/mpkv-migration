# MPKV Migration — Task Sheet
**Project:** Mpkv_diploma (ASP.NET WebForms) → mpkv-migration (React + Tailwind + .NET Core)
**DB:** localhost\SQLEXPRESS → 2026_MPKV_Rahuri_Test (same DB, same SPs)
**Last Updated:** September 2026

---

## LEGEND
- ✅ Done
- 🔄 In Progress / Partial
- ⬜ Not Started
- ❌ Blocked

---

## COMPLETION SUMMARY

| Portal | Done | Remaining |
|--------|------|-----------|
| Phase 1 — Infrastructure | ✅ Complete | — |
| Phase 2 — Public Pages | ✅ Complete | — |
| Phase 3 — Candidate Portal | ✅ Complete | — |
| Phase 4 — College Portal | ✅ Complete | — |
| **Phase 5 — Superadmin Panel** | 🔄 ~60% | Phase Mgmt, EVC, App Settings, Dashboard expansion |
| Phase 6 — Bug Fixes (log) | ✅ Ongoing | — |

---

## PHASE 1 — PROJECT SETUP & SHARED INFRASTRUCTURE ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | .NET Core 8 Web API project scaffold | ✅ | Mpkv.Api |
| 1.2 | React + Vite + Tailwind CSS frontend scaffold | ✅ | |
| 1.3 | Dapper + SQL Server connection (DbAccess.cs) | ✅ | |
| 1.4 | JWT authentication (AuthService, AuthController) | ✅ | Fixed `ClaimTypes.Name` vs `UniqueName` bug |
| 1.5 | Unified login for all roles (candidate 91, college 61, admin 11/12) | ✅ | |
| 1.6 | Role-based routing in React (ProtectedRoute / C() helper) | ✅ | |
| 1.7 | AuthContext + localStorage token/user storage | ✅ | |
| 1.8 | SiteHeader.jsx (university logo + name, shared) | ✅ | |
| 1.9 | SiteFooter.jsx (contact, links, helpdesk, shared) | ✅ | |
| 1.10 | Google Translate EN↔Marathi (cookie-based reload) | ✅ | All layouts persist language via localStorage |
| 1.11 | Azure Blob upload helper | ✅ | No local fallback by design |

---

## PHASE 2 — PUBLIC / HOME PAGES ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Home.jsx — marquee, notifications, news, downloads tabs, popup | ✅ | All from DB via homeApi |
| 2.2 | PublicLayout.jsx with SiteHeader + SiteFooter | ✅ | Hides New Registration when closed |
| 2.3 | SearchCollege page | ✅ | |
| 2.4 | AllotmentList page (public) | ✅ | |
| 2.5 | Disclaimer, TermsAndConditions, PrivacyPolicy, RefundCancellation | ✅ | |
| 2.6 | Login page (unified all roles) | ✅ | Redirects to dashboard if already logged in |

---

## PHASE 3 — CANDIDATE PORTAL ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | CandidateNavbar.jsx (dynamic lock-aware menu) | ✅ | Hardcoded; isFormLocked from API; Sign Out button |
| 3.2 | Candidate Dashboard | ✅ | Previous login time from JWT, progress stepper |
| 3.3 | Personal Details page | ✅ | |
| 3.4 | Address Details page | ✅ | |
| 3.5 | Category & Other Reservation Details | ✅ | |
| 3.6 | Qualification Details page | ✅ | |
| 3.7 | Sports Details page | ✅ | Fixed DBNull CertificateTypeID bug |
| 3.8 | Shortlist Colleges page | ✅ | |
| 3.9 | Set Preferences page | ✅ | |
| 3.10 | Upload Photo & Signature | ✅ | Azure Blob |
| 3.11 | Upload Required Documents | ✅ | Azure Blob |
| 3.12 | Pay Application Fee (initiate + status) | ✅ | |
| 3.13 | Application Form Summary + Lock Form | ✅ | |
| 3.14 | Unlock Form | ✅ | |
| 3.15 | Print Application Form | ✅ | |
| 3.16 | Payment History | ✅ | |
| 3.17 | Payment Receipt | ✅ | |
| 3.18 | Check Allotment Status | ✅ | |
| 3.19 | Check Allotment Summary | ✅ | |
| 3.20 | Pay Category Conversion Fee | ✅ | |
| 3.21 | Change Password (candidate) | ✅ | |
| 3.22 | Change Mobile / E-Mail (candidate) | ✅ | |
| 3.23 | Change Security Question (candidate) | ✅ | |

---

## PHASE 4 — COLLEGE PORTAL ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | CollegeLayout.jsx (navbar, dropdown menus) | ✅ | DB-driven from Menu_GetMenu SP |
| 4.2 | College Dashboard | ✅ | Shows college name, previous login time |
| 4.3 | Check Allotment Status (college) | ✅ | College restriction fixed via numeric CollegeID |
| 4.4 | Confirm Admission — CheckApplicationID search | ✅ | CollegeCode lookup fix |
| 4.5 | Confirm Admission — AdmissionSummary (doc verify, accept/reject, confirm) | ✅ | Full view-doc modal, PDF proxy viewer |
| 4.6 | Cancel Admission (CheckApplicationID + AdmissionSummary) | ✅ | |
| 4.7 | Print Admission Letter | ✅ | AdmissionLetter.jsx |
| 4.8 | Print Admission Cancellation Letter | ✅ | AdmissionCancellationLetter.jsx |
| 4.9 | Print Admission Rejection Letter | ✅ | AdmissionRejectionLetter.jsx |
| 4.10 | Allotment Report By Course | ✅ | Clickable counts → drill-down |
| 4.11 | Allotment Detail (drill-down list) | ✅ | AllotmentDetail.jsx |
| 4.12 | Composite Admission Report By Course | ✅ | Phase-based columns |
| 4.13 | Composite Detail (drill-down list) | ✅ | CompositeDetail.jsx |
| 4.14 | List of Candidates Eligible for Counselling | ✅ | DOB fix, export fix |
| 4.15 | College Summary / Update Profile | ✅ | |
| 4.16 | Spot Round — Offer Seat (CounsellingCheckApplicationID) | ✅ | |
| 4.17 | Miscellaneous — Change Password (college) | ✅ | Reuses candidate page |
| 4.18 | Miscellaneous — Change Security Question (college) | ✅ | |

---

## PHASE 5 — SUPERADMIN PANEL 🔄

> **Build order: complete all ✅ sections first, then work top-to-bottom through ⬜ sections.**

---

### 5A — Layout & Navigation ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5A.1 | Admin uses CollegeLayout (DB-driven navbar via Menu_GetMenu) | ✅ | UserTypeID 11/12 get admin menu from DB |
| 5A.2 | menuUrlMap.js — all admin .aspx URLs mapped to React routes | ✅ | Fixed SearchCandidate + ResetCandidatePassword URL mappings |
| 5A.3 | All admin routes wired in App.jsx using CollegeLayout | ✅ | Users, Config, Reports, Candidates, Menu, Notifications, Activity all wired |

---

### 5B — College Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5B.1 | College List (search, filter, export) | ✅ | CollegeList.jsx — `/admin/college/list` |
| 5B.2 | College Passwords list | ✅ | CollegePasswords.jsx — `/admin/college/passwords` |
| 5B.3 | Reset College Password | ✅ | ResetCollegePassword.jsx — `/admin/college/reset-password` |
| 5B.4 | View/Edit College Details (admin side) | ✅ | Reuses college Summary + Edit pages |
| 5B.5 | Generate College Passwords (bulk) | ✅ | Send SMS button wired — `POST /api/admin/college/send-password-sms` → `Base_GetEMailSMS` + `SendSmsAsync` |

---

### 5C — Candidate Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5C.1 | Backend: CandidateUtilsService + Controller + Models | ✅ | `GET /api/admin/candidates/*` |
| 5C.2 | Frontend: candidateUtilsApi in api.js | ✅ | search, getPasswordInfo, resetPassword, getDocStatus |
| 5C.3 | Search Candidate (by AppID / Name / Mobile / Email) | ✅ | SearchCandidate.jsx — `/admin/candidates/search` |
| 5C.4 | Reset Candidate Password | ✅ | ResetCandidatePassword.jsx — `/admin/candidates/reset-password` |
| 5C.5 | Check Document Verification Status | ✅ | CheckDocVerificationStatus.jsx — `/admin/candidates/doc-status` |
| 5C.6 | App.jsx routes wired | ✅ | All 3 candidate utility routes registered |
| 5C.7 | View Candidate Application (read-only admin drill-down) | ✅ | Click App ID in SearchCandidate → `/admin/candidates/view/:candidateId` → `CandidateApplicationView.jsx` |
| 5C.8 | Unlock Candidate Form (admin override) | ✅ | `POST /api/admin/candidates/{appId}/unlock` → `ApplicationForm_UnlockForm` SP — amber button + confirm modal on CandidateApplicationView |

---

### 5D — Admin User Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5D.1 | Backend: UserModels + UserManagementService + Controller | ✅ | 7 endpoints — get types, list, details, add, edit, toggle, send SMS |
| 5D.2 | Backend: Register UserManagementService in DI | ✅ | |
| 5D.3 | Frontend: userMgmtApi in api.js | ✅ | getTypes, getList, getDetails, add, edit, toggle, sendSms |
| 5D.4 | Frontend: ManageUsers.jsx | ✅ | User type dropdown, grid, add/edit modal, toggle, send SMS, export Excel |
| 5D.5 | App.jsx: `/admin/users` wired | ✅ | |

---

### 5E — Activity Status & Admission Schedule ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5E.1 | Backend: ActivityStatusService + Controller + Models | ✅ | All 6 SPs, DI registered |
| 5E.2 | Frontend: activityApi in api.js | ✅ | |
| 5E.3 | Frontend: ManageActivityStatus.jsx | ✅ | Modal popup, OPEN/CLOSED toggle, toast |
| 5E.4 | Frontend: ManageAdmissionSchedule.jsx | ✅ | Per-phase inline editing |
| 5E.5 | App.jsx routes wired | ✅ | |

---

### 5F — Notifications ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5F.1 | Backend: NotificationModels + Service + Controller | ✅ | Full CRUD + Azure Blob |
| 5F.2 | Backend: Register NotificationService in DI | ✅ | |
| 5F.3 | Frontend: notificationApi in api.js | ✅ | |
| 5F.4 | Frontend: ManageNotifications.jsx | ✅ | Category tabs, status badges |
| 5F.5 | Frontend: AddEditNotification.jsx | ✅ | Card picker, file upload zone |
| 5F.6 | App.jsx routes wired | ✅ | |

---

### 5G — Menu Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5G.1 | Backend: Menu_GetMenu SP endpoint (`GET /api/menu`) | ✅ | MenuController + MenuService |
| 5G.2 | Backend: Menu models (MenuModels.cs) | ✅ | |
| 5G.3 | Frontend: menuApi in api.js | ✅ | |
| 5G.4 | Frontend: menuUrlMap.js — old ASP.NET URLs → React routes | ✅ | All admin URLs mapped and fixed |
| 5G.5 | Frontend: ManageMenus.jsx | ✅ | |
| 5G.6 | Frontend: ManageGroups.jsx, ManageLinks.jsx | ✅ | |
| 5G.7 | Frontend: AddEditMenu.jsx, AddEditLink.jsx | ✅ | |
| 5G.8 | Frontend: MenuHome.jsx | ✅ | |
| 5G.9 | App.jsx routes wired | ✅ | |

---

### 5H — Project Configuration ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5H.1 | Backend: ProjectConfigService + Controller + Models | ✅ | GET/POST `/api/admin/config` |
| 5H.2 | Backend: Register ProjectConfigService in DI | ✅ | |
| 5H.3 | Frontend: configApi in api.js | ✅ | getList, getDetails, save |
| 5H.4 | Frontend: ManageProjectConfig.jsx | ✅ | Grid + inline edit (TextBox or Dropdown per config type) |
| 5H.5 | App.jsx: `/admin/config` wired | ✅ | |

---

### 5I — Custom Reports Builder ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5I.1 | Backend: ReportBuilderService + Controller + Models | ✅ | CRUD + execute + keyword blocking |
| 5I.2 | Backend: Register ReportBuilderService in DI | ✅ | |
| 5I.3 | Frontend: reportBuilderApi in api.js | ✅ | |
| 5I.4 | Frontend: ManageReports.jsx | ✅ | Form + column browser + execute result grid + Excel export |
| 5I.5 | App.jsx: `/admin/reports` wired | ✅ | |

---

### 5J — Phase Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5J.1 | DB: Create missing SPs | ✅ | All 4 SPs created in DB |
| 5J.2 | Backend: PhaseModels.cs | ✅ | PhaseItem, SavePhaseRequest, SavePhaseResponse, DeletePhaseResponse |
| 5J.3 | Backend: PhaseService.cs + Controller | ✅ | GET list, GET details, POST save, DELETE — all 4 SPs called |
| 5J.4 | Backend: Register PhaseService in DI | ✅ | |
| 5J.5 | Frontend: phaseApi in api.js | ✅ | getList, getDetails, save, delete |
| 5J.6 | Frontend: ManagePhases.jsx | ✅ | List with IsCurrentPhase badge, Add/Edit modal with all date fields, Delete confirm modal |
| 5J.7 | App.jsx: `/admin/phases` wired + Dashboard tile added | ✅ | |

> **SPs used:** `Administration_GetPhaseList`, `Administration_GetPhaseDetails`, `Administration_SavePhase`, `Administration_DeletePhase`

---

### 5K — EVC Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5K.1 | Backend: EvcModels.cs | ✅ | EvcListItem, EvcDetail, SaveEvcRequest, SaveEvcResponse, ToggleEvcResponse |
| 5K.2 | Backend: EvcService.cs + Controller | ✅ | All 9 SPs — GetEVCList, GetEVCDetails, SaveEVCDetails, Activate/Deactivate EVC + SubEVC |
| 5K.3 | Backend: Register EvcService in DI | ✅ | `AddScoped<IEvcService, EvcService>()` in Program.cs |
| 5K.4 | Frontend: evcApi in api.js | ✅ | getList, getDetails, save, activate, deactivate + sub-evc equivalents |
| 5K.5 | Frontend: ManageEvc.jsx | ✅ | Grid + Add/Edit modal + Activate/Deactivate + Export to Excel |
| 5K.6 | Frontend: ManageSubEvc.jsx | ✅ | Parent EVC selector dropdown + Sub-EVC grid + Add/Edit modal + toggle |
| 5K.7 | App.jsx: `/admin/evc` and `/admin/sub-evc` wired | ✅ | |

---

### 5L — App Settings ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5L.1 | Backend: `AppSettingsController.cs` — reads `IConfiguration`, masks secrets, UserTypeID 11 only | ✅ | `GET /api/admin/app-settings` |
| 5L.2 | Frontend: `appSettingsApi` in `api.js` | ✅ | |
| 5L.3 | Frontend: `AppSettings.jsx` — read-only table, filter box, Export to Excel, masked values with lock icon | ✅ | |
| 5L.4 | App.jsx: `/admin/app-settings` wired (roles `[11]` only, not `[11,12]`) | ✅ | |

---

### 5M — Admin Dashboard Expansion ⬜

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5M.1 | Current dashboard (7 nav tiles) | ✅ | Basic working version |
| 5M.2 | Add tiles for: Users, Config, Reports, Candidates (search/reset/doc-status) | ✅ | 7 grouped sections, 17 tiles total — same design style |
| 5M.3 | Add tiles for: Phases, EVC (after those sections are built) | ✅ | EVC tile added when 5K was built; Phase tile added when 5J was built |
| 5M.4 | Add live stats row (total candidates, colleges, current phase, open activities) | ✅ | 6-column stats strip at top of dashboard — Registered, Locked, Fully Verified, Colleges, Admitted, Vacancy |

---

## PHASE 6 — BUGS FIXED (Log)

| Date | Bug | Fix Applied |
|------|-----|-------------|
| Aug 2026 | `useAuth is not defined` in Home.jsx | Added import |
| Aug 2026 | `userLoginId=''` in all controllers — SP filtering broken | Changed to `ClaimTypes.Name` |
| Aug 2026 | `CertificateTypeID DBNull error` on Sports page | Changed to `(short)0` |
| Aug 2026 | `getFlag()` in CheckApplicationID: cancel matched before cancellation-letter | Reordered checks |
| Aug 2026 | Print letter pages showing navbar/footer in print | Used `letter-page-root` CSS visibility trick |
| Aug 2026 | PDF documents downloading instead of previewing | Built `/api/file/preview` proxy controller with `Content-Disposition: inline` |
| Sep 2026 | College allotment status blocked — CollegeCode vs UserLoginID mismatch | Fixed with numeric CollegeID comparison |
| Sep 2026 | Home page "Home" nav link giving 404 | Added `resolveMenuUrl()` to map old .aspx URLs |
| Sep 2026 | Previous login time not showing on dashboards | Captured `LastLoginDateTime` from `Account_GetLoggedInUserDetails` AFTER `UpdateLoginStatus` |
| Sep 2026 | Language toggle not persisting on Home/Login pages | Added `localStorage` + `window.setLang` to PublicLayout and Home.jsx |
| Sep 2026 | Manage Phase SPs missing | Blocked — need 4 SPs created in DB first |
| Sep 2026 | SearchCandidate / ResetCandidatePassword showing 404 | Fixed wrong route in menuUrlMap.js (`/admin/candidate/` → `/admin/candidates/`) |

---

## REMAINING WORK — PRIORITY ORDER

| Priority | Task | Section | Effort |
|----------|------|---------|--------|
| 1 | ✅ Create Phase Management SPs in DB then build full UI | 5J | Done |
| 2 | ✅ Dashboard expansion — add tiles for all built pages | 5M.2 | Done |
| 3 | ✅ EVC Management (full backend + frontend) | 5K | Done |
| 4 | ✅ App Settings page (read-only, UserTypeID 11 only) | 5L | Done |
| 5 | ✅ Generate College Passwords bulk button | 5B.5 | Done |
| 6 | ✅ View Candidate Application drill-down (from search) | 5C.7 | Done |
| 7 | ✅ Unlock Candidate Form (admin override) | 5C.8 | Done |

---

## DATABASE REFERENCE

| Table / SP Prefix | Purpose |
|-------------------|---------|
| `Administration_*` | All superadmin operations |
| `Master_ActivityStatus` | Activity open/close windows |
| `Master_Phase` | Admission rounds |
| `Master_NotificationCategory` | Notification types |
| `Master_Notification` | All notifications/news/downloads |
| `Menu_*` | Dynamic navigation |
| `Master_User` / `Account_*` | All user accounts |
| `ApplicationForm_*` | Candidate form SPs |
| `College_*` | College management SPs |
| `Admission_*` | Admission workflow SPs |
| `Report_*` | College report SPs |
