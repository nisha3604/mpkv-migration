# MPKV Migration — Task Sheet
**Project:** Mpkv_diploma (ASP.NET WebForms) → mpkv-migration (React + Tailwind + .NET Core)
**DB:** localhost\SQLEXPRESS → 2026_MPKV_Rahuri_Test (same DB, same SPs)
**Last Updated:** August 2026

---

## LEGEND
- ✅ Done
- 🔄 In Progress / Partial
- ⬜ Not Started
- ❌ Blocked

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
| 1.10 | Google Translate EN↔Marathi (cookie-based reload) | ✅ | |
| 1.11 | Azure Blob upload helper | ✅ | No local fallback by design |

---

## PHASE 2 — PUBLIC / HOME PAGES ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Home.jsx — marquee, notifications, news, downloads tabs, popup | ✅ | All from DB via homeApi |
| 2.2 | PublicLayout.jsx with SiteHeader + SiteFooter | ✅ | |
| 2.3 | SearchCollege page | ✅ | |
| 2.4 | AllotmentList page (public) | ✅ | |
| 2.5 | Disclaimer, TermsAndConditions, PrivacyPolicy, RefundCancellation | ✅ | |
| 2.6 | Login page (unified all roles) | ✅ | |

---

## PHASE 3 — CANDIDATE PORTAL ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | CandidateNavbar.jsx (dynamic lock-aware menu) | ✅ | Hardcoded; isFormLocked from API |
| 3.2 | Candidate Dashboard | ✅ | Previous login time, progress bar |
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
| 4.1 | CollegeLayout.jsx (navbar, dropdown menus) | ✅ | Hardcoded menus |
| 4.2 | College Dashboard | ✅ | |
| 4.3 | Check Allotment Status (college) | ✅ | |
| 4.4 | Confirm Admission — CheckApplicationID search | ✅ | Fixed `userLoginId=''` JWT claim bug |
| 4.5 | Confirm Admission — AdmissionSummary (doc verify, accept/reject, confirm) | ✅ | Full view-doc modal, upload modal |
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

## PHASE 5 — ADMIN PANEL (Current / In Progress) 🔄

### 5A — Already Built

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Admin Dashboard (basic — 3 links) | ✅ | Needs expansion |
| 5.2 | College List (search, filter, export) | ✅ | |
| 5.3 | College Passwords list | ✅ | |
| 5.4 | Reset College Password | ✅ | |
| 5.5 | Candidate Search (SearchCandidate) | ⬜ | Old: Admin/SearchCandidate.aspx |
| 5.6 | Reset Candidate Password | ⬜ | Old: Admin/ResetCandidatePassword.aspx |

### 5B — DB-Driven Navigation (Major Change)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.7 | Backend: `Menu_GetMenu` SP endpoint (`GET /api/menu`) | ⬜ | SP already exists in DB |
| 5.8 | CandidateNavbar — replace hardcoded menus with API-driven | ⬜ | Fetch from Menu_GetMenu SP |
| 5.9 | CollegeLayout navbar — replace hardcoded menus with API-driven | ⬜ | |
| 5.10 | Admin superadmin menu management UI (add/edit/delete menu items) | ⬜ | |
| 5.11 | Menu scheduling — hide/show items based on activity dates | ⬜ | |

### 5C — Notifications & Home Page Content Management

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.12 | Manage Notifications (CRUD — category, title EN+MR, dates, file/text content) | ⬜ | SP: Administration_SaveNotification (18 params) |
| 5.13 | Notification categories management | ⬜ | Master_NotificationCategory |
| 5.14 | Bilingual content (English + Marathi) for notifications | ⬜ | |
| 5.15 | File upload to Azure Blob for notification attachments | ⬜ | Container: `notifications` |
| 5.16 | Home page live refresh after notification save/delete | ⬜ | Old: Global.Notification reload |

### 5D — Activity Status (Scheduling)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.17 | Manage Activity Status — view all activities with open/close dates | ⬜ | SP: Administration_GetActivityStatusList |
| 5.18 | Edit activity window (start/end datetime) | ⬜ | SP: Administration_SaveActivityStatusDetails |
| 5.19 | Manage Admission Activity Status (per phase) | ⬜ | SP: Administration_GetAdmissionActivityStatusList |
| 5.20 | Edit admission phase dates (AllotmentDisplayStart, AdmissionStart, etc.) | ⬜ | SP: Administration_SaveAdmissionActivityStatusDetails |

### 5E — Phase Management

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.21 | Manage Phases — list all phases | ⬜ | SP: AdmissionWorker.GetPhaseList |
| 5.22 | Add / Edit / Delete phase | ⬜ | PhaseEntity: name, dates, IsCurrentPhase, IsCounsellingPhase, IsActive |
| 5.23 | Set current phase flag | ⬜ | Controls which round is active for confirm admission |

### 5F — User Management

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.24 | Manage Users — list by UserType (admin types only; not college 61, candidate 91) | ⬜ | SP: Administration_GetUsersList |
| 5.25 | Add / Edit admin user | ⬜ | SP: Administration_SaveUser / Administration_EditUser |
| 5.26 | Activate / Deactivate user | ⬜ | SP: Administration_ActivateOrDeactivateUser |
| 5.27 | Send login credentials via SMS | ⬜ | Mirrors old SMS send on row command |
| 5.28 | Generate college passwords (bulk) | ⬜ | SP: AccountWorker.UpdateUserPassword loop |
| 5.29 | Edit own profile (admin) | ⬜ | Administration_EditUser (self) |

### 5G — Project Configuration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.30 | Project Configuration list (key-value pairs from DB) | ⬜ | SP: Administration_GetProjectConfigurationList |
| 5.31 | Edit individual config value (dropdown or text control) | ⬜ | SP: Administration_SaveProjectConfigurationDetails |
| 5.32 | Reset application variables (force reload cached data) | ⬜ | Old: ResetApplicationVariables.aspx |

### 5H — Custom Reports Builder

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.33 | Report list (stored SQL queries) | ⬜ | SP: Administration_GetReportList |
| 5.34 | Add / Edit / Delete report (SQL query editor with keyword blocking) | ⬜ | Blocked: INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, TRUNCATE + DB list |
| 5.35 | Execute report + show results grid | ⬜ | SP: Administration_ExecuteReport |
| 5.36 | Export report results to Excel | ⬜ | |
| 5.37 | DB table/view browser (for query building) | ⬜ | SP: Administration_GetTableViewList, Administration_GetColumnList |

### 5I — EVC Management

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.38 | EVC list management (activate/deactivate) | ⬜ | UserTypeID 11 and 21 only |
| 5.39 | EVC detail form (add/edit) | ⬜ | |
| 5.40 | SubEVC list + detail form | ⬜ | |

### 5J — Admin Utilities

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.41 | Check Document Verification Status (for any candidate) | ⬜ | Admin/CheckDocumentVerificationStatus.aspx |
| 5.42 | Admin Candidate Search (by AppID / Name / Mobile / Email) | ⬜ | Admin/SearchCandidate.aspx |
| 5.43 | Check App Settings (only UserTypeID 11) | ⬜ | Shows all config keys — security sensitive |

---

## PHASE 6 — BUGS FIXED (Log)

| Date | Bug | Fix Applied |
|------|-----|-------------|
| Aug 2026 | `useAuth is not defined` in Home.jsx | Added `import { useAuth } from '../../context/AuthContext'` |
| Aug 2026 | `userLoginId=''` in all controllers — SP filtering broken | Changed `JwtRegisteredClaimNames.UniqueName` → `ClaimTypes.Name` in 10 controllers + AuthService |
| Aug 2026 | `CertificateTypeID DBNull error` on Sports page (No selection) | Changed `DBNull.Value` → `(short)0` in SaveSportsDetails |
| Aug 2026 | `getFlag()` in CheckApplicationID: `cancel` matched before `cancellation-letter` | Reordered checks — specific strings first |
| Aug 2026 | Print letter pages showing navbar/footer in print | Used `letter-page-root` CSS visibility trick |
| Aug 2026 | `AdmissionSummary` showing "not allotted" for cancellation/rejection letter | Fixed `reportingStatus` switch — all 5 flags now map correctly |
| Aug 2026 | Duplicate `UpdateStatus` call in SaveSportsDetails | SP already calls UpdateStatus internally — removed extra call from service |

---

## PHASE 7 — KNOWN ISSUES / TODO

| # | Issue | Priority |
|---|-------|----------|
| 7.1 | Navbars (candidate + college) are hardcoded — must be DB-driven from Menu_GetMenu SP | HIGH |
| 7.2 | No notifications/news management in admin — home page content is static | HIGH |
| 7.3 | Activity windows are not enforced in new project (form filling open/close dates) | HIGH |
| 7.4 | No phase management — current phase is read from DB but cannot be changed via UI | HIGH |
| 7.5 | Admin dashboard only has 3 items vs old project's 20+ admin pages | HIGH |
| 7.6 | `ACADEMIC_YEAR` is hardcoded as `'2025-26'` in letter pages — should come from DB config | MEDIUM |
| 7.7 | Composite Admission Report phases 6–10 had copy-paste bug in old project (hardcoded PhaseID=5) | LOW |
| 7.8 | ManageReports SQL query builder: need to enforce SELECT-only on backend | MEDIUM |

---

## DATABASE REFERENCE

| Table / SP Prefix | Purpose |
|-------------------|---------|
| `Administration_*` | All superadmin operations |
| `Master_ActivityStatus` | Activity open/close windows |
| `Master_Phase` | Admission rounds |
| `Master_NotificationCategory` | Notification types |
| `Master_Notification` | All notifications/news/downloads |
| `Master_Menu` / `Menu_*` | Dynamic navigation |
| `Master_User` / `Account_*` | All user accounts |
| `ApplicationForm_*` | Candidate form SPs |
| `College_*` | College management SPs |
| `Admission_*` | Admission workflow SPs |
| `Report_*` | College report SPs |
