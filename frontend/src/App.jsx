import { Routes, Route } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import PublicLayout      from './components/PublicLayout'
import CandidateLayout   from './components/CandidateLayout'
import CollegeLayout     from './components/CollegeLayout'

// ── Common pages ──────────────────────────────────────────────────────────────
import Home             from './pages/common/Home'
import Login            from './pages/common/Login'
import Registration     from './pages/common/Registration'
import RegistrationInfo from './pages/common/RegistrationInfo'
import ForgotLoginId    from './pages/common/ForgotLoginId'
import ForgotPassword   from './pages/common/ForgotPassword'
import ResetPassword    from './pages/common/ResetPassword'
import Unauthorized     from './pages/common/Unauthorized'
import NotFound         from './pages/common/NotFound'
import PrivacyPolicy    from './pages/common/PrivacyPolicy'
import TermsAndConditions from './pages/common/TermsAndCondition'
import RefundAndCancellationPolicy from './pages/common/RefundAndCancellation'
import Disclaimer from './pages/common/Disclaimer'
import AboutUs from './pages/common/AboutUs'

// ── Candidate pages (UserTypeID = 91) ─────────────────────────────────────────
import CandidateDashboard  from './pages/candidate/Dashboard'
import Personal            from './pages/candidate/Personal'
import Address             from './pages/candidate/Address'
import Category            from './pages/candidate/Category'
import Qualification       from './pages/candidate/Qualification'
import Sports              from './pages/candidate/Sports'
import Shortlist           from './pages/candidate/Shortlist'
import SetPreferences      from './pages/candidate/SetPreferences'
import PhotoSign           from './pages/candidate/PhotoSign'
import Documents           from './pages/candidate/Documents'
import Fee                 from './pages/candidate/Fee'
import PaymentSuccess      from './pages/candidate/PaymentSuccess'
import PaymentFailed       from './pages/candidate/PaymentFailed'
import Summary from './pages/candidate/Summary'
import ApplicationFormPrint from './pages/candidate/ApplicationFormPrint'
import ApplicationForm      from './pages/candidate/ApplicationForm'
import UnlockForm           from './pages/candidate/UnlockForm'
import ChangeMobileEmail    from './pages/candidate/ChangeMobileEmail'
import ChangeSecurityQuestion from './pages/candidate/ChangeSecurityQuestion'
import ChangePassword       from './pages/candidate/ChangePassword'
import PaymentHistory       from './pages/candidate/PaymentHistory'
import PaymentReceipt       from './pages/candidate/PaymentReceipt'
// import CheckAllotmentStatus from './pages/college/CheckAllotmentStatus'
import AllotmentSummary       from './pages/admission/AllotmentSummary'
import PayCategoryConversionFee from './pages/admission/PayCategoryConversionFee'
// ── College pages (UserTypeID = 61 + admin 11/12) ─────────────────────────────
import CollegeDashboard             from './pages/college/Dashboard'
import CollegeSummary               from './pages/college/Summary'
import CollegeEdit                  from './pages/college/EditDetails'
import CheckAllotmentStatus         from './pages/college/CheckAllotmentStatus'
import CheckApplicationID           from './pages/college/CheckApplicationID'
import CounsellingCheckApplicationID from './pages/college/CounsellingCheckApplicationID'
import AllotmentReportByCourse      from './pages/college/AllotmentReportByCourse'
import CompositeAdmissionReportByCourse from './pages/college/CompositeAdmissionReportByCourse'
import CandidatesEligibleForCounselling from './pages/college/CandidatesEligibleForCounselling'
import UpdateProfile                    from './pages/college/UpdateProfile'

// ── Admin pages (UserTypeID = 11 / 12) ────────────────────────────────────────
import AdminDashboard        from './pages/admin/Dashboard'
import AdminCollegeList      from './pages/admin/CollegeList'
import AdminCollegePasswords from './pages/admin/CollegePasswords'
import AdminResetPassword    from './pages/admin/ResetCollegePassword'





// ── ComingSoon placeholder ─────────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-tools text-emerald-600 text-xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">This page is under development.</p>
      </div>
    </div>
  )
}

// ── Shorthand wrappers ─────────────────────────────────────────────────────────
const C  = (roles, Layout, Page) => (
  <ProtectedRoute allowedRoles={roles}>
    <Layout><Page /></Layout>
  </ProtectedRoute>
)
const CC = (roles, Layout, title) => (
  <ProtectedRoute allowedRoles={roles}>
    <Layout><ComingSoon title={title} /></Layout>
  </ProtectedRoute>
)

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Public ───────────────────────────────────────────────────── */}
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Registration />} />
        <Route path="/register/info"   element={<RegistrationInfo />} />
        <Route path="/forgot-login-id" element={<ForgotLoginId />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/unauthorized"    element={<Unauthorized />} />

        <Route path="/search-college" element={<PublicLayout><ComingSoon title="Search Colleges" /></PublicLayout>} />
        <Route path="/allotment"      element={<PublicLayout><ComingSoon title="Allotment List" /></PublicLayout>} />
        <Route path="/about"          element={<PublicLayout><AboutUs/></PublicLayout>} />
        <Route path="/terms"          element={<PublicLayout><TermsAndConditions/></PublicLayout>} />
        <Route path="/privacy"        element={<PublicLayout><PrivacyPolicy/></PublicLayout>} />
        <Route path="/refund"         element={<PublicLayout><RefundAndCancellationPolicy/></PublicLayout>} />
        <Route path="/disclaimer"     element={<PublicLayout><Disclaimer/></PublicLayout>} />

        {/* Payment gateway callbacks — no auth, no layout */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed"  element={<PaymentFailed />} />

        {/* ── Candidate routes (UserTypeID = 91) ────────────────────────── */}
        <Route path="/candidate/dashboard"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><CandidateDashboard /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/personal"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Personal /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/address"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Address /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/category"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Category /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/qualification"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Qualification /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/sports"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Sports /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/shortlist"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Shortlist /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/preferences"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><SetPreferences /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/photo-sign"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><PhotoSign /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/documents"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Documents /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/fee"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Fee /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/summary"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Summary/></CandidateLayout></ProtectedRoute>} />
        
        <Route path="/candidate/application-form"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><ApplicationForm /></CandidateLayout></ProtectedRoute>} />
        {/* Print page — no layout, auto-prints, opens in new window like old ApplicationFormPrint.aspx */}
        <Route path="/candidate/application-form/print"
          element={<ProtectedRoute allowedRoles={[91]}><ApplicationFormPrint /></ProtectedRoute>} />
        <Route path="/candidate/unlock-form"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><UnlockForm /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/change-password"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><ChangePassword /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/change-mobile-email"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><ChangeMobileEmail /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/change-security-question"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><ChangeSecurityQuestion /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/payment-history"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><PaymentHistory /></CandidateLayout></ProtectedRoute>} />
        {/* ── Admission / Allotment pages — shared /admission/... routes ── */}
        <Route path="/admission/pay-category-fee"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><PayCategoryConversionFee /></CandidateLayout></ProtectedRoute>} />
        <Route path="/admission/allotment-status"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><CheckAllotmentStatus /></CandidateLayout></ProtectedRoute>} />
        <Route path="/admission/allotment-summary"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><AllotmentSummary /></CandidateLayout></ProtectedRoute>} />
        {/* Print receipt — no layout, auto-prints, new window */}
        <Route path="/candidate/payment-receipt/:transactionId"
          element={<ProtectedRoute allowedRoles={[91]}><PaymentReceipt /></ProtectedRoute>} />
        {/* ── College (61) ─────────────────────────────────────────────── */}
        <Route path="/college/dashboard" element={C([61], CollegeLayout, CollegeDashboard)} />
        <Route path="/college/summary"   element={C([61], CollegeLayout, CollegeSummary)} />
        <Route path="/college/edit"      element={C([61], CollegeLayout, CollegeEdit)} />

        {/* Admission Menu */}
        <Route path="/college/admission/allotment-status"
          element={C([61,11,12], CollegeLayout, CheckAllotmentStatus)} />
        <Route path="/college/admission/confirm"
          element={C([61,11,12], CollegeLayout, CheckApplicationID)} />
        <Route path="/college/admission/cancel"
          element={C([61,11,12], CollegeLayout, CheckApplicationID)} />
        <Route path="/college/admission/admission-letter"
          element={C([61,11,12], CollegeLayout, CheckApplicationID)} />
        <Route path="/college/admission/rejection-letter"
          element={C([61,11,12], CollegeLayout, CheckApplicationID)} />
        <Route path="/college/admission/cancellation-letter"
          element={C([61,11,12], CollegeLayout, CheckApplicationID)} />

        {/* Spot Round Menu */}
        <Route path="/college/spot-round/offer-seat"
          element={C([61,31,11,12], CollegeLayout, CounsellingCheckApplicationID)} />

        {/* Reports Menu */}
        <Route path="/college/reports/allotment"
          element={C([61,11,12], CollegeLayout, AllotmentReportByCourse)} />
        <Route path="/college/reports/composite"
          element={C([61,11,12], CollegeLayout, CompositeAdmissionReportByCourse)} />
        <Route path="/college/reports/composite"
          element={CC([61,11,12], CollegeLayout, 'Composite Admission Report')} />
        <Route path="/college/reports/eligible"
          element={C([61,11,12], CollegeLayout, CandidatesEligibleForCounselling)} />

        {/* Miscellaneous */}
        <Route path="/college/misc/update-profile"
          element={C([61,11,12], CollegeLayout, UpdateProfile)} />
        {/* Change Security Question and Change Password — reuse candidate page components */}
        <Route path="/college/misc/security-question"
          element={C([61,11,12], CollegeLayout, ChangeSecurityQuestion)} />
        <Route path="/college/misc/change-password"
          element={C([61,11,12], CollegeLayout, ChangePassword)} />

        {/* ── Admin (11, 12) ────────────────────────────────────────────── */}
        <Route path="/admin/dashboard"              element={C([11,12], CollegeLayout, AdminDashboard)} />
        <Route path="/admin/college/list"           element={C([11,12], CollegeLayout, AdminCollegeList)} />
        <Route path="/admin/college/summary"        element={C([11,12], CollegeLayout, CollegeSummary)} />
        <Route path="/admin/college/edit"           element={C([11,12], CollegeLayout, CollegeEdit)} />
        <Route path="/admin/college/passwords"      element={C([11,12], CollegeLayout, AdminCollegePasswords)} />
        <Route path="/admin/college/reset-password" element={C([11,12], CollegeLayout, AdminResetPassword)} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AuthProvider>
  )
}
