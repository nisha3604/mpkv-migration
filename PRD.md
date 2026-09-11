# Product Requirements Document (PRD)
## MPKV Diploma Admission Portal — React Migration
**Version:** 1.0  
**Date:** August 2026  
**Stack:** React 18 + Tailwind CSS (frontend) · .NET 8 Web API + Dapper (backend) · SQL Server (same DB as old project)

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
Migrate the existing ASP.NET WebForms application (Mpkv_diploma) to a modern React + .NET Core stack while keeping all functionality, all stored procedures, and the same SQL Server database. No data migration required — the DB schema, all SPs, and all existing data remain unchanged.

### 1.2 User Roles
| UserTypeID | Role | Dashboard Path |
|---|---|---|
| 91 | Candidate | /candidate/dashboard |
| 61 | College | /college/dashboard |
| 11 | Superadmin | /admin/dashboard |
| 12 | Admin | /admin/dashboard |

### 1.3 Tech Decisions Made
- JWT tokens replace ASP.NET Session — `ClaimTypes.Name` stores `UserLoginID` (not `JwtRegisteredClaimNames.UniqueName` which gets remapped by middleware)
- Azure Blob for all file uploads — no local fallback
- Dapper for all DB calls — no EF
- Camel-case JSON responses (`JsonNamingPolicy.CamelCase`)
- Google Translate cookie-based reload (`googtrans=/en/mr`) for EN↔Marathi
- `window.print()` + `visibility:hidden` trick to print letters without navbar

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Public Module (No Login)

#### 2.1.1 Home Page
- **Marquee** — scrolling ticker from `Master_Notification` where `NotificationCategoryID = 1`
- **Notifications tab** — `NotificationCategoryID = 3`
- **News tab** — `NotificationCategoryID = 2`
- **Downloads tab** — `NotificationCategoryID = 4`
- **Popup modal** — `NotificationCategoryID = 11`, shown once per session
- **Login / Register buttons** — shown only when `IsRegistrationOpen = true` from `Home_GetHomeDetails` SP
- **Dynamic nav menu** — from `Menu_GetMenu` SP (RegionID, UserTypeID=0)
- **Language toggle** — EN / Marathi cookie-based

#### 2.1.2 Search College
- Filter by District, Course — SP: `Home_SearchCollege`

#### 2.1.3 Allotment List (Public)
- Phase selector + course filter
- SP: `Home_GetAllotmentList`

#### 2.1.4 Static Pages
- Disclaimer, Terms & Conditions, Privacy Policy, Refund & Cancellation

---

### 2.2 Candidate Module (UserTypeID = 91)

#### 2.2.1 Dashboard
- Progress bar — SP: `Dashboard_GetApplicationProgress`
- Previous login time from `Account_GetLoggedInUserDetails`
- Navigation to all form steps

#### 2.2.2 Application Form (10 steps)
Each step: load existing → validate → save → SP updates `ApplicationForm_Status`

| Step | SP Save | SP Load |
|------|---------|---------|
| Personal Details | `ApplicationForm_SavePersonalDetails` | `ApplicationForm_GetPersonalDetails` |
| Address Details | `ApplicationForm_SaveAddressDetails` | `ApplicationForm_GetAddressDetails` |
| Category & Reservation | `ApplicationForm_SaveCategoryDetails` | `ApplicationForm_GetCategoryDetails` |
| Qualification | `ApplicationForm_SaveQualificationDetails` | `ApplicationForm_GetQualificationDetails` |
| Sports Details | `ApplicationForm_SaveSportsDetails` (`@CertificateTypeID SMALLINT` not nullable — pass `0` when No) | `ApplicationForm_GetSportsDetails` |
| Shortlist Colleges | `ApplicationForm_SaveOption` | `ApplicationForm_GetAvailableOptionsList` |
| Set Preferences | `ApplicationForm_SavePreferenceDetails` (XML) | `ApplicationForm_GetPreferancedOptionsList` |
| Photo & Signature | Azure Blob upload | `ApplicationForm_GetPhotoAndSignDetails` |
| Upload Documents | `ApplicationForm_SaveRequiredDocumentUploadStatus` | `ApplicationForm_GetRequiredDocumentsList` |
| Pay Application Fee | Payment gateway initiate → `ApplicationForm_SaveFeeDetails` | `ApplicationForm_GetFeeDetails` |

#### 2.2.3 Lock / Unlock Form
- Lock: `ApplicationForm_LockApplicationForm`
- Unlock: `ApplicationForm_UnlockApplicationForm`
- After lock: Application Form menu shows only Print + Unlock

#### 2.2.4 Allotment / Admission
- Check Allotment Status — SP: `Admission_CheckAllotmentStatus`
- Allotment Summary — SP: `Admission_GetAllotmentSummary`
- Pay Category Conversion Fee — SP: `Admission_InitiateCategoryConversionFee`

#### 2.2.5 Miscellaneous
- Change Password — `Account_ChangePassword`
- Change Mobile/Email — `Account_ChangeMobileNo` / `Account_ChangeEmailId`
- Change Security Question — `Account_ChangeSecurityQuestion`
- Payment History — `Account_GetPaymentHistory`

---

### 2.3 College Module (UserTypeID = 61)

#### 2.3.1 Dashboard
- Last login time, college details summary

#### 2.3.2 Admission Menu
All flows follow: SearchCandidate (CheckApplicationID) → Summary/Detail page

| Flow | SP (Search) | SP (Detail) | SP (Action) |
|------|-------------|-------------|-------------|
| Confirm Admission | `Admission_GetReportingDetails` (flag=ConfirmAdmission, RS=N) | `Admission_GetAdmissionSummary` | `Admission_ConfirmAdmission` |
| Cancel Admission | `Admission_GetReportingDetails` (flag=CancelAdmission, RS=Y) | `Admission_GetAdmissionSummary` | `Admission_CancelAdmission` |
| Print Admission Letter | `Admission_GetReportingDetails` (flag=PrintAdmissionLetter, RS=Y) | `Admission_GetAdmissionSummary` | n/a (print) |
| Print Cancellation Letter | `Admission_GetReportingDetails` (flag=PrintAdmissionCancellationLetter, RS=C) | `Admission_GetAdmissionSummary` | n/a (print) |
| Print Rejection Letter | `Admission_GetReportingDetails` (flag=PrintAdmissionRejectionLetter, RS=R) | `Admission_GetAdmissionSummary` | n/a (print) |
| Check Allotment Status | `Admission_GetAllotmentStatusForCollege` | - | - |

**Document verification flow** (Confirm Admission page):
- Upload: `ApplicationForm_SaveRequiredDocumentUploadStatus` (college eligible — fnCheckApplicationFormFillingEligiblity returns IsEligible=1 for type 61)
- View doc: full-screen modal with iframe + candidate info + Accept/Reject buttons
- Accept → verify dropdown = Y | Reject → requires comment → dropdown = N
- Verify dropdown is **DISABLED** on screen — only changed via view modal
- Confirm validates all docs = Y before calling SP

**Letter pages** (print-only):
- Undertaking By Candidate (6 clauses — Admission)
- Declaration by Institute (5 clauses — Admission; 2 clauses — Cancellation/Rejection)
- Undertaking & Acknowledgement by Candidate (3 clauses — Cancellation/Rejection)
- Footer: Printed By/On + Reported/Cancelled/Rejected By/On

#### 2.3.3 Spot Round Menu
- Offer Seat (Counselling) — SP: `Counselling_GetEligibilityFlagForCounselling`

#### 2.3.4 Reports Menu
- Allotment Report By Course → drill-down on each count
  - SP summary: `Report_GetAllotmentReportByCourse(@CollegeID, @PhaseID)`
  - SP detail: `Report_GetAllotmentReport(@CollegeID, @PhaseID, @Flag)` — Flags: Allotment, AllotmentRefused, AllotmentLetterDownloaded, Admitted, Rejected, Cancelled
- Composite Admission Report → drill-down by phase
  - SP summary: `Report_GetCompositeAdmissionReportByCourse(@CollegeID)` → DataSet: Tables[0]=MaxActivePhaseID, Tables[1]=data
  - SP detail: `Report_GetCompositeAdmissionReport(@CollegeID, @PhaseID)` — phaseId=0 means all phases
- Candidates Eligible for Counselling — SP: `Report_GetCandidatesEligibleForCounselling(@CourseID)`
- All reports: Export to Excel (browser-side XLS generation)

#### 2.3.5 Miscellaneous
- Update Profile — `College_SaveCollegeDetails`
- Change Password / Security Question — same pages as candidate

---

### 2.4 Superadmin / Admin Module (UserTypeID = 11 / 12) 🔴 NEXT PHASE

#### 2.4.1 Admin Dashboard
**Current:** 3 links (College List, Passwords, Reset Password)  
**Required:** Full CRM dashboard with counts, quick-access to all modules

#### 2.4.2 Navigation — DB-Driven (Critical Change)
**Current state:** Candidate navbar + College navbar are **hardcoded** in JSX  
**Required:**
- All menus (candidate, college, admin, public) driven by `Menu_GetMenu(@RegionID, @UserTypeID, @UserLoginID)` SP
- Admin can add/edit/delete menu items, set order (SeqNo), parent/child hierarchy, LinkURL, Target, IsActive
- Menu changes reflect immediately for all users
- SP returns: MenuID, ParentMenuID, LinkName, LinkURL, SeqNo, Target, IsActive

#### 2.4.3 Notifications & Home Content
**SPs:** `Administration_SaveNotification`, `Administration_GetNotificationList`, `Administration_GetNotificationDetails`, `Administration_DeleteNotification`

Fields required:
- NotificationCategoryID (Marquee=1, News=2, Notifications=3, Downloads=4, Popup=11)
- NotificationTitle (English) + NotificationTitleMarathi
- DisplayStartDateTime / DisplayEndDateTime / PublishDateTime
- ContentType: `F` (File — upload to Azure Blob `notifications` container) or `T` (Text — rich text) or none
- DisplayNewImage (show "NEW" badge)
- IsActive, OpenInNewPage

After save/delete → home page updates in real-time (invalidate API cache)

#### 2.4.4 Activity Status Management
Controls when each feature is open/closed for candidates.

**SP:** `Administration_GetActivityStatusList(@RegionID)`, `Administration_SaveActivityStatusDetails`

Activities managed:
- Registration / ApplicationFormFilling
- FeePayment
- ShortListOptions / SetPreferences
- UploadPhotoAndSign / UploadRequiredDocuments

Date fields: ActivityStartDateTime, ActivityEndDateTime

#### 2.4.5 Admission Activity Status (Per Phase)
**SP:** `Administration_GetAdmissionActivityStatusList`, `Administration_SaveAdmissionActivityStatusDetails`

Per-phase fields: AllotmentDisplayStartDate, AdmissionStartDate, CandidateAdmissionLastDate, CollegeAdmissionLastDate, SystemAdmissionLastDate, IsCurrentPhase, IsActive

#### 2.4.6 Phase Management
**SPs:** `AdmissionWorker.GetPhaseList/SavePhase/DeletePhase/GetPhaseDetails`

Fields: PhaseName, AllotmentDisplayStartDate, AdmissionStartDate, CandidateAdmissionLastDate, CollegeAdmissionLastDate, SystemAdmissionLastDate, IsCurrentPhase, IsCounsellingPhase, IsActive

#### 2.4.7 User Management (Non-College/Non-Candidate)
**SPs:** `Administration_GetUsersList`, `Administration_SaveUser`, `Administration_EditUser`, `Administration_ActivateOrDeactivateUser`

- Filter by UserType (only admin types — UserTypeID not 0, 61, 91)
- Admin type 12 cannot manage type 11 or 12
- Auto-generate 8-char password on Add
- Send Login ID + Password via SMS on demand
- Activate / Deactivate toggle
- Export to Excel

#### 2.4.8 College Management (Admin View)
- List all colleges (search by course, district, code, name)
- View college details + edit (admin can change all fields including CollegeCode, CollegeName)
- Activate / Deactivate college
- Generate passwords (bulk — Base64 encrypt existing or generate new)
- View password list (decoded)
- Reset individual college password

#### 2.4.9 Candidate Utilities
- Search candidate (by AppID / Name / Mobile / Email)
- Reset candidate password (admin override)
- Check document verification status
- View candidate application form

#### 2.4.10 Project Configuration
**SPs:** `Administration_GetProjectConfigurationList`, `Administration_GetProjectConfigurationDetails`, `Administration_SaveProjectConfigurationDetails`

Key-value pairs stored in DB. Examples:
- AcademicYear (used in letter pages — currently hardcoded as `'2025-26'`)
- RegionID
- IsRegistrationOpen
- DisplayTFW (TFW column in letters)
- FileProject (Azure Blob container prefix)

#### 2.4.11 Custom Reports Builder
- List of saved SQL reports
- Add/Edit/Delete (SELECT only — block INSERT/UPDATE/DELETE/CREATE/ALTER/DROP/TRUNCATE + DB keyword list)
- Execute report → show result grid
- Export to Excel
- DB Table/View browser for query building
- **SPs:** `Administration_GetReportList`, `Administration_SaveReport`, `Administration_DeleteReport`, `Administration_ExecuteReport`, `Administration_GetTableViewList`, `Administration_GetColumnList`

#### 2.4.12 EVC Management
- EVC list (Activate/Deactivate) — UserTypeID 11 + 21 only
- EVC detail form (add/edit)
- SubEVC list + detail form

#### 2.4.13 App Settings Viewer
- View all configuration keys/values — UserTypeID 11 only
- **Note:** Security sensitive — do NOT expose connection strings in response; show masked values

---

## 3. NON-FUNCTIONAL REQUIREMENTS

### 3.1 Security
- JWT expiry: 8 hours (configurable via `Jwt:ExpiryHours`)
- All endpoints: `[Authorize]` — unauthenticated → 401
- Role enforcement: `[Forbid]` — wrong role → 403
- No `ClaimTypes.NameIdentifier` for login ID — always use `ClaimTypes.Name` (JWT middleware remaps `unique_name`)
- College user cannot modify: CollegeCode, CollegeName, DistrictID, CourseID, CourseStatusID, Intake, HasManagementQuota
- Admin type 12 cannot manage type 11

### 3.2 SP Compatibility
- All new backend methods call the same SPs as the old ASP.NET project
- SP parameter types must match exactly (e.g. `SMALLINT` → `(short)` in C#, not `int`)
- `DBNull.Value` cannot be passed to non-nullable SP parameters — always pass default values (0, empty string, etc.)

### 3.3 Printing
- Letter pages must print without navbar/header/footer
- Use `letter-page-root` CSS class + `visibility:hidden` trick (not `display:none` — needed for layout calculations)
- `window.print()` triggers browser print dialog

### 3.4 File Upload
- Azure Blob Storage — credentials from `appsettings.json`
- Containers: `notifications` (public), `documents` (candidate docs), `photos` (photo/sign)
- Max sizes enforced per type (photo: 200KB, sign: 100KB, documents: varies by doc)

### 3.5 Bilingual Support
- All notification/news content stored with English + Marathi versions
- Google Translate cookie (`googtrans=/en/mr`) handles UI translation
- Admin can enter bilingual content for notifications

### 3.6 Export
- All grids: Export to Excel via browser-side XLS blob generation (no server-side Excel)
- Format: `.xls` with `application/vnd.ms-excel` MIME type

---

## 4. ARCHITECTURE

### 4.1 Frontend
```
src/
  pages/
    common/     ← public pages (Home, Login, SearchCollege, etc.)
    candidate/  ← candidate portal (Dashboard, form steps, etc.)
    college/    ← college portal (admission, reports, etc.)
    admin/      ← admin panel (college mgmt, notifications, etc.)
  components/
    SiteHeader.jsx     ← shared university header
    SiteFooter.jsx     ← shared footer
    CandidateNavbar.jsx ← candidate layout wrapper [TODO: DB-driven]
    CollegeLayout.jsx  ← college layout wrapper [TODO: DB-driven]
    PublicLayout.jsx   ← public pages layout
  context/
    AuthContext.jsx    ← JWT + user state
  services/
    api.js             ← all Axios API calls
  pages/college/
    letterShared.jsx   ← shared print letter components
```

### 4.2 Backend
```
Mpkv.Api/
  Controllers/
    AuthController.cs          ✅
    ApplicationFormController.cs ✅
    AllotmentController.cs     ✅
    CheckApplicationIDController.cs ✅
    CollegeController.cs       ✅
    CollegeAdminController.cs  ✅
    ReportController.cs        ✅
    DashboardController.cs     ✅
    HomeController.cs          ✅
    AccountRecoveryController.cs ✅
    FeeController.cs           ✅
    CounsellingController.cs   ✅
    UserProfileController.cs   ✅
    MenuController.cs          ✅ (Sprint 1)
    NotificationController.cs  ✅ (Sprint 2)
    ActivityStatusController.cs ✅ (Sprint 3)
    FileProxyController.cs     ✅ (document preview)
    PhaseController.cs         🔴 TODO Sprint 4
  Services/
    AuthService.cs             ✅
    ApplicationFormService.cs  ✅
    AllotmentService.cs        ✅
    CheckApplicationIDService.cs ✅
    CollegeService.cs          ✅
    ReportService.cs           ✅
    DashboardService.cs        ✅
    HomeService.cs             ✅
    AccountRecoveryService.cs  ✅
    FeeService.cs              ✅
    CounsellingService.cs      ✅
    MenuService.cs             ✅ (Sprint 1)
    NotificationService.cs     ✅ (Sprint 2)
    ActivityStatusService.cs   ✅ (Sprint 3)
    CollegeDashboardService.cs ✅
    PhaseService.cs            🔴 TODO Sprint 4
  Data/
    DbAccess.cs        ← Dapper wrapper (GetDataTable, GetDataSet, ExecuteScalar, ExecuteNonQuery)
  Models/
    Auth/, Candidate/, College/, Admin/ ← request/response models per domain
  Helpers/
    UserTypeHelper.cs
    PasswordHelper.cs
```

### 4.3 Key API Routes
```
POST /api/auth/login
GET  /api/auth/me

GET  /api/home/details
GET  /api/home/notifications
GET  /api/home/allotment-list/masters

GET  /api/applicationform/personal
POST /api/applicationform/personal
... (all 10 form steps)
POST /api/applicationform/summary/lock
POST /api/applicationform/unlock

GET  /api/admission/phases
POST /api/admission/check-application-id
POST /api/admission/admission-summary
POST /api/admission/confirm
POST /api/admission/reject
POST /api/admission/cancel-action
POST /api/admission/upload-document
POST /api/admission/allotment-status
GET  /api/admission/allotment-summary

GET  /api/reports/phases
GET  /api/reports/allotment-by-course
GET  /api/reports/allotment-detail
GET  /api/reports/composite-by-course
GET  /api/reports/composite-detail
GET  /api/reports/eligible-for-counselling

GET  /api/admin/college/list
GET  /api/admin/college/passwords
POST /api/admin/college/reset-password

[NEXT PHASE — Admin]
GET  /api/menu                    ← DB-driven navigation
GET  /api/admin/notifications
POST /api/admin/notifications
DELETE /api/admin/notifications/:id
GET  /api/admin/activity-status
POST /api/admin/activity-status
GET  /api/admin/phases
POST /api/admin/phases
GET  /api/admin/users
POST /api/admin/users
GET  /api/admin/config
POST /api/admin/config
GET  /api/admin/reports
POST /api/admin/reports/execute
```

---

## 5. SPRINT PLAN (Next Steps)

### ✅ Sprint 1 — DB-Driven Navigation — COMPLETE
1. ✅ Backend: `GET /api/menu` endpoint — `MenuController.cs` exists
2. ✅ Frontend: `CollegeLayout.jsx` — DB-driven from `Menu_GetMenu` SP
3. ✅ Admin UI: ManageMenus, ManageGroups, ManageLinks, AddEditMenu, AddEditLink, MenuHome pages built
4. ⚠️ `CandidateNavbar.jsx` — still hardcoded (lower priority, candidate menus are stable)

### ✅ Sprint 2 — Notifications & Home Content — COMPLETE
1. ✅ Backend: `NotificationController.cs` + `NotificationService.cs` with full CRUD
2. ✅ Frontend: `ManageNotifications.jsx` + `AddEditNotification.jsx` built
3. ✅ Azure Blob upload for notification files

### ✅ Sprint 3 — Activity Scheduling — COMPLETE
1. ✅ Backend: `ActivityStatusController.cs` + `ActivityStatusService.cs` + `ActivityStatusModels.cs`
2. ✅ Frontend: `ManageActivityStatus.jsx` (modal popup, OPEN/CLOSED toggle, toast)
3. ✅ Frontend: `ManageAdmissionSchedule.jsx` (per-phase date windows)
4. ✅ Both routes in `App.jsx`
5. ⚠️ Activity window enforcement on candidate side — not yet enforced in backend

### ✅ Sprint 4 — Phase Management — COMPLETE
1. ✅ `PhaseModels.cs` — `PhaseItem`, `SavePhaseRequest`, `SavePhaseResponse`, `DeletePhaseResponse`
2. ✅ `PhaseService.cs` — `GetList`, `GetDetails`, `Save`, `Delete` with all 4 SPs
3. ✅ `PhaseController.cs` — 4 endpoints at `/api/admin/phases`
4. ✅ `phaseApi` in `api.js` — `getList`, `getDetails`, `save`, `delete`
5. ✅ `ManagePhase.jsx` — table list, Add/Edit modal, Delete confirm, Toast
6. ✅ `/admin/phases` route in `App.jsx`
7. ⚠️ Remove hardcoded `'2025-26'` AcademicYear — deferred to Sprint 6 (Project Config)

### 🔴 Sprint 5 — User Management — NEXT
1. Backend: `PhaseController.cs` — `/api/admin/phases` CRUD endpoints
2. Backend: `PhaseService.cs` + `PhaseModels.cs`
3. Frontend: `ManagePhase.jsx` — list phases, add/edit/delete
4. `AcademicYear` from DB config (remove hardcoded `'2025-26'` in letter pages)
5. Add `/admin/phases` route to `App.jsx`

### ✅ Sprint 5 — User Management — COMPLETE
1. ✅ `UserModels.cs` — all request/response models
2. ✅ `UserManagementService.cs` — GetUserTypes, GetUserList, GetUserDetails, SaveUser (add/edit), ToggleActive, SendSms
3. ✅ `UserManagementController.cs` — 7 endpoints at `/api/admin/users/*`
4. ✅ `userMgmtApi` in `api.js`
5. ✅ `ManageUsers.jsx` — user type dropdown, grid with all actions, Add/Edit modal, Export to Excel, Toast
6. ✅ `/admin/users` route in `App.jsx` + URL mapped in `menuUrlMap.js`

### ✅ Sprint 6 — Project Config + Reports Builder — COMPLETE
1. ✅ `ProjectConfigModels.cs` + `ProjectConfigService.cs` + `ProjectConfigController.cs`
2. ✅ `ManageProjectConfig.jsx` — grid + inline edit (TextBox/Dropdown per config type)
3. ✅ `ReportBuilderService.cs` + `ReportBuilderController.cs` — full CRUD + execute + keyword blocking
4. ✅ `ManageReports.jsx` — report form, column browser, execute result grid, Excel export
5. ✅ `configApi` + `reportBuilderApi` in `api.js`
6. ✅ Routes `/admin/config` + `/admin/reports` + menuUrlMap entries

### ✅ Sprint 7 — Candidate Utilities — COMPLETE
1. ✅ `CandidateUtilsModels.cs` — all models
2. ✅ `CandidateUtilsService.cs` — Search, GetPasswordInfo, ResetPassword, GetDocVerificationStatus
3. ✅ `CandidateUtilsController.cs` — 4 endpoints at `/api/admin/candidates/*`
4. ✅ `candidateUtilsApi` in `api.js`
5. ✅ `SearchCandidate.jsx` — 4 search types, read-only grid
6. ✅ `ResetCandidatePassword.jsx` — search + show current password + reset form
7. ✅ `CheckDocVerificationStatus.jsx` — search + document grid + inline PDF preview
8. ✅ Routes + menuUrlMap for all 3 pages

### ⏳ Backlog (remaining)

### Sprint 7 — Candidate Utilities + EVC
1. Search Candidate admin page
2. Reset Candidate Password (admin)
3. Check Document Verification Status
4. EVC + SubEVC management

---

## 6. OPEN DECISIONS

| # | Question | Current State | Decision Needed |
|---|----------|---------------|-----------------|
| 6.1 | Should `AcademicYear` come from DB config or `.env`? | Hardcoded `'2025-26'` | Use DB `Administration_GetProjectConfigurationDetails` |
| 6.2 | Should Menu_GetMenu be cached server-side or fetched fresh on every login? | Not implemented | Recommend: cache per UserTypeID in memory, invalidate on menu save |
| 6.3 | Should Activity window enforcement be frontend-only or backend-enforced? | Not implemented | Recommend: backend enforced (SP already does it via `fnCheckApplicationFormFillingEligiblity`) |
| 6.4 | EVC management needed in this project? | Not in new project | Confirm with stakeholder |
| 6.5 | Custom SQL report builder — expose to admin 12 or only admin 11? | Old: both 11 and 12 | Confirm |
| 6.6 | Check App Settings page — should masked connection strings be shown? | Old: shows everything | Recommend: show only non-sensitive keys |


---

## 7. TASK TRACKER

> Last updated: September 2026

### ✅ COMPLETED

| # | Task | Sprint | Notes |
|---|------|--------|-------|
| 1 | `MenuController.cs` + `MenuService.cs` — `GET /api/menu` | 1 | DB-driven nav from `Menu_GetMenu` SP |
| 2 | `CollegeLayout.jsx` — DB-driven navbar | 1 | Replaced hardcoded menus |
| 3 | `ManageMenus.jsx`, `ManageGroups.jsx`, `ManageLinks.jsx` | 1 | Admin menu CRUD |
| 4 | `AddEditMenu.jsx`, `AddEditLink.jsx`, `MenuHome.jsx` | 1 | Admin menu add/edit forms |
| 5 | `NotificationController.cs` + `NotificationService.cs` | 2 | Full CRUD + Azure Blob upload |
| 6 | `ManageNotifications.jsx` + `AddEditNotification.jsx` | 2 | Admin notification management |
| 7 | `ActivityStatusController.cs` + `ActivityStatusService.cs` | 3 | 6 endpoints for activity + admission |
| 8 | `ActivityStatusModels.cs` | 3 | All request/response models |
| 9 | `ManageActivityStatus.jsx` | 3 | Modal popup, OPEN/CLOSED toggle, toast |
| 10 | `ManageAdmissionSchedule.jsx` | 3 | Per-phase admission date windows |
| 11 | `FileProxyController.cs` | — | PDF inline preview (no download) |
| 12 | `CollegeDashboardService.cs` — CollegeName on dashboard | — | College name shown in hero banner |
| 13 | `AuthService.cs` — LastLoginDateTime captured at login | — | Previous login time stored in JWT |
| 14 | `PublicLayout.jsx` — hide New Registration when closed | — | Reads `registrationApi.checkStatus()` |
| 15 | `AdmissionSummary.jsx` — document preview with proxy | — | PDF shown inline in modal |
| 16 | `ManageActivityStatus.jsx` — toast notifications | — | Fixed top-right toast, auto-dismiss |
| 17 | Routes in `App.jsx` — all admin routes registered | 1–3 | `/admin/activity-status`, `/admin/admission-schedule`, `/admin/menu/*`, `/admin/notifications/*` |
| 18 | `PhaseModels.cs` | 4 | `PhaseItem`, `SavePhaseRequest`, `SavePhaseResponse`, `DeletePhaseResponse` |
| 19 | `PhaseService.cs` | 4 | `GetList`, `GetDetails`, `Save`, `Delete` — SPs: `Administration_GetPhaseList/Details/SavePhase/DeletePhase` |
| 20 | `PhaseController.cs` | 4 | 4 endpoints at `GET/POST/DELETE /api/admin/phases` |
| 21 | `phaseApi` in `api.js` | 4 | `getList`, `getDetails`, `save`, `delete` |
| 22 | `ManagePhase.jsx` | 4 | Table list, Add/Edit modal, Delete confirm, Toast |
| 23 | `/admin/phases` route in `App.jsx` | 4 | Protected [11,12] |
| 24 | `UserModels.cs` | 5 | `UserItem`, `UserListResponse`, `SaveUserRequest`, all response models |
| 25 | `UserManagementService.cs` | 5 | GetUserTypes, GetUserList, GetUserDetails, SaveUser, ToggleActive, SendSms |
| 26 | `UserManagementController.cs` | 5 | 7 endpoints at `/api/admin/users/*` |
| 27 | `userMgmtApi` in `api.js` | 5 | getTypes, getList, getDetails, add, edit, toggle, sendSms |
| 28 | `ManageUsers.jsx` | 5 | User type dropdown, grid, Add/Edit modal, Export Excel, Toast |
| 29 | `/admin/users` route + menuUrlMap | 5 | App.jsx + menuUrlMap.js |
| 30 | `ProjectConfigModels.cs` | 6 | `ConfigItem`, `SaveConfigRequest`, `SaveConfigResponse`, all report models |
| 31 | `ProjectConfigService.cs` + `ProjectConfigController.cs` | 6 | GET/POST `/api/admin/config` |
| 32 | `ReportBuilderService.cs` + `ReportBuilderController.cs` | 6 | CRUD + execute + keyword blocking |
| 33 | `ManageProjectConfig.jsx` | 6 | Grid + inline edit (TextBox/Dropdown) |
| 34 | `ManageReports.jsx` | 6 | Form + column browser + execute grid + Excel export |
| 35 | `configApi` + `reportBuilderApi` in `api.js` | 6 | All methods |
| 36 | Routes `/admin/config` + `/admin/reports` | 6 | App.jsx + menuUrlMap.js |

---

### 🔴 IN PROGRESS / NEXT

| # | Task | Sprint | Details |
|---|------|--------|---------|
| 41 | `CandidateUtilsModels.cs` | 7 | Search result, reset password, doc verification models |
| 42 | `CandidateUtilsService.cs` | 7 | SearchCandidate, ResetCandidatePassword, GetDocVerificationStatus |
| 43 | `CandidateUtilsController.cs` | 7 | `GET /api/admin/candidates/search`, `POST /api/admin/candidates/{id}/reset-password`, `GET /api/admin/candidates/{id}/doc-status` |
| 44 | `candidateUtilsApi` in `api.js` | 7 | `search`, `resetPassword`, `getDocStatus` |
| 45 | `SearchCandidate.jsx` | 7 | Search by AppID/Name/Mobile/Email → read-only grid |
| 46 | `ResetCandidatePassword.jsx` | 7 | AppID lookup → show current password → new/confirm → save |
| 47 | `CheckDocVerificationStatus.jsx` | 7 | AppID lookup → document grid (read-only) with View |
| 48 | Routes + menuUrlMap for all 3 pages | 7 | `/admin/candidates/*` |

---

### ⏳ UPCOMING

| Sprint | Tasks |
|--------|-------|
| Sprint 5 | `ManageUsers.jsx` — list, add, edit, activate/deactivate, send SMS. Backend: `UserController.cs` |
| Sprint 5 | Bulk college password generation page |
| Sprint 6 | `ManageProjectConfiguration.jsx` — key-value config editor |
| Sprint 6 | `ManageReports.jsx` — custom SQL report builder with Excel export |
| Sprint 7 | Search Candidate, Reset Candidate Password, Check Document Verification Status admin pages |
| Sprint 7 | EVC + SubEVC management (confirm with stakeholder first — see Open Decision 6.4) |
| Backlog | `CandidateNavbar.jsx` — DB-driven (low priority, menus are stable) |
| Backlog | Activity window enforcement on candidate backend (SP `fnCheckApplicationFormFillingEligiblity`) |
| Backlog | Admin Dashboard — full CRM stats (Registered/Locked/Verified counts per course) |
