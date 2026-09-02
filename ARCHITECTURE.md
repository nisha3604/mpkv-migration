# MPKV Diploma Portal — Architecture Document

**Project:** Mpkv_diplomaNew  
**Purpose:** Online Agriculture Diploma / Polytechnic / Mali Certificate Admissions — 2026  
**University:** Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri  
**Stack:** React 18 + Vite (frontend) · ASP.NET Core Web API .NET 8 (backend) · SQL Server (database)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│                                                                   │
│  React 18 + Vite (localhost:5174)                                │
│  ├── PublicLayout    → Home, Search College, Allotment List      │
│  ├── CandidateLayout → All candidate pages (UserTypeID 91)       │
│  ├── CollegeLayout   → College + Admin pages (61, 11, 12)        │
│  └── Google Translate (EN ↔ Marathi, hidden widget)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS / Axios (proxied via Vite)
                      │ Bearer JWT in Authorization header
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              ASP.NET Core Web API (localhost:7002)               │
│                                                                   │
│  Middleware: ExceptionMiddleware → CORS → Auth → Authorization   │
│  14 Controllers  →  16 Services  →  DbAccess (Dapper)           │
│  JWT: HMAC-SHA256, 8h expiry                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Dapper + SqlClient
                      │ 100% Stored Procedures
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│         SQL Server — 2026_MPKV_Rahuri_Test                       │
│                                                                   │
│  ~50+ stored procedures                                          │
│  Tables: Master_User, College_AllotmentDetails,                  │
│          ApplicationForm_*, Fee_TransactionDetails, ...          │
└─────────────────────────────────────────────────────────────────┘
                      │
             Azure Blob Storage
             (documents, photos, signatures)
             Container: jceceb / 2026_mpkv_rahuri_uat
```

---

## 2. Project Structure

```
Mpkv_diplomaNew/
├── backend/
│   └── Mpkv.Api/
│       ├── Controllers/        (14 controllers)
│       ├── Services/           (16 service interfaces + implementations)
│       ├── Models/
│       │   ├── Auth/
│       │   ├── Candidate/
│       │   └── College/
│       ├── Data/
│       │   ├── DbAccess.cs     (Singleton — all SP calls)
│       │   └── DbConnectionFactory.cs
│       ├── Helpers/
│       │   ├── JwtHelper.cs
│       │   ├── PasswordHelper.cs
│       │   └── UserTypeHelper.cs
│       ├── Middleware/
│       │   └── ExceptionMiddleware.cs
│       ├── SQL/
│       │   └── College_GetCollegeSummary_Fix.sql
│       ├── appsettings.json
│       └── Program.cs
│
└── frontend/
    ├── index.html              (Google Translate, window.setLang)
    └── src/
        ├── App.jsx             (all routes + role guards)
        ├── context/
        │   └── AuthContext.jsx (auth state, localStorage)
        ├── services/
        │   └── api.js          (all API functions)
        ├── components/
        │   ├── CandidateLayout.jsx
        │   ├── CandidateNavbar.jsx
        │   ├── CollegeLayout.jsx
        │   ├── PublicLayout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── SiteHeader.jsx
        │   ├── SiteFooter.jsx
        │   └── ProgressStepper.jsx
        └── pages/
            ├── common/         (public pages)
            ├── candidate/      (UserTypeID 91)
            ├── admission/      (shared allotment pages)
            ├── college/        (UserTypeID 61)
            └── admin/          (UserTypeID 11, 12)
```

---

## 3. User Roles

| UserTypeID | Role | Dashboard Route | Description |
|---|---|---|---|
| 91 | Candidate | `/candidate/dashboard` | Students applying for admission |
| 61 | College | `/college/dashboard` | College staff confirming/rejecting admissions |
| 11 | Admin | `/admin/dashboard` | Full system access |
| 12 | Admin (alt) | `/admin/dashboard` | Same as Admin |
| 31 | Counselling | (spot round only) | Can offer seats in spot round |

Role resolution: `UserTypeHelper.cs`
```csharp
IsAdmin(typeId)     → typeId == 11 || typeId == 12
IsCollege(typeId)   → typeId == 61
IsCandidate(typeId) → typeId == 91
```

---

## 4. Authentication & Authorization

### Login Flow
```
POST /api/auth/login  {userLoginID, userPassword(plain)}
    ↓
PasswordHelper.Encode(password) → Base64(UTF8(plain))
    ↓
SP: Account_CheckUserExists(@UserLoginID, @UserPassword(B64), @BrowserName, @BrowserVersion, @IPAddress)
    → IsLoginAllowed, UserTypeID, UserID, UserLoginID, UserName, LoggedInSessionID,
      CourseID, DistrictID, PhotoPath
    ↓
SP: Account_UpdateLoginStatus(@UserID, @LoggedInSessionID)
    → shifts CurrentLoginDateTime → LastLoginDateTime in DB
    ↓
SP: Account_GetLoggedInUserDetails(@UserTypeID, @UserLoginID)
    → UserLoginID, UserType, UserName, CurrentLoginDateTime, LastLoginDateTime
    ↓
JwtHelper.GenerateToken(UserInfo, sessionId) → JWT (8h, HMAC-SHA256)
    ↓
Response: { success, token, user: UserInfo }
    ↓ (frontend)
AuthContext.login(token, user) → localStorage['mpkv_token'], localStorage['mpkv_user']
    ↓
navigate(user.dashBoardPath)  → /candidate/dashboard | /college/dashboard | /admin/dashboard
```

### JWT Claims
| Claim | Value |
|---|---|
| `sub` | UserID (long) |
| `unique_name` | UserLoginID (string) |
| `Name` | UserName |
| `UserTypeID` | int |
| `CourseID` | int |
| `DistrictID` | int |
| `DashBoardPath` | React route string |
| `SessionID` | long |
| `jti` | Guid |

### Protected Routes
Every post-login API controller uses `[Authorize]`. JWT validated via ASP.NET Core Bearer middleware. Each controller extracts claims:
```csharp
GetUserId()     → long.Parse(User.FindFirstValue(Sub))
GetLoginId()    → User.FindFirstValue(UniqueName)
GetUserTypeId() → int.Parse(User.FindFirstValue("UserTypeID"))
GetCourseId()   → int.Parse(User.FindFirstValue("CourseID"))
```

### Password Encoding
```
Encode: Convert.ToBase64String(Encoding.UTF8.GetBytes(plainText))
Decode: Encoding.UTF8.GetString(Convert.FromBase64String(encoded))
```
Passwords stored as Base64 in `Master_User`. Not a cryptographic hash.

---

## 5. Database Access Layer

### `DbAccess.cs` (Singleton)
All database calls go through this class. No raw SQL anywhere in the application.

```csharp
// First result set → DataTable (SqlDataAdapter.Fill)
GetDataTable(spName, DynamicParameters?) → DataTable

// All result sets → DataSet
GetDataSet(spName, DynamicParameters?) → DataSet

// Single value
ExecuteScalar(spName, DynamicParameters?) → object?

// No return
ExecuteNonQuery(spName, DynamicParameters?) → void

// Typed list (Dapper)
Query<T>(spName, DynamicParameters?) → IEnumerable<T>

// Single typed row
QuerySingleOrDefault<T>(spName, DynamicParameters?) → T?
```

Connection created per call from `DefaultConnection` string (SQL Server, `Integrated Security=True`).

### Stored Procedure Naming Convention
```
{Module}_{Operation}
Examples:
  Account_CheckUserExists
  ApplicationForm_RegisterCandidate
  Dashboard_GetCandidateDashboard
  College_GetCollegeSummary
  Admission_GetAllotmentStatus
  Fee_SetFeeTransaction
  Report_GetAllotmentReportByCourse
  Base_GetCandidateID
  Log_SaveUserActionDetails
```

---

## 6. Backend — Controllers & Endpoints

### `AuthController` — `api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login all user types |
| GET | `/api/auth/me` | JWT | Returns user info from token |

### `RegistrationController` — `api/registration`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/registration/check-status` | Is registration open? |
| GET | `/api/registration/masters` | Courses, Genders, SecurityQuestions |
| POST | `/api/registration/register` | Register new candidate |
| GET | `/api/registration/info?loginId=` | Get candidate name by login ID |

### `DashboardController` — `api/dashboard`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Candidate dashboard: status + rejected docs + progress flags |

### `ApplicationFormController` — `api/applicationform`
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/applicationform/personal` | Personal details |
| GET/POST | `/api/applicationform/address` | Address details |
| GET/POST | `/api/applicationform/category` | Category & reservation |
| GET/POST | `/api/applicationform/qualification` | Qualification details |
| GET/POST | `/api/applicationform/sports` | Sports details |
| GET | `/api/applicationform/options/available` | Eligible colleges list |
| GET | `/api/applicationform/options/shortlisted` | Shortlisted colleges |
| POST | `/api/applicationform/options/add` | Add college to shortlist |
| DELETE | `/api/applicationform/options/remove/{id}` | Remove from shortlist |
| POST | `/api/applicationform/options/save` | Save shortlist |
| GET/POST | `/api/applicationform/options/preferenced` | College preferences |
| POST | `/api/applicationform/options/preferences` | Save preferences |
| POST | `/api/applicationform/options/preferences/reset` | Reset preferences |
| GET | `/api/applicationform/photo-sign` | Get photo + sign URLs |
| POST | `/api/applicationform/upload-photo` | Upload photo (max 200KB) |
| POST | `/api/applicationform/upload-sign` | Upload signature (max 100KB) |
| POST | `/api/applicationform/photo-sign/save` | Save photo/sign step |
| GET | `/api/applicationform/documents` | Required documents list |
| POST | `/api/applicationform/documents/upload` | Upload document (max 10MB) |
| DELETE | `/api/applicationform/documents/delete/{id}` | Delete uploaded document |
| POST | `/api/applicationform/documents/save` | Save documents step |
| GET | `/api/applicationform/fee` | Application fee details |
| POST | `/api/applicationform/fee/initiate` | Start payment gateway |
| POST | `/api/applicationform/fee/proceed` | Proceed after fee |
| GET | `/api/applicationform/summary` | Full form summary (10 sections) |
| POST | `/api/applicationform/summary/lock` | Lock application form |
| GET | `/api/applicationform/unlock/eligibility` | Can form be unlocked? |
| POST | `/api/applicationform/unlock` | Unlock application form |
| GET | `/api/applicationform/masters/*` | Master data for each section |

### `FeeController` — `api/fee`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/fee/nsdl-response` | None | NSDL gateway callback |
| POST | `/api/fee/nsdl-push` | None | NSDL push notification |
| POST | `/api/fee/billdesk-response` | None | BillDesk callback |
| GET | `/api/fee/payment-success` | None | Payment success page data |
| GET | `/api/fee/payment-failed` | None | Payment failed page data |
| GET | `/api/fee/transaction-history` | JWT | Payment history |
| GET | `/api/fee/receipt/{txId}` | JWT | Transaction receipt |

### `HomeController` — `api/home`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/home?regionId=` | Home page data (menu, announcements, notices) |
| GET | `/api/home/search-college/masters` | Courses, districts, statuses |
| POST | `/api/home/search-college` | Search colleges |
| GET | `/api/home/allotment-list/masters` | Phases + courses |
| POST | `/api/home/allotment-list/colleges` | Colleges by course |
| POST | `/api/home/allotment-list` | Allotment list report |

### `AccountRecoveryController` — `api/account`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/account/masters` | None | Security questions |
| POST | `/api/account/forgot-login-id/send-otp` | None | OTP for forgot login |
| POST | `/api/account/forgot-login-id/verify-otp` | None | Verify forgot login OTP |
| POST | `/api/account/reset-password-by-security-question` | None | Reset via security Q |
| POST | `/api/account/send-otp/mobile` | None | Send OTP to mobile |
| POST | `/api/account/send-otp/email` | None | Send OTP to email |
| POST | `/api/account/verify-otp` | None | Verify OTP |
| POST | `/api/account/reset-password` | None | Reset password |
| POST | `/api/account/change-password` | JWT | Change password |
| POST | `/api/account/change-mobile` | JWT | Change mobile number |
| POST | `/api/account/change-email` | JWT | Change email address |
| GET | `/api/account/security-question` | JWT | Get current security Q |
| POST | `/api/account/change-security-question` | JWT | Change security Q |

### `CollegeController` — `api/college`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/college/dashboard` | Intake / Admitted / Vacancy + session info |
| GET | `/api/college/summary?collegeId=` | Full college profile (read-only) |
| GET | `/api/college/details?collegeId=` | Editable details + master dropdowns |
| POST | `/api/college/save?collegeId=` | Save college details |
| POST | `/api/college/activate?collegeId=` | Activate college (admin only) |
| POST | `/api/college/deactivate?collegeId=` | Deactivate college (admin only) |

### `CollegeAdminController` — `api/admin/college`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/college/list` | Filtered college list |
| GET | `/api/admin/college/passwords` | College passwords (decoded) |
| GET | `/api/admin/college/current-password/{code}` | Single college password |
| POST | `/api/admin/college/reset-password` | Reset college password |

### `AllotmentController` — `api/admission`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admission/phases` | Phase dropdown list + current phase |
| POST | `/api/admission/allotment-status` | Check allotment for ApplicationID + Phase |
| POST | `/api/admission/download-allotment-letter` | Log download, get print URL |
| POST | `/api/admission/refusal-fee` | Initiate refusal fee payment (phases 1/5/8) |
| GET | `/api/admission/allotment-summary` | Phase-wise allotment history |
| GET | `/api/admission/category-conversion-fee` | Category conversion fee details |
| POST | `/api/admission/category-conversion-fee/initiate` | Initiate conversion fee payment |

### `CheckApplicationIDController` — `api/admission`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admission/check-application-id` | Search candidate for 5 admission actions |

Flags: `ConfirmAdmission`, `CancelAdmission`, `PrintAdmissionLetter`, `PrintAdmissionCancellationLetter`, `PrintAdmissionRejectionLetter`

SP: `Admission_GetReportingDetails` — WHERE clause: `@UserTypeID IN (11,12) OR CAST(B.CollegeID AS VARCHAR) = @UserLoginID`

### `CounsellingController` — `api/counselling`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/counselling/phases` | Phases for spot round (UserTypeID 31/61 only) |
| POST | `/api/counselling/check` | Check eligibility: OfferSeat or CancelOfferedSeat |

### `ReportController` — `api/reports`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/phases` | All | Phase dropdown |
| GET | `/api/reports/allotment-by-course?phaseId=&collegeId=` | 61,11,12 | Allotment counts by course |
| GET | `/api/reports/composite-by-course?collegeId=` | 61,11,12 | Intake/admitted/vacancy by phase |
| GET | `/api/reports/eligible-for-counselling` | 61,11,12 | Pre-counselling candidate list |

### `UserProfileController` — `api/profile`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Get user name/mobile/email |
| POST | `/api/profile` | Update user name/mobile/email |

---

## 7. Frontend — Routing

### Route Guard
`ProtectedRoute` checks:
1. If `loading` → spinner
2. If `!isLoggedIn` → redirect to `/login` (replace)
3. If `!allowedRoles.includes(userTypeID)` → redirect to `/unauthorized`
4. Otherwise → render children

Additionally both `Home.jsx` and `Login.jsx` redirect to dashboard if already logged in:
```jsx
if (!authLoading && isLoggedIn && user?.dashBoardPath)
  return <Navigate to={user.dashBoardPath} replace />
```

### Public Routes (no auth required)
| Path | Page |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/register` | Registration |
| `/register/info` | Registration Info |
| `/forgot-login-id` | Forgot Login ID |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/search-college` | Search College |
| `/allotment` | Allotment List |
| `/about`, `/terms`, `/privacy`, `/refund`, `/disclaimer` | Static pages |
| `/payment-success`, `/payment-failed` | Fee gateway callbacks |
| `/unauthorized`, `*` | Error pages |

### Candidate Routes (UserTypeID 91)
| Path | Page |
|---|---|
| `/candidate/dashboard` | Dashboard (stepper + status) |
| `/candidate/personal` | Personal Details |
| `/candidate/address` | Address Details |
| `/candidate/category` | Category & Reservation |
| `/candidate/qualification` | Qualification Details |
| `/candidate/sports` | Sports Details |
| `/candidate/shortlist` | Shortlist Colleges |
| `/candidate/preferences` | Set Preferences |
| `/candidate/photo-sign` | Upload Photo & Sign |
| `/candidate/documents` | Upload Documents |
| `/candidate/fee` | Pay Application Fee |
| `/candidate/summary` | Application Form Summary + Lock |
| `/candidate/application-form` | View Locked Form |
| `/candidate/application-form/print` | Print (no layout) |
| `/candidate/unlock-form` | Unlock Form |
| `/candidate/change-password` | Change Password |
| `/candidate/change-mobile-email` | Change Mobile / Email |
| `/candidate/change-security-question` | Change Security Question |
| `/candidate/payment-history` | Payment History |
| `/candidate/payment-receipt/:txId` | Payment Receipt (no layout) |
| `/admission/allotment-status` | Check Allotment Status |
| `/admission/allotment-summary` | Allotment Summary |
| `/admission/pay-category-fee` | Pay Category Conversion Fee |

### College Routes (UserTypeID 61; some also 11/12)
| Path | Roles | Page |
|---|---|---|
| `/college/dashboard` | 61 | Dashboard (Intake/Admitted/Vacancy) |
| `/college/summary` | 61 | College Profile |
| `/college/edit` | 61 | Edit College Details |
| `/college/admission/allotment-status` | 61,11,12 | Check Allotment Status |
| `/college/admission/confirm` | 61,11,12 | Confirm Admission |
| `/college/admission/cancel` | 61,11,12 | Cancel Admission |
| `/college/admission/admission-letter` | 61,11,12 | Print Admission Letter |
| `/college/admission/rejection-letter` | 61,11,12 | Print Rejection Letter |
| `/college/admission/cancellation-letter` | 61,11,12 | Print Cancellation Letter |
| `/college/spot-round/offer-seat` | 61,31,11,12 | Spot Round — Check Eligibility |
| `/college/reports/allotment` | 61,11,12 | Allotment Report by Course |
| `/college/reports/composite` | 61,11,12 | Composite Admission Report |
| `/college/reports/eligible` | 61,11,12 | Eligible for Counselling |
| `/college/misc/update-profile` | 61,11,12 | Update Profile |
| `/college/misc/security-question` | 61,11,12 | Change Security Question |
| `/college/misc/change-password` | 61,11,12 | Change Password |

### Admin Routes (UserTypeID 11/12)
| Path | Page |
|---|---|
| `/admin/dashboard` | Admin Dashboard |
| `/admin/college/list` | College List |
| `/admin/college/summary` | College Summary |
| `/admin/college/edit` | Edit College |
| `/admin/college/passwords` | College Passwords |
| `/admin/college/reset-password` | Reset College Password |

---

## 8. Frontend — Auth & State

### `AuthContext.jsx`
```
localStorage keys:
  mpkv_token  → JWT string
  mpkv_user   → JSON-serialized UserInfo object

Exported:
  user           → UserInfo | null
  token          → string | null
  loading        → bool (true until localStorage read completes)
  login(t, u)    → sets state + localStorage
  logout()       → clears state + localStorage + sessionStorage
  updateUser(f)  → shallow merge into user (for formLocked, photoPath changes)
  isLoggedIn     → !!token
  isCandidate    → userTypeID === 91
  isCollege      → userTypeID === 61
  isAdmin        → userTypeID === 11 || 12
```

### `api.js` — Axios Configuration
```
baseURL:  /api  (proxied by Vite → http://localhost:7002)

Request interceptor:
  → Attaches Authorization: Bearer {mpkv_token}
  → Removes Content-Type for FormData (lets browser set boundary)

Response interceptor:
  → On 401: remove mpkv_token + mpkv_user from localStorage
           → redirect to /login
```

---

## 9. Frontend — Components

### `SiteHeader.jsx`
- Always rendered (all layouts)
- Left: MPKV logo (circular, bordered) + Marathi line + "Mahatma Phule Agriculture University" + English sub-line
- Right (not logged in): green "ADMISSIONS PORTAL" badge
- Right (logged in): circular candidate photo (or `/dummy-user.png`) → click → dropdown: UserName, LoginID, Sign Out button
- `resolvePhotoUrl()` unwraps `ViewFile.aspx?FileURL=` chains to raw Azure Blob URL

### `SiteFooter.jsx`
- 3 columns: Contact Us (address) · Important Links (5 static pages) · Helpdesk (phone + timing)
- Bottom bar: copyright + "Designed by Analytica Business Solutions (ABS)"

### `CandidateNavbar.jsx`
- Dark navbar (`bg: #14212e`) below `SiteHeader`
- Fetches `dashboardApi.getDashboard()` on mount → sets `isFormLocked` state
- **Form not locked:** Dashboard | Allotment/Admission Menu ▼ | Application Form ▼ | Miscellaneous ▼
- **Form locked:** Application Form ▼ shows only (Print Application Form, Unlock Application Form)
- Language toggle: EN / मराठी → `window.setLang()`
- Sign Out: custom modal → `logout()` + `window.location.replace('/')`

### `CollegeLayout.jsx`
- Shared by college (61) and admin (11/12)
- `isAdmin` → different nav items (College List, Passwords, Reset Password)
- College → Admission Menu ▼ | Spot Round Menu ▼ | Reports Menu ▼ | Miscellaneous ▼
- Sign Out modal same as candidate

### `PublicLayout.jsx`
- Home | Search College | Language toggle | + New Registration | Log In →
- Reads `localStorage.getItem('mpkv_lang')` on init → `useState(() => getLang())`
- `useEffect` restores Marathi on mount (800ms timeout to let Google Translate load)

### `ProgressStepper.jsx`
- 6-step visual stepper driven by `ApplicationProgressResponse` from `Dashboard_GetApplicationProgress` SP
- States: done (emerald ✓) · active (amber number) · pending (grey number)
- Steps: Registration → Personal Info → College Selection → Documents → Fee Payment → Lock Form
- Hover dropdown on each step shows sub-pages with completion badges

### `ProtectedRoute.jsx`
```
loading  → <LoadingSpinner />
!isLoggedIn → <Navigate to="/login" replace />
role mismatch → <Navigate to="/unauthorized" replace />
match → children
```

---

## 10. Language / Translation

### Strategy
Google Translate widget is loaded but **completely hidden** via CSS. All language switching goes through `window.setLang()` defined in `index.html`.

```javascript
window.setLang('en')
  → localStorage.setItem('mpkv_lang', 'en')
  → Clear googtrans cookie (path=/ and domain)
  → location.reload()

window.setLang('mr')
  → document.querySelector('.goog-te-combo').value = 'mr'
  → dispatchEvent(new Event('change'))
  → localStorage.setItem('mpkv_lang', 'mr')
```

**Persistence on page load** (`DOMContentLoaded`):
```javascript
if (localStorage.getItem('mpkv_lang') === 'mr') {
  setTimeout(() => { // wait 800ms for widget to initialise
    const s = document.querySelector('.goog-te-combo')
    if (s) { s.value = 'mr'; s.dispatchEvent(new Event('change')) }
  }, 800)
}
```

Every layout (PublicLayout, CandidateNavbar, CollegeLayout) reads `localStorage.getItem('mpkv_lang')` as initial state and calls `window.setLang()` on button click.

---

## 11. File Storage — Azure Blob

```
Storage Account : blobstorage2
Container       : jceceb
Project folder  : 2026_mpkv_rahuri_uat
Base URL        : https://blobstorage2.blob.core.windows.net

File paths by type:
  Photo      : {project}/photo/{CandidateID}_photo.jpg
  Signature  : {project}/sign/{CandidateID}_sign.jpg
  Documents  : {project}/documents/{CandidateID}_{DocumentID}.pdf
```

Upload goes through the backend (not direct to blob from browser). Controller receives multipart file, service uploads to Azure, saves blob URL to DB.

---

## 12. Payment Integration

### NSDL SurePay
```
MerchantID : MPKVDIPLOMA
RequestURL : https://pguat.nsdl.co.in/nsdlpg/
ReturnURL  : http://localhost:7002/api/fee/nsdl-response

Flow:
  POST /api/applicationform/fee/initiate {paymentGatewayID:1}
    → Fee_SetFeeTransaction → returns transactionID + paymentGatewayURL
    → Frontend redirects to paymentGatewayURL
    → NSDL calls back POST /api/fee/nsdl-response
    → Also NSDL push: POST /api/fee/nsdl-push
    → Backend redirects browser to /payment-success or /payment-failed
```

### BillDesk
```
MerchantId : MPKVDIPLOMA
RequestUrl : https://uat1.billdesk.com/u2/payments/ve1_2/orders/create
ReturnUrl  : http://localhost:7002/api/fee/billdesk-response

Same flow pattern as NSDL.
```

### Refusal Fee (phases 1, 5, 8 only)
If candidate wants to refuse an allotted seat, they must pay a refusal fee before refusing.
`POST /api/admission/refusal-fee` → same `Fee_SetFeeTransaction` SP.

---

## 13. Key Stored Procedures

### Authentication
| SP | Purpose |
|---|---|
| `Account_CheckUserExists` | Validate credentials, return UserID/UserTypeID/session |
| `Account_UpdateLoginStatus` | Shift current → last login time, update session |
| `Account_GetLoggedInUserDetails` | Get UserType, UserName, CurrentLoginDateTime, LastLoginDateTime |
| `Account_ResetPassword` | Change password (Base64 encoded) |
| `Account_GetUserPassword` | Get current password for display |
| `Base_GetOTP` | Generate OTP for a purpose/mobile |
| `Base_SaveOTPVerificationStatus` | Mark OTP as verified |

### Candidate Application Form
| SP | Purpose |
|---|---|
| `ApplicationForm_RegisterCandidate` | Create new candidate, returns 10-char LoginID |
| `Dashboard_GetCandidateDashboard` | ApplicationFormStatus + rejected documents |
| `Dashboard_GetApplicationProgress` | 15 boolean flags for stepper |
| `ApplicationForm_GetFormSummary` | All 10 form sections in one DataSet |
| `ApplicationForm_LockForm` | Lock the application |

### College & Admission
| SP | Purpose |
|---|---|
| `College_GetCollegeSummary` | Full college profile |
| `College_SaveCollegeDetails` | Save college info (22 params) |
| `Dashboard_GetCollegeDashboard` | Intake / Admitted / Vacancy |
| `Admission_GetPhaseList` | Phases for dropdown (filtered by UserTypeID + Flag) |
| `Admission_GetAllotmentStatus` | Full allotment details for a candidate (2 result sets) |
| `Admission_GetReportingDetails` | Candidate search for 5 admission actions |
| `Admission_SaveDownloadAllotmentLetterStatus` | Log allotment letter download event |

### Reports
| SP | Purpose |
|---|---|
| `Report_GetAllotmentReportByCourse` | Allotment/refused/admitted/rejected counts by course |
| `Report_GetCompositeAdmissionReportByCourse` | Intake/admitted per phase / vacancy (2 result sets) |
| `Report_GetCandidatesEligibleForCounselling` | Pre-counselling candidate list by CourseID |

---

## 14. Configuration Summary

### Backend — `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=localhost;Initial Catalog=2026_MPKV_Rahuri_Test;Integrated Security=True"
  },
  "Jwt": {
    "Key":         "MpkvDiplomaUnifiedSecretKey2026!XyZ#Secure@Portal",
    "Issuer":      "MpkvApi",
    "Audience":    "MpkvFrontend",
    "ExpiryHours": 8
  },
  "AppSettings": {
    "RegionID":         "1",
    "HelplineMobileNo": "+91-8806612998",
    "WebsiteHeader":    "Online Agriculture Diploma / Polytechnic / Mali Certificate Admissions - 2026"
  },
  "AzureBlob": {
    "FileMainContainer": "jceceb",
    "FileProject":       "2026_mpkv_rahuri_uat",
    "StorageURL":        "https://blobstorage2.blob.core.windows.net"
  },
  "AllowedOrigins": "http://localhost:5174"
}
```

### Frontend — Vite Proxy
Vite proxies `/api/*` → `http://localhost:7002` in development.

### CORS
Policy `"ReactApp"`: origin = `AllowedOrigins` config, any header, any method, allow credentials.

---

## 15. Application Flow Summary

### Candidate: Registration to Admission

```
1. Home page → New Registration
2. Registration form → SP: ApplicationForm_RegisterCandidate → LoginID issued
3. Login → JWT issued → /candidate/dashboard
4. Fill 6-step form:
   Step 1: Registration (done)
   Step 2: Personal + Address + Category + Qualification + Sports
   Step 3: Shortlist Colleges → Set Preferences
   Step 4: Upload Photo + Sign + Documents (Azure Blob)
   Step 5: Pay Application Fee (NSDL/BillDesk)
   Step 6: Review Summary → Lock Form
5. Attend EVC center for document verification
6. Counselling officer offers seat (spot round)
7. Candidate checks allotment → downloads Allotment Letter
8. Reports to allotted college
9. College confirms admission → Admission Letter generated
```

### College: Admission Confirmation

```
1. Login → /college/dashboard (shows Intake/Admitted/Vacancy)
2. Admission Menu → Confirm Admission
   → Enter ApplicationID + select Round
   → SP: Admission_GetReportingDetails returns candidate row
   → Click Select → go to Admission Summary page (TODO: not yet built)
   → College verifies documents, clicks Confirm → SP: Admission_ConfirmAdmission
3. Reports:
   → Allotment Report by Course (phase-wise counts)
   → Composite Report (all phases intake/admitted/vacancy)
   → Eligible for Counselling list
```

---

## 16. What Is Built vs What Remains

### ✅ Built & Working
- Full auth (login/logout/session/OTP/password recovery)
- Candidate registration + 6-step application form
- Candidate dashboard with progress stepper
- College dashboard (Intake/Admitted/Vacancy + college name)
- Check Allotment Status (college + candidate)
- College profile view + edit
- Admin college management (list/passwords/reset)
- All 3 reports (Allotment, Composite, Eligible)
- Check Application ID search (Confirm/Cancel/Print entry point)
- Spot Round eligibility check
- Language toggle (EN ↔ Marathi) across all pages
- Sign Out with confirmation modal on all layouts

### ❌ Remaining / Not Yet Built
- Admission Summary page (`/college/admission/summary`) — the full confirm/reject/cancel action page with document verification
- Print Letters (Admission/Rejection/Cancellation letter print pages)
- Offer Seat form (`/college/spot-round/offer-seat-form`)
- Cancel Offered Seat form (`/college/spot-round/cancel-offered-seat-form`)
- Allotment Letter print page
- `CheckApplicationID` currently shows "not allotted" for some candidates due to SP college filter issue being debugged

---

*Document generated: September 2026*
*Based on codebase: d:\ABS_Work\Project_.net\Mpkv_diplomaNew*
