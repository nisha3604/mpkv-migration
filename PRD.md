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
    AuthController.cs
    ApplicationFormController.cs
    AllotmentController.cs
    CheckApplicationIDController.cs
    CollegeController.cs
    CollegeAdminController.cs
    ReportController.cs
    DashboardController.cs
    HomeController.cs
    AccountRecoveryController.cs
    FeeController.cs
    CounsellingController.cs
    UserProfileController.cs
  Services/
    AuthService.cs
    ApplicationFormService.cs
    AllotmentService.cs
    CheckApplicationIDService.cs
    CollegeService.cs
    ReportService.cs
    DashboardService.cs
    HomeService.cs
    AccountRecoveryService.cs
    FeeService.cs
    CounsellingService.cs
  Data/
    DbAccess.cs        ← Dapper wrapper (GetDataTable, GetDataSet, ExecuteScalar, ExecuteNonQuery)
  Models/
    Auth/, Candidate/, College/  ← request/response models per domain
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

### Sprint 1 — DB-Driven Navigation (High Impact, Enables Everything Else)
1. Backend: `GET /api/menu` endpoint calling `Menu_GetMenu(@RegionID, @UserTypeID, @UserLoginID)`
2. Frontend: `CandidateNavbar.jsx` — replace hardcoded menus with API fetch
3. Frontend: `CollegeLayout.jsx` — replace hardcoded menus with API fetch
4. Admin UI: Manage Menu Items (CRUD — add/edit/delete, set SeqNo, ParentMenuID, LinkURL)

### Sprint 2 — Notifications & Home Content
1. Backend: `/api/admin/notifications` CRUD
2. Frontend: ManageNotifications page (admin)
3. After save → invalidate Home page notification cache
4. Azure Blob upload for notification files

### Sprint 3 — Activity Scheduling
1. Backend: `/api/admin/activity-status` + `/api/admin/admission-activity-status`
2. Frontend: ManageActivityStatus page + ManageAdmissionActivityStatus page
3. Enforce activity windows in ApplicationForm steps on candidate side

### Sprint 4 — Phase Management
1. Backend: `/api/admin/phases` CRUD
2. Frontend: ManagePhase page
3. `AcademicYear` from DB config (remove hardcoded `'2025-26'` in letter pages)

### Sprint 5 — User Management
1. Backend: `/api/admin/users` CRUD + activate/deactivate + send SMS
2. Frontend: ManageUsers + AddEditUsers pages
3. Bulk college password generation

### Sprint 6 — Project Config + Reports Builder
1. Backend: `/api/admin/config` + `/api/admin/reports`
2. Frontend: ManageProjectConfiguration + ManageReports pages
3. SQL keyword blocking on backend

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
